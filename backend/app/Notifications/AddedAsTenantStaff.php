<?php

namespace App\Notifications;

use App\Enums\TenantStaffRole;
use App\Models\Tenant;
use Illuminate\Notifications\Notification;

class AddedAsTenantStaff extends Notification
{
    public function __construct(
        private readonly Tenant $tenant,
        private readonly TenantStaffRole $role,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'added_as_tenant_staff',
            'tenant_slug' => $this->tenant->slug,
            'tenant_name' => $this->tenant->name,
            'role' => $this->role->value,
        ];
    }
}
