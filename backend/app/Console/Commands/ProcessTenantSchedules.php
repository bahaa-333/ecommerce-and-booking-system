<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\Order;
use App\Models\Tenant;
use App\Notifications\BookingStatusChanged;
use App\Notifications\OrderStatusChanged;
use App\Services\OrderCancellationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class ProcessTenantSchedules extends Command
{
    /**
     * @var string
     */
    protected $signature = 'tenants:process-schedules';

    /**
     * @var string
     */
    protected $description = 'Auto-complete past-due bookings and auto-cancel stale pending orders/bookings, across every active tenant.';

    public function handle(OrderCancellationService $cancellationService): int
    {
        Tenant::where('status', 'active')->get()->each(function (Tenant $tenant) use ($cancellationService) {
            $this->pointAtTenant($tenant);

            $this->completeOverdueBookings($tenant);
            $this->cancelStalePendingOrders($tenant, $cancellationService);
            $this->cancelStalePendingBookings($tenant);
        });

        DB::purge('tenant');

        return self::SUCCESS;
    }

    /**
     * Same technique TenantProvisioner and ResolveTenant use: point the
     * 'tenant' connection's search_path at this tenant's schema for the
     * rest of this iteration.
     */
    private function pointAtTenant(Tenant $tenant): void
    {
        Config::set('database.connections.tenant.search_path', "{$tenant->schema_name},public");
        DB::purge('tenant');
    }

    private function completeOverdueBookings(Tenant $tenant): void
    {
        Booking::where('status', 'confirmed')
            ->where('ends_at', '<', now())
            ->with('user')
            ->get()
            ->each(function (Booking $booking) use ($tenant) {
                $booking->update(['status' => 'completed']);
                $booking->user->notify(new BookingStatusChanged($booking, $tenant));
                $this->info("[{$tenant->slug}] booking #{$booking->id} auto-completed (past due).");
            });
    }

    private function cancelStalePendingOrders(Tenant $tenant, OrderCancellationService $cancellationService): void
    {
        Order::where('status', 'pending')
            ->where('placed_at', '<', now()->subDay())
            ->with(['items', 'user'])
            ->get()
            ->each(function (Order $order) use ($tenant, $cancellationService) {
                $cancellationService->cancel($order);
                $order->user->notify(new OrderStatusChanged($order, $tenant));
                $this->info("[{$tenant->slug}] order #{$order->id} auto-cancelled (stale pending).");
            });
    }

    private function cancelStalePendingBookings(Tenant $tenant): void
    {
        Booking::where('status', 'pending')
            ->where('created_at', '<', now()->subDay())
            ->with('user')
            ->get()
            ->each(function (Booking $booking) use ($tenant) {
                $booking->update(['status' => 'cancelled']);
                $booking->user->notify(new BookingStatusChanged($booking, $tenant));
                $this->info("[{$tenant->slug}] booking #{$booking->id} auto-cancelled (stale pending).");
            });
    }
}
