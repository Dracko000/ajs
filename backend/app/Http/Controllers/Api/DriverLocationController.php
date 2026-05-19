<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\DriverLocationUpdated;
use Illuminate\Http\Request;
use App\Models\DriverManifest;
use App\Models\DriverLocation;
use Illuminate\Support\Facades\DB;

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

        // 1. PERSIST TO DATABASE (Crucial for proximity search ST_DWithin)
        DriverLocation::updateOrCreate(
            ['driver_id' => $driver->id],
            [
                'location' => DB::raw("ST_GeomFromText('POINT({$request->longitude} {$request->latitude})', 4326)"),
                'heading' => $request->heading
            ]
        );

        // 2. Broadcast to active parents during trip
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

        return response()->json(['status' => 'Location saved and broadcasted']);
    }
}
