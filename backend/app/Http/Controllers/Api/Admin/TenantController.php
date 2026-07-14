<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class TenantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Tenant::with(['businessType', 'owner'])->orderBy('name')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:tenants,slug'],
            'business_type_id' => ['required', 'integer', 'exists:business_types,id'],
            'schema_name' => ['required', 'string', 'max:255', 'unique:tenants,schema_name'],
            'owner_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', Rule::in(['pending', 'active', 'suspended'])],
        ]);

        $tenant = Tenant::create($validated);

        return response()->json($tenant->load(['businessType', 'owner']), Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Tenant $tenant)
    {
        return $tenant->load(['businessType', 'owner']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('tenants', 'slug')->ignore($tenant->id),
            ],
            'business_type_id' => ['sometimes', 'required', 'integer', 'exists:business_types,id'],
            'schema_name' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('tenants', 'schema_name')->ignore($tenant->id),
            ],
            'owner_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['sometimes', Rule::in(['pending', 'active', 'suspended'])],
        ]);

        $tenant->update($validated);

        return $tenant->load(['businessType', 'owner']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tenant $tenant)
    {
        $tenant->delete();

        return response()->noContent();
    }
}
