<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'business_type_id',
        'schema_name',
        'owner_user_id',
        'status',
    ];

    public function businessType(): BelongsTo
    {
        return $this->belongsTo(BusinessType::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function staff(): HasMany
    {
        return $this->hasMany(TenantStaff::class);
    }

    /**
     * Platform admin, this tenant's owner, or one of its active staff --
     * the same "can manage this tenant" check used both to gate catalog
     * writes and to decide whether a user sees every order/booking for
     * this tenant or only their own.
     */
    public function isManagedBy(User $user): bool
    {
        if ($user->role?->slug === 'admin') {
            return true;
        }

        if ($this->owner_user_id === $user->id) {
            return true;
        }

        return $this->staff()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();
    }
}
