<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Xendit\Configuration;
use Xendit\Disbursement\DisbursementApi;
use Xendit\Disbursement\CreateDisbursementRequest;
use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class WithdrawalController extends Controller
{
    public function __construct()
    {
        Configuration::setApiKey(config('xendit.api_key'));
    }

    /**
     * Driver requests a withdrawal.
     */
    public function withdraw(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:50000',
            'bank_code' => 'required|string',
            'account_holder_name' => 'required|string',
            'account_number' => 'required|string',
        ]);

        $user = $request->user();
        $wallet = $user->wallet;

        if (!$wallet || $wallet->balance < $request->amount) {
            return response()->json(['message' => 'Saldo tidak mencukupi'], 400);
        }

        return DB::transaction(function () use ($user, $wallet, $request) {
            // 1. Deduct wallet balance first (Internal)
            $wallet->withdraw($request->amount, "Penarikan Dana (Withdrawal) ke {$request->bank_code}", "withdrawal");

            // 2. Trigger Xendit Payout (Real-time Transfer)
            $apiInstance = new DisbursementApi();
            $disbursementRequest = new CreateDisbursementRequest([
                'external_id' => 'WD-' . time() . '-' . $user->id,
                'amount' => (float)$request->amount,
                'bank_code' => $request->bank_code,
                'account_holder_name' => $request->account_holder_name,
                'account_number' => $request->account_number,
                'description' => "Withdrawal AJS Driver: {$user->name}"
            ]);

            try {
                $result = $apiInstance->createDisbursement($disbursementRequest);
                return response()->json([
                    'message' => 'Permintaan penarikan diproses',
                    'status' => $result['status'],
                    'id' => $result['id']
                ]);
            } catch (\Exception $e) {
                // If Xendit fails, rollback internal balance? 
                // In production, we might want to flag it for manual retry.
                throw $e; 
            }
        });
    }
}
