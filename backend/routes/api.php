<?php

use App\Http\Controllers\Api\MidtransController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\PoiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/pois/search', [PoiController::class, 'index']);

// Midtrans Webhook (Must be accessible without auth)
Route::post('/midtrans/callback', [MidtransController::class, 'callback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/wallet', [WalletController::class, 'show']);
    Route::post('/wallet/deposit', [MidtransController::class, 'getToken']); 
    Route::post('/wallet/pay', [WalletController::class, 'paySubscription']);
    Route::post('/wallet/withdraw', [\App\Http\Controllers\Api\WithdrawalController::class, 'withdraw']);

    Route::post('/driver/location', [DriverLocationController::class, 'update']);

    // Driver Onboarding
    Route::get('/driver/onboarding/status', [\App\Http\Controllers\Api\DriverRegistrationController::class, 'status']);
    Route::post('/driver/onboarding/register', [\App\Http\Controllers\Api\DriverRegistrationController::class, 'register']);
    Route::post('/driver/onboarding/upload', [\App\Http\Controllers\Api\DriverRegistrationController::class, 'uploadDocument']);

    // Admin Specific - Driver Management
    Route::get('/admin/drivers/pending', [\App\Http\Controllers\Api\AdminDriverController::class, 'pendingDrivers']);
    Route::post('/admin/drivers/{id}/status', [\App\Http\Controllers\Api\AdminDriverController::class, 'updateStatus']);
    Route::post('/admin/documents/{id}/verify', [\App\Http\Controllers\Api\AdminDriverController::class, 'verifyDocument']);
    Route::get('/admin/assignments', [\App\Http\Controllers\Api\ManifestController::class, 'allAssignments']);
    Route::post('/admin/assignments', [\App\Http\Controllers\Api\ManifestController::class, 'assign']);

    // Manifest (Driver)
    Route::get('/driver/manifest', [\App\Http\Controllers\Api\ManifestController::class, 'myManifest']);
    Route::post('/driver/manifest/{id}/status', [\App\Http\Controllers\Api\ManifestController::class, 'updateStatus']);
});
