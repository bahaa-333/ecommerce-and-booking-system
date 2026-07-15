<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new customer account and log them in.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $customerRole = Role::where('slug', 'customer')->firstOrFail();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role_id' => $customerRole->id,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json($user->load('role'), 201);
    }

    /**
     * Log in with email and password.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        $request->session()->regenerate();

        return $this->withPortal($request->user());
    }

    /**
     * Log out of the current session.
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    /**
     * Get the currently authenticated user.
     */
    public function me(Request $request)
    {
        return $this->withPortal($request->user());
    }

    /**
     * Which portal this user should land in after login: the admin panel,
     * the business/staff portal, or the customer portal. Computed
     * server-side (not just role.slug === 'admin' on the frontend) so
     * business access -- owning or actively staffing any tenant, the same
     * condition MyTenantsController uses -- is the single source of truth
     * for where a non-admin user lands, not re-derived client-side.
     */
    private function withPortal(User $user): array
    {
        $user->load('role');

        $portal = match (true) {
            $user->role?->slug === 'admin' => 'admin',
            Tenant::where('owner_user_id', $user->id)
                ->orWhereHas('staff', fn ($query) => $query->where('user_id', $user->id)->where('status', 'active'))
                ->exists() => 'business',
            default => 'customer',
        };

        return [...$user->toArray(), 'portal' => $portal];
    }
}
