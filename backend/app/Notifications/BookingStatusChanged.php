<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Tenant;
use Illuminate\Notifications\Notification;

class BookingStatusChanged extends Notification
{
    /**
     * Not queued: sent synchronously, in the same request (or scheduled
     * command tick) that changed the status, while the 'tenant' connection
     * is still pointed at $tenant.
     */
    public function __construct(
        private readonly Booking $booking,
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
            'type' => 'booking_status_changed',
            'tenant_slug' => $this->tenant->slug,
            'tenant_name' => $this->tenant->name,
            'booking_id' => $this->booking->id,
            'status' => $this->booking->status->value,
            'starts_at' => $this->booking->starts_at->toIso8601String(),
        ];
    }
}
