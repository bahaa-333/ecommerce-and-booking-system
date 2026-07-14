<?php

namespace App\Models;

use App\Enums\TenantStaffRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TenantStaff extends Model
{
    protected $fillable = [
        'tenant_id',
        'user_id',
        'role',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'role' => TenantStaffRole::class,
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function timeSlots(): BelongsToMany
    {
        return $this->belongsToMany(ServiceTimeSlot::class, 'service_time_slot_staff');
    }
}
