<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\DriverLocationUpdated;
use Illuminate\Http\Request;
use App\Models\DriverManifest;

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

        // Find all active manifests (picked_up) for this driver to notify parents
        $activeManifests = DriverManifest::where('driver_id', $driver->id)
            ->where('status', 'picked_up')
            ->with('student')
            ->get();

        foreach ($activeManifests as $manifest) {
            broadcast(new DriverLocationUpdated(
                $driver,
                $request->latitude,
                $request->longitude,
                $manifest->student->parent_id,
                $request->heading
            ))->toOthers();
        }

        return response()->json(['status' => 'Location updated and broadcast to active parents']);
    }
}
