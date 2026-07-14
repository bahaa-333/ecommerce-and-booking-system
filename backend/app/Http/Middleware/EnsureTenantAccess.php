<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    /**
     * Gate write access to a tenant's catalog to whoever can manage it —
     * see Tenant::isManagedBy(). Must run after auth:sanctum and
     * ResolveTenant (needs both the user and the resolved Tenant on the
     * route).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if (! $tenant->isManagedBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        return $next($request);
    }
}
