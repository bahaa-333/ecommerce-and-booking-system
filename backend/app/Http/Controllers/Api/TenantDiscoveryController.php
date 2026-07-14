<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;

class TenantDiscoveryController extends Controller
{
    /**
     * Browse active tenants — no auth, this is how a customer finds a
     * business to order/book with. Optional ?business_type=<slug> filter.
     */
    public function index(Request $request)
    {
        $query = Tenant::with('businessType')->where('status', 'active');

        if ($request->filled('business_type')) {
            $query->whereHas('businessType', function ($businessTypes) use ($request) {
                $businessTypes->where('slug', $request->string('business_type'));
            });
        }

        return $query->orderBy('name')->get()->map($this->toPublicArray(...));
    }

    /**
     * Show a single active tenant's public info.
     *
     * Reuses the 'tenant' middleware (ResolveTenant) already applied to
     * this route group, which looks the tenant up by slug and 404s unless
     * it's active — this just shapes what's already been resolved.
     */
    public function show(Request $request)
    {
        return $this->toPublicArray($request->route('tenant')->load('businessType'));
    }

    /**
     * schema_name and owner_user_id are internal/admin details — nothing a
     * customer browsing businesses needs to see.
     */
    private function toPublicArray(Tenant $tenant): array
    {
        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'business_type' => $tenant->businessType,
        ];
    }
}
