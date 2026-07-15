<?php

namespace App\Http\Controllers\Api;

use App\Enums\TenantStaffRole;
use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;

class MyTenantsController extends Controller
{
    /**
     * Which tenants the logged-in user can access the business portal for
     * -- owner or active tenant_staff (either role). There's no reverse
     * lookup for this anywhere else: every other tenant-scoped route
     * requires already knowing the tenant's slug.
     *
     * `is_admin` collapses "owner" and "tenant_staff role=admin" into one
     * flag, since both satisfy Tenant::isAdministeredBy identically --
     * the frontend only needs to know whether roster management is
     * available, not which of the two reasons grants it.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $owned = Tenant::with('businessType')
            ->where('owner_user_id', $user->id)
            ->get()
            ->map(fn (Tenant $tenant) => $this->toArray($tenant, 'owner', true));

        $staffed = Tenant::with(['businessType', 'staff' => function ($query) use ($user) {
            $query->where('user_id', $user->id)->where('status', 'active');
        }])
            ->whereHas('staff', function ($query) use ($user) {
                $query->where('user_id', $user->id)->where('status', 'active');
            })
            ->get()
            ->map(function (Tenant $tenant) {
                $role = $tenant->staff->first()->role;

                return $this->toArray($tenant, $role->value, $role === TenantStaffRole::Admin);
            });

        return $owned->concat($staffed)->unique('id')->values();
    }

    private function toArray(Tenant $tenant, string $role, bool $isAdmin): array
    {
        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'status' => $tenant->status,
            'business_type' => $tenant->businessType,
            'role' => $role,
            'is_admin' => $isAdmin,
        ];
    }
}
