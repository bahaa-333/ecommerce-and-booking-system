<?php

namespace App\Models;

use App\Enums\ServiceAvailabilityType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceTimeSlot extends Model
{
    protected $connection = 'tenant';

    protected $fillable = [
        'service_id',
        'availability_type',
        'day_of_week',
        'start_time',
        'end_time',
        'starts_on',
        'ends_on',
    ];

    protected function casts(): array
    {
        return [
            'availability_type' => ServiceAvailabilityType::class,
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function staff(): BelongsToMany
    {
        return $this->belongsToMany(TenantStaff::class, 'service_time_slot_staff');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
