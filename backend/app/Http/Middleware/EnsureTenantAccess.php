<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\TenantStaff;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    /**
     * Gate write access to a tenant's catalog: the platform admin, the
     * tenant's owner, or one of that tenant's active staff. Must run after
     * auth:sanctum and ResolveTenant (needs both the user and the resolved
     * Tenant on the route).
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        $isPlatformAdmin = $user->role?->slug === 'admin';
        $isOwner = $tenant->owner_user_id === $user->id;
        $isActiveStaff = TenantStaff::where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->exists();

        if (! $isPlatformAdmin && ! $isOwner && ! $isActiveStaff) {
            abort(403, 'This action is unauthorized.');
        }

        return $next($request);
    }
}
