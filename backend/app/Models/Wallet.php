<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'balance'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Safely add funds to the wallet.
     */
    public function deposit($amount, $description = 'Top up saldo', $type = 'deposit')
    {
        return DB::transaction(function () use ($amount, $description, $type) {
            // Re-fetch with lock
            $wallet = DB::table('wallets')->where('id', $this->id)->lockForUpdate()->first();
            
            $this->increment('balance', $amount);
            return $this->transactions()->create([
                'amount' => $amount,
                'type' => $type,
                'description' => $description
            ]);
        });
    }

    /**
     * Safely remove funds from the wallet.
     */
    public function withdraw($amount, $description, $type = 'withdrawal')
    {
        return DB::transaction(function () use ($amount, $description, $type) {
            // Lock the row before checking balance
            $wallet = DB::table('wallets')->where('id', $this->id)->lockForUpdate()->first();

            if ($wallet->balance < $amount) {
                throw new \Exception("Saldo tidak mencukupi.");
            }

            $this->decrement('balance', $amount);
            return $this->transactions()->create([
                'amount' => -$amount,
                'type' => $type,
                'description' => $description
            ]);
        });
    }
}
