<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenant
{
    /**
     * Resolve the {tenant} route segment (a slug) to a Tenant, reject it if
     * the tenant isn't active, and point the 'tenant' DB connection at that
     * tenant's Postgres schema for the rest of the request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::where('slug', $request->route('tenant'))
            ->where('status', 'active')
            ->first();

        if (! $tenant) {
            abort(404, 'Tenant not found.');
        }

        Config::set('database.connections.tenant.search_path', "{$tenant->schema_name},public");
        DB::purge('tenant');

        $request->route()->setParameter('tenant', $tenant);

        return $next($request);
    }
}
