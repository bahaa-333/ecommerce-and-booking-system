<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class MyBookingsController extends Controller
{
    /**
     * The logged-in user's bookings across every tenant they've booked
     * with. See MyOrdersController for why this iterates every active
     * tenant switching schemas, and why there's no real pagination here.
     *
     * ?upcoming=1 narrows to not-yet-finished bookings that haven't started
     * yet (pending/confirmed AND starts_at in the future), capped smaller --
     * powers the customer home page's "upcoming" widget. Without it,
     * returns up to the 50 most recent bookings overall.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $upcoming = $request->boolean('upcoming');

        $results = new Collection;

        Tenant::where('status', 'active')->get()->each(function (Tenant $tenant) use ($user, $upcoming, $results) {
            Config::set('database.connections.tenant.search_path', "{$tenant->schema_name},public");
            DB::purge('tenant');

            $query = Booking::with(['service', 'timeSlot', 'staff'])->where('user_id', $user->id);

            if ($upcoming) {
                $query->whereIn('status', ['pending', 'confirmed'])->where('starts_at', '>=', now());
            }

            $query->orderByDesc('starts_at')->get()->each(function (Booking $booking) use ($tenant, $results) {
                $results->push([
                    'tenant' => ['slug' => $tenant->slug, 'name' => $tenant->name],
                    ...$booking->toArray(),
                ]);
            });
        });

        DB::purge('tenant');

        return $results->sortByDesc('starts_at')->values()->take($upcoming ? 5 : 50);
    }
}
