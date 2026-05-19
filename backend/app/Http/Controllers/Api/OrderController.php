<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Driver;
use App\Models\DriverLocation;
use App\Events\NewOrderAvailable;
use App\Events\OrderStatusUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    /**
     * User: Create a new trip request.
     */
    public function store(Request $request)
    {
        $request->validate([
            'pickup_lat' => 'required|numeric',
            'pickup_lng' => 'required|numeric',
            'dropoff_lat' => 'required|numeric',
            'dropoff_lng' => 'required|numeric',
            'pickup_address' => 'required|string',
            'dropoff_address' => 'required|string',
        ]);

        $order = Order::create([
            'user_id' => $request->user()->id,
            'pickup_location' => DB::raw("ST_GeomFromText('POINT({$request->pickup_lng} {$request->pickup_lat})', 4326)"),
            'dropoff_location' => DB::raw("ST_GeomFromText('POINT({$request->dropoff_lng} {$request->dropoff_lat})', 4326)"),
            'pickup_address' => $request->pickup_address,
            'dropoff_address' => $request->dropoff_address,
            'status' => 'searching',
            'price' => 15000,
        ]);

        // LOGGING FOR DEBUG
        Log::info("DEBUG ORDER: User at ({$request->pickup_lat}, {$request->pickup_lng}). Searching drivers...");

        // INCREASE RADIUS TO 50KM TEMPORARILY FOR TESTING
        $nearbyDrivers = DB::table('driver_locations')
            ->join('drivers', 'driver_locations.driver_id', '=', 'drivers.id')
            ->select('drivers.id', 'drivers.user_id', DB::raw("ST_Distance(location, ST_GeogFromText('POINT({$request->pickup_lng} {$request->pickup_lat})')) as distance"))
            ->where('drivers.is_online', true)
            ->whereRaw("ST_DWithin(location, ST_GeogFromText('POINT({$request->pickup_lng} {$request->pickup_lat})'), 50000)")
            ->get();

        Log::info("DEBUG ORDER: Found " . $nearbyDrivers->count() . " drivers within 50KM.");

        foreach ($nearbyDrivers as $driver) {
            Log::info("DEBUG ORDER: Sending to Driver UserID: {$driver->user_id}. Distance: {$driver->distance} meters.");
            
            // 1. Send to Private Channel (Safe)
            broadcast(new NewOrderAvailable($order, $driver->user_id))->toOthers();
            
            // 2. ALSO SEND TO PUBLIC CHANNEL (For testing if private auth fails)
            broadcast(new NewOrderAvailable($order, null))->toOthers();
        }

        return response()->json([
            'message' => 'Mencari Driver AJS...',
            'order' => $order,
            'debug_nearby' => $nearbyDrivers->count()
        ], 201);
    }

    /**
     * Driver: Accept a trip request.
     */
    public function accept(Request $request, $id)
    {
        $order = Order::where('status', 'searching')->findOrFail($id);
        $driver = $request->user()->driver;

        if (!$driver) {
            return response()->json(['message' => 'Anda bukan Driver aktif.'], 403);
        }

        $order->update([
            'driver_id' => $driver->id,
            'status' => 'accepted'
        ]);

        broadcast(new OrderStatusUpdated($order))->toOthers();
        
        return response()->json(['message' => 'Order berhasil diterima!', 'order' => $order->load('user')]);
    }

    /**
     * Get order status.
     */
    public function show($id)
    {
        $order = Order::with(['driver.user', 'user'])->findOrFail($id);
        return response()->json($order);
    }
}
