<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessType;
use App\Models\Tenant;
use App\Models\User;

class DashboardController extends Controller
{
    /**
     * Platform-wide counts for the admin dashboard. Now that TenantController
     * and BusinessTypeController paginate their index(), the dashboard can no
     * longer derive these counts by fetching "all" tenants/business-types
     * client-side -- this is the single lightweight source for all of them.
     */
    public function stats()
    {
        return [
            'customers_count' => User::whereHas('role', fn ($q) => $q->where('slug', 'customer'))->count(),
            'tenants_count' => Tenant::count(),
            'active_tenants_count' => Tenant::where('status', 'active')->count(),
            'pending_tenants_count' => Tenant::where('status', 'pending')->count(),
            'business_types_count' => BusinessType::count(),
        ];
    }
}
