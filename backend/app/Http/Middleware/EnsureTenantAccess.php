<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    /**
     * Gate catalog/schedule/storefront management to the tenant's owner or
     * an 'admin'-role staff member — see Tenant::isAdministeredBy(). This is
     * deliberately the stricter check, not isManagedBy(): a plain staff
     * member fulfills orders/bookings day-to-day but doesn't get to change
     * what's for sale, the schedule, or the public storefront. Must run
     * after auth:sanctum and ResolveTenant (needs both the user and the
     * resolved Tenant on the route).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if (! $tenant->isAdministeredBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        return $next($request);
    }
}
