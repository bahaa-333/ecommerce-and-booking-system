<?php

namespace App\Models;

use App\Enums\CatalogStatus;
use App\Enums\DurationUnit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $connection = 'tenant';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'capacity',
        'duration_value',
        'duration_unit',
        'advance_booking_value',
        'advance_booking_unit',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => CatalogStatus::class,
            'price' => 'decimal:2',
            'duration_unit' => DurationUnit::class,
            'advance_booking_unit' => DurationUnit::class,
        ];
    }

    public function images(): HasMany
    {
        return $this->hasMany(ServiceImage::class)->orderBy('position');
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
