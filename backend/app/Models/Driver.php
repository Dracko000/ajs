<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'vehicle_number',
        'vehicle_model',
        'is_online',
        'rating',
    ];

    protected $casts = [
        'is_online' => 'boolean',
        'rating' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function locations()
    {
        return $this->hasMany(DriverLocation::class);
    }

    public function lastLocation()
    {
        return $this->hasOne(DriverLocation::class)->latestOfMany();
    }
}
