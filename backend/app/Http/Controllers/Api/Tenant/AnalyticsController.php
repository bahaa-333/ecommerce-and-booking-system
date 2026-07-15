<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Manager-only (Tenant::isManagedBy), same gate as the payments list.
     *
     * Aggregate queries go through DB::connection('tenant') directly
     * rather than the Eloquent models -- selectRaw + groupBy results would
     * otherwise get run back through each model's casts (status ends up
     * an enum instance, awkward as an array key), and none of these
     * queries need model hydration anyway.
     */
    public function index(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if (! $tenant->isManagedBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        $db = DB::connection('tenant');
        $since = now()->subDays(30)->startOfDay();

        $revenueTrend = $db->table('payments')
            ->where('status', 'paid')
            ->where('created_at', '>=', $since)
            ->selectRaw('DATE(created_at) as date, SUM(amount) as amount')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $ordersByStatus = $db->table('orders')
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $bookingsByStatus = $db->table('bookings')
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $topProducts = $db->table('order_items')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->selectRaw('products.id, products.name, SUM(order_items.quantity) as quantity_sold, SUM(order_items.quantity * order_items.unit_price) as revenue')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        $topServices = $db->table('bookings')
            ->join('services', 'services.id', '=', 'bookings.service_id')
            ->selectRaw('services.id, services.name, count(*) as booking_count')
            ->groupBy('services.id', 'services.name')
            ->orderByDesc('booking_count')
            ->limit(5)
            ->get();

        return response()->json([
            'revenue' => [
                'total_paid' => (float) Payment::where('status', 'paid')->sum('amount'),
                'total_unpaid' => (float) Payment::where('status', 'unpaid')->sum('amount'),
                'trend' => $revenueTrend,
            ],
            'orders' => [
                'total' => Order::count(),
                'by_status' => $ordersByStatus,
            ],
            'bookings' => [
                'total' => Booking::count(),
                'by_status' => $bookingsByStatus,
            ],
            'top_products' => $topProducts,
            'top_services' => $topServices,
        ]);
    }
}
