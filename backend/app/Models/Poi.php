<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Poi extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'location',
        'type',
    ];

    /**
     * Scope a query to search POIs by name or address.
     */
    public function scopeSearch($query, $term)
    {
        return $query->where('name', 'ilike', "%{$term}%")
                     ->orWhere('address', 'ilike', "%{$term}%");
    }

    /**
     * Get coordinates as an array [latitude, longitude].
     * PostGIS POINT structure is (longitude latitude) / (X Y).
     */
    public function getCoordinatesAttribute()
    {
        $res = DB::select("SELECT ST_X(location::geometry) as lon, ST_Y(location::geometry) as lat FROM pois WHERE id = ?", [$this->id]);
        
        if (empty($res)) return [0, 0];
        
        return [
            floatval($res[0]->lat), // Index 0 = Latitude (Y)
            floatval($res[0]->lon)  // Index 1 = Longitude (X)
        ];
    }
}
