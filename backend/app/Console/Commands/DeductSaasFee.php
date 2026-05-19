<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Driver;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;

class DeductSaasFee extends Command
{
    /**
     * Nama perintah yang dijalankan di terminal.
     */
    protected $signature = 'ajs:deduct-saas-fee';

    /**
     * Deskripsi perintah.
     */
    protected $description = 'Memotong biaya sewa aplikasi (SaaS) mingguan dari saldo driver';

    /**
     * Logika eksekusi perintah.
     */
    public function handle()
    {
        $this->info('Memulai proses pemotongan biaya SaaS mingguan...');
        
        $feeAmount = 20000; // Rp 20.000
        $drivers = Driver::all(); // Bisa difilter hanya driver aktif

        foreach ($drivers as $driver) {
            $user = $driver->user;
            $wallet = $user->wallet()->firstOrCreate(['user_id' => $user->id], ['balance' => 0]);

            try {
                DB::transaction(function () use ($wallet, $feeAmount) {
                    $wallet->withdraw($feeAmount, "Biaya Sewa Aplikasi AJS (Mingguan)", "fee");
                });
                $this->info("Berhasil memotong saldo Driver: {$user->name}");
            } catch (\Exception $e) {
                $this->error("Gagal memotong saldo Driver: {$user->name} (Saldo mungkin tidak cukup)");
            }
        }

        $this->info('Proses selesai.');
    }
}
