<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\DriverLocationUpdated;
use Illuminate\Http\Request;

class DriverLocationController extends Controller
{
    public function update(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'heading' => 'nullable|numeric',
        ]);

        $driver = $request->user()->driver;

        if (!$driver) {
            return response()->json(['message' => 'Driver profile not found'], 404);
        }

        // In a real app, you'd save this to the database (DriverLocation model)
        // For high-frequency updates, broadcasting alone might be sufficient or use Redis.
        
        broadcast(new DriverLocationUpdated(
            $driver,
            $request->latitude,
            $request->longitude,
            $request->heading
        ))->toOthers();

        return response()->json(['status' => 'Location updated']);
    }
}
