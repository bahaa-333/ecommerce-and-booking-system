<?php

namespace App\Models;

use App\Enums\CatalogStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'capacity',
        'duration_minutes',
        'advance_booking_minutes',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => CatalogStatus::class,
            'price' => 'decimal:2',
        ];
    }

    public function timeSlots(): HasMany
    {
        return $this->hasMany(ServiceTimeSlot::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
