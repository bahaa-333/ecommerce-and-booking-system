<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Tenancy\TenantProvisioner;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Throwable;

class StoreSignupController extends Controller
{
    public function __construct(private TenantProvisioner $provisioner) {}

    /**
     * Self-service business application: creates the applicant's account
     * (same customer-role account register() would produce) and a `pending`
     * Tenant owned by them, in one submission. Provisioning runs immediately
     * (same as Admin\TenantController::store) so the schema is ready the
     * moment an admin flips status to `active` via the existing
     * PATCH /api/admin/tenants/{tenant} — this endpoint intentionally can't
     * set status itself.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'business_name' => ['required', 'string', 'max:255'],
            'business_slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(-[a-z0-9]+)*$/', 'unique:tenants,slug'],
            'business_type_id' => ['required', 'integer', 'exists:business_types,id'],
        ]);

        $customerRole = Role::where('slug', 'customer')->firstOrFail();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role_id' => $customerRole->id,
        ]);

        $tenant = Tenant::create([
            'name' => $validated['business_name'],
            'slug' => $validated['business_slug'],
            'business_type_id' => $validated['business_type_id'],
            'owner_user_id' => $user->id,
            'status' => 'pending',
            'schema_name' => 'tenant_'.str_replace('-', '_', $validated['business_slug']),
        ]);

        try {
            $this->provisioner->provision($tenant);
        } catch (Throwable $e) {
            $tenant->delete();
            $user->delete();

            return response()->json([
                'message' => 'Store application could not be submitted.',
                'error' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'user' => $user->load('role'),
            'tenant' => $tenant->load('businessType'),
        ], Response::HTTP_CREATED);
    }
}
