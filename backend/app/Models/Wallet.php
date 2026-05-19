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
        if ($this->balance < $amount) {
            throw new \Exception("Saldo tidak mencukupi.");
        }

        return DB::transaction(function () use ($amount, $description, $type) {
            $this->decrement('balance', $amount);
            return $this->transactions()->create([
                'amount' => -$amount,
                'type' => $type,
                'description' => $description
            ]);
        });
    }
}
