<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ServiceTimeSlot;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ServiceTimeSlotController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * Public (no auth) — customers need to see availability to book.
     */
    public function index(Request $request)
    {
        return ServiceTimeSlot::where('service_id', (int) $request->route('service'))
            ->with('staff.user')
            ->get();
    }

    /**
     * Store a newly created resource in storage.
     *
     * Gated by the 'tenant.access' middleware (owner/admin/staff — same
     * level as catalog writes, not the stricter isAdministeredBy: defining
     * a schedule is everyday operational work, not roster management).
     */
    public function store(Request $request)
    {
        $service = (int) $request->route('service');

        $validated = $request->validate([
            'availability_type' => ['required', Rule::in(['standing', 'date_range'])],
            'day_of_week' => ['nullable', 'integer', 'between:0,6'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'starts_on' => ['nullable', 'date', 'required_if:availability_type,date_range'],
            'ends_on' => ['nullable', 'date', 'required_if:availability_type,date_range', 'after_or_equal:starts_on'],
        ]);

        $slot = ServiceTimeSlot::create(['service_id' => $service] + $validated);

        return response()->json($slot, Response::HTTP_CREATED);
    }

    /**
     * Update the specified resource in storage.
     *
     * Gated by the 'tenant.access' middleware.
     */
    public function update(Request $request)
    {
        $slot = ServiceTimeSlot::where('service_id', (int) $request->route('service'))
            ->findOrFail((int) $request->route('slot'));

        $validated = $request->validate([
            'availability_type' => ['sometimes', Rule::in(['standing', 'date_range'])],
            'day_of_week' => ['nullable', 'integer', 'between:0,6'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
            'starts_on' => ['nullable', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
        ]);

        $slot->update($validated);

        return $slot;
    }

    /**
     * Remove the specified resource from storage.
     *
     * Gated by the 'tenant.access' middleware.
     */
    public function destroy(Request $request)
    {
        ServiceTimeSlot::where('service_id', (int) $request->route('service'))
            ->findOrFail((int) $request->route('slot'))
            ->delete();

        return response()->noContent();
    }

    /**
     * Replace the full set of tenant_staff assigned to this time slot —
     * this is what BookingController checks staff_id eligibility against
     * when a booking specifies both a time slot and a staff member. Gated
     * by the 'tenant.access' middleware.
     */
    public function syncStaff(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        $slot = ServiceTimeSlot::where('service_id', (int) $request->route('service'))
            ->findOrFail((int) $request->route('slot'));

        $validated = $request->validate([
            'tenant_staff_ids' => ['present', 'array'],
            'tenant_staff_ids.*' => ['integer', Rule::exists('tenant_staff', 'id')->where('tenant_id', $tenant->id)],
        ]);

        $slot->staff()->sync($validated['tenant_staff_ids']);

        return $slot->load('staff');
    }
}
