<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DriverStatusController extends Controller
{
    /**
     * Update driver's online/offline status.
     */
    public function toggle(Request $request)
    {
        $request->validate(['is_online' => 'required|boolean']);
        
        $driver = $request->user()->driver;
        if (!$driver) return response()->json(['message' => 'Profile Driver tidak ditemukan'], 404);

        $driver->update(['is_online' => $request->is_online]);

        return response()->json([
            'status' => 'success',
            'is_online' => $driver->is_online
        ]);
    }
}
