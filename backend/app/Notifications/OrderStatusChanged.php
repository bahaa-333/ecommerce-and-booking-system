<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Notifications\Notification;

class OrderStatusChanged extends Notification
{
    /**
     * Not queued: sent synchronously, in the same request that changed the
     * status, while the 'tenant' connection is still pointed at $tenant.
     */
    public function __construct(
        private readonly Order $order,
        private readonly Tenant $tenant,
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
            'type' => 'order_status_changed',
            'tenant_slug' => $this->tenant->slug,
            'tenant_name' => $this->tenant->name,
            'order_id' => $this->order->id,
            'status' => $this->order->status->value,
            'total_amount' => $this->order->total_amount,
        ];
    }
}
