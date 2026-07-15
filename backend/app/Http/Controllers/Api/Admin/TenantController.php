<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\Tenancy\TenantProvisioner;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Throwable;

class TenantController extends Controller
{
    public function __construct(private TenantProvisioner $provisioner) {}

    /**
     * Display a listing of the resource.
     *
     * Optional ?status= filter and ?search= (matched against name, case-
     * insensitive via ilike since the DB is Postgres) so the admin
     * Tenants/Applications tables can filter server-side instead of
     * fetching every tenant to filter client-side.
     */
    public function index(Request $request)
    {
        $query = Tenant::with(['businessType', 'owner']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%'.$request->string('search').'%');
        }

        return $query->orderBy('name')->paginate((int) $request->integer('per_page', 15));
    }

    /**
     * Store a newly created resource in storage, then provision its Postgres schema.
     *
     * schema_name is derived from the (validated, kebab-case) slug, not accepted
     * from the request — it's an internal Postgres identifier, not something an
     * admin should be typing, and it must never drift from the schema
     * TenantProvisioner actually creates.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/', 'unique:tenants,slug'],
            'business_type_id' => ['required', 'integer', 'exists:business_types,id'],
            'owner_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', Rule::in(['pending', 'active', 'suspended'])],
        ]);

        $statusExplicitlySet = array_key_exists('status', $validated);

        $tenant = Tenant::create($validated + [
            'status' => $validated['status'] ?? 'pending',
            'schema_name' => 'tenant_'.str_replace('-', '_', $validated['slug']),
        ]);

        try {
            $this->provisioner->provision($tenant);
        } catch (Throwable $e) {
            $tenant->delete();

            return response()->json([
                'message' => 'Tenant could not be provisioned.',
                'error' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (! $statusExplicitlySet) {
            $tenant->update(['status' => 'active']);
        }

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
     *
     * schema_name is intentionally not editable here — see store().
     */
    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes', 'required', 'string', 'max:255', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/',
                Rule::unique('tenants', 'slug')->ignore($tenant->id),
            ],
            'business_type_id' => ['sometimes', 'required', 'integer', 'exists:business_types,id'],
            'owner_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['sometimes', Rule::in(['pending', 'active', 'suspended'])],
        ]);

        $tenant->update($validated);

        return $tenant->load(['businessType', 'owner']);
    }

    /**
     * Remove the specified resource from storage, dropping its Postgres schema too.
     */
    public function destroy(Tenant $tenant)
    {
        $this->provisioner->deprovision($tenant);

        $tenant->delete();

        return response()->noContent();
    }
}
