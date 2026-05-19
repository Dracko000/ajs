<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    /**
     * Get current user wallet balance and history.
     */
    public function show(Request $request)
    {
        $wallet = $request->user()->wallet()->firstOrCreate(['user_id' => $request->user()->id], ['balance' => 0]);
        
        return response()->json([
            'balance' => $wallet->balance,
            'transactions' => $wallet->transactions()->latest()->limit(20)->get()
        ]);
    }

    /**
     * Simulation: Top up wallet.
     */
    public function deposit(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:10000']);
        
        $wallet = $request->user()->wallet()->firstOrCreate(['user_id' => $request->user()->id]);
        $wallet->deposit($request->amount, "Top up saldo via Virtual Account");

        return response()->json(['message' => 'Top up berhasil', 'new_balance' => $wallet->balance]);
    }

    /**
     * Simulation: Pay for subscription.
     */
    public function paySubscription(Request $request)
    {
        $request->validate(['amount' => 'required|numeric']);
        
        $wallet = $request->user()->wallet()->first();

        try {
            $wallet->withdraw($request->amount, "Pembayaran Langganan AJS Bulanan", "payment");
            return response()->json(['message' => 'Pembayaran berhasil']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
