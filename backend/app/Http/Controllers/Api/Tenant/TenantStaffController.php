<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantStaff;
use App\Notifications\AddedAsTenantStaff;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class TenantStaffController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * Visible to anyone who manages this tenant (Tenant::isManagedBy) --
     * broader than who can edit the roster (Tenant::isAdministeredBy), so
     * a plain staff member can see their coworkers but not add or remove
     * them.
     */
    public function index(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if (! $tenant->isManagedBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        return $tenant->staff()->with('user')->get();
    }

    /**
     * Store a newly created resource in storage.
     *
     * Adds an already-registered user as staff -- there's no separate
     * invite-and-accept step, this creates the tenant_staff row directly.
     * Restricted to Tenant::isAdministeredBy (owner, platform admin, or an
     * existing tenant-admin), not the broader isManagedBy: growing the
     * roster is more sensitive than everyday catalog/order work.
     */
    public function store(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if (! $tenant->isAdministeredBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        $validated = $request->validate([
            'user_id' => [
                'required', 'integer', 'exists:users,id',
                Rule::unique('tenant_staff', 'user_id')->where('tenant_id', $tenant->id),
            ],
            'role' => ['nullable', Rule::in(['admin', 'staff'])],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $staff = $tenant->staff()->create([
            'user_id' => $validated['user_id'],
            'role' => $validated['role'] ?? 'staff',
            'status' => $validated['status'] ?? 'active',
        ]);

        $staff->user->notify(new AddedAsTenantStaff($tenant, $staff->role));

        return response()->json($staff->load('user'), Response::HTTP_CREATED);
    }

    /**
     * Update the specified resource in storage.
     *
     * Change a staff member's tenant-scoped role or status (e.g.
     * deactivate without removing). Restricted to isAdministeredBy.
     */
    public function update(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if (! $tenant->isAdministeredBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        $staff = TenantStaff::where('tenant_id', $tenant->id)
            ->findOrFail((int) $request->route('staff'));

        $validated = $request->validate([
            'role' => ['sometimes', Rule::in(['admin', 'staff'])],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        $staff->update($validated);

        return $staff->load('user');
    }

    /**
     * Remove the specified resource from storage.
     *
     * Restricted to isAdministeredBy.
     */
    public function destroy(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if (! $tenant->isAdministeredBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        TenantStaff::where('tenant_id', $tenant->id)
            ->findOrFail((int) $request->route('staff'))
            ->delete();

        return response()->noContent();
    }
}
