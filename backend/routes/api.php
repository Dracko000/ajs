<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminDriverController;
use App\Http\Controllers\Api\DriverLocationController;
use App\Http\Controllers\Api\ManifestController;
use App\Http\Controllers\Api\MidtransController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\PoiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/pois/search', [PoiController::class, 'index']);
Route::post('/midtrans/callback', [MidtransController::class, 'callback']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/wallet', [WalletController::class, 'show']);
    Route::post('/wallet/deposit', [MidtransController::class, 'getToken']); 
    Route::post('/wallet/pay', [WalletController::class, 'paySubscription']);
    // Admin Specific - Driver Management
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/drivers/pending', [\App\Http\Controllers\Api\AdminDriverController::class, 'pendingDrivers']);
        Route::post('/admin/drivers/{id}/status', [\App\Http\Controllers\Api\AdminDriverController::class, 'updateStatus']);
        Route::post('/admin/documents/{id}/verify', [\App\Http\Controllers\Api\AdminDriverController::class, 'verifyDocument']);
        Route::get('/admin/assignments', [\App\Http\Controllers\Api\ManifestController::class, 'allAssignments']);
        Route::post('/admin/assignments', [\App\Http\Controllers\Api\ManifestController::class, 'assign']);
    });

    // Driver Specific
    Route::middleware('role:driver')->group(function () {
        Route::post('/driver/location', [DriverLocationController::class, 'update']);
        Route::get('/driver/manifest', [\App\Http\Controllers\Api\ManifestController::class, 'myManifest']);
        Route::post('/driver/manifest/{id}/status', [\App\Http\Controllers\Api\ManifestController::class, 'updateStatus']);
        Route::post('/wallet/withdraw', [\App\Http\Controllers\Api\WithdrawalController::class, 'withdraw']);
    });
});
