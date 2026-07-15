<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class MyOrdersController extends Controller
{
    /**
     * The logged-in user's orders across every tenant they've bought from.
     * There's no central index of "which tenants has this user ordered
     * from" -- orders live per-tenant-schema -- so this iterates every
     * active tenant and switches the 'tenant' connection's search_path per
     * iteration, exactly like ProcessTenantSchedules::pointAtTenant() does
     * for the same reason. Fine at the platform's current tenant count;
     * would need a real cross-schema index if that grows large.
     *
     * ?upcoming=1 narrows to not-yet-finished orders (pending/confirmed),
     * capped smaller -- powers the customer home page's "upcoming" widget.
     * Without it, returns up to the 50 most recent orders overall -- powers
     * the full "My Orders & Bookings" page. Real page-based pagination
     * isn't practical across N separate schemas in one request.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $upcoming = $request->boolean('upcoming');

        $results = new Collection;

        Tenant::where('status', 'active')->get()->each(function (Tenant $tenant) use ($user, $upcoming, $results) {
            Config::set('database.connections.tenant.search_path', "{$tenant->schema_name},public");
            DB::purge('tenant');

            $query = Order::with('items.product')->where('user_id', $user->id);

            if ($upcoming) {
                $query->whereIn('status', ['pending', 'confirmed']);
            }

            $query->orderByDesc('placed_at')->get()->each(function (Order $order) use ($tenant, $results) {
                $results->push([
                    'tenant' => ['slug' => $tenant->slug, 'name' => $tenant->name],
                    ...$order->toArray(),
                ]);
            });
        });

        DB::purge('tenant');

        return $results->sortByDesc('placed_at')->values()->take($upcoming ? 5 : 50);
    }
}
