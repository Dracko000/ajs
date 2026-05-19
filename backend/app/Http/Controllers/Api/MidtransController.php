<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\Snap;
use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MidtransController extends Controller
{
    public function __construct()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized = config('midtrans.is_sanitized');
        Config::$is3ds = config('midtrans.is_3ds');
    }

    /**
     * Create Snap Token for Top Up.
     */
    public function getToken(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10000',
        ]);

        $user = $request->user();
        $orderId = 'TOPUP-' . time() . '-' . $user->id;

        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int)$request->amount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
            ],
            'callbacks' => [
                'finish' => env('MIDTRANS_CALLBACK_URL', 'https://ajs-shuttle.ngrok-free.app/api/midtrans/callback')
            ],
            'usage_limit' => 1,
        ];

        try {
            $snapToken = Snap::getSnapToken($params);
            return response()->json([
                'token' => $snapToken,
                'redirect_url' => (config('midtrans.is_production') ? "https://app.midtrans.com/snap/v2/vtweb/" : "https://app.sandbox.midtrans.com/snap/v2/vtweb/") . $snapToken
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Midtrans Notification Webhook.
     */
    public function callback(Request $request)
    {
        $notification = $request->all();
        Log::info('Midtrans Callback Received:', $notification);

        $serverKey = config('midtrans.server_key');
        $orderId = $notification['order_id'];
        $statusCode = $notification['status_code'];
        $grossAmount = $notification['gross_amount'];
        $signatureKey = $notification['signature_key'];

        // Verify Signature
        $hashed = hash("sha512", $orderId . $statusCode . $grossAmount . $serverKey);
        if ($hashed !== $signatureKey) {
            Log::error('Midtrans Invalid Signature for Order: ' . $orderId);
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $transactionStatus = $notification['transaction_status'];
        $type = $notification['payment_type'];

        // Extract User ID from Order ID (TOPUP-TIMESTAMP-USERID)
        $parts = explode('-', $orderId);
        $userId = end($parts);

        if ($transactionStatus == 'settlement' || ($transactionStatus == 'capture' && $notification['fraud_status'] == 'accept')) {
            DB::transaction(function () use ($userId, $grossAmount, $orderId, $type) {
                $wallet = Wallet::firstOrCreate(['user_id' => $userId], ['balance' => 0]);
                
                // Prevent duplicate processing using external ID in description
                $exists = Transaction::where('description', 'LIKE', "%$orderId%")->exists();
                if (!$exists) {
                    $wallet->deposit($grossAmount, "Top Up Midtrans ($type): $orderId");
                    Log::info("Wallet Updated for User $userId: +$grossAmount");
                }
            });
        } else if ($transactionStatus == 'cancel' || $transactionStatus == 'deny' || $transactionStatus == 'expire') {
            Log::info("Transaction $orderId failed with status: $transactionStatus");
        }

        return response()->json(['status' => 'OK']);
    }
}
