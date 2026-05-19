<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Poi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PoiController extends Controller
{
    /**
     * Search for POIs.
     */
    public function index(Request $request)
    {
        $query = $request->query('q');
        
        // Jika query kosong, ambil semua POI (untuk admin agar bisa melihat semua titik di peta)
        if (empty($query)) {
            $pois = Poi::all();
        } else if (strlen($query) < 3) {
            return response()->json([]);
        } else {
            $pois = Poi::search($query)->limit(10)->get();
        }

        return response()->json($pois->map(function ($poi) {
            $coords = $poi->coordinates;
            return [
                'id' => $poi->id,
                'name' => $poi->name,
                'display_name' => $poi->address,
                'lat' => $coords[0], // Latitude (Y)
                'lon' => $coords[1], // Longitude (X)
                'type' => $poi->type,
                'is_custom' => true,
            ];
        }));
    }

    /**
     * Admin: Store a new custom POI.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'address' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'type' => 'required|in:school,pickup_point,residential,other',
        ]);

        // Pastikan urutan ST_GeomFromText adalah Longitude (X) kemudian Latitude (Y)
        $poi = Poi::create([
            'name' => $request->name,
            'address' => $request->address,
            'type' => $request->type,
            'location' => DB::raw("ST_GeomFromText('POINT({$request->longitude} {$request->latitude})', 4326)"),
        ]);

        return response()->json($poi, 201);
    }
}
