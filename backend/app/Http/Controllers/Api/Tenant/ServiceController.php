<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\CatalogStatus;
use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * Public (no auth) — anyone can browse a tenant's bookable services. Not
     * type-hinting Tenant $tenant here: SubstituteBindings runs before our
     * custom 'tenant' middleware, so it would try to bind {tenant} by id
     * using the raw slug and blow up. ResolveTenant already switched the
     * 'tenant' connection's search_path, which is all these methods need.
     */
    public function index(Request $request)
    {
        return Service::with('images')
            ->orderBy('name')
            ->paginate((int) $request->integer('per_page', 15));
    }

    /**
     * Store a newly created resource in storage.
     *
     * Gated by the 'tenant.access' middleware (owner/admin/staff only).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:tenant.services,slug'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'duration_value' => ['nullable', 'integer', 'min:1'],
            'duration_unit' => ['nullable', Rule::in(['minutes', 'hours', 'days'])],
            'advance_booking_value' => ['nullable', 'integer', 'min:0'],
            'advance_booking_unit' => ['nullable', Rule::in(['minutes', 'hours', 'days'])],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'archived'])],
        ]);

        $service = Service::create($validated);

        return response()->json($service->load('images'), Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     *
     * Public (no auth). Takes only Request — see ProductController::show()
     * for why a second, scalar-typed route parameter isn't safe here.
     */
    public function show(Request $request)
    {
        return Service::with(['images', 'timeSlots'])->findOrFail((int) $request->route('service'));
    }

    /**
     * Update the specified resource in storage.
     *
     * Gated by the 'tenant.access' middleware (owner/admin/staff only).
     */
    public function update(Request $request)
    {
        $service = Service::findOrFail((int) $request->route('service'));

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('tenant.services', 'slug')->ignore($service->id),
            ],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'duration_value' => ['nullable', 'integer', 'min:1'],
            'duration_unit' => ['nullable', Rule::in(['minutes', 'hours', 'days'])],
            'advance_booking_value' => ['nullable', 'integer', 'min:0'],
            'advance_booking_unit' => ['nullable', Rule::in(['minutes', 'hours', 'days'])],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ]);

        $service->update($validated);

        return $service->load('images');
    }

    /**
     * Remove the specified resource from storage.
     *
     * Soft delete, not a hard one — see ProductController::destroy() for
     * why (same reasoning: bookings.service_id isn't nullable/cascading).
     * Gated by the 'tenant.access' middleware (owner/admin/staff only).
     */
    public function destroy(Request $request)
    {
        $service = Service::findOrFail((int) $request->route('service'));
        $service->update(['status' => CatalogStatus::Archived]);
        $service->delete();

        return response()->noContent();
    }
}
