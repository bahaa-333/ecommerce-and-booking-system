<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\CatalogStatus;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * Public (no auth) — anyone can browse a tenant's catalog. Not
     * type-hinting Tenant $tenant here: SubstituteBindings runs before our
     * custom 'tenant' middleware, so it would try to bind {tenant} by id
     * using the raw slug and blow up. ResolveTenant already switched the
     * 'tenant' connection's search_path, which is all these methods need.
     */
    public function index(Request $request)
    {
        return Product::with('images')
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
            'slug' => ['required', 'string', 'max:255', 'unique:tenant.products,slug'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'sku' => ['nullable', 'string', 'max:255'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'has_variants' => ['nullable', 'boolean'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'archived'])],
        ]);

        $product = Product::create($validated);

        return response()->json($product->load('images'), Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     *
     * Public (no auth). Takes only Request, not a second typed parameter:
     * mixing a DI parameter (Request) with a scalar route parameter (int
     * $product) makes Laravel's controller-method parameter resolution
     * positional instead of name-matched, and it silently mismatches which
     * route segment goes where (confirmed the hard way — see git history).
     * Pulling the route segment manually sidesteps that entirely.
     */
    public function show(Request $request)
    {
        return Product::with(['images', 'options.values', 'variants.optionValues', 'variants.images'])
            ->findOrFail((int) $request->route('product'));
    }

    /**
     * Update the specified resource in storage.
     *
     * Gated by the 'tenant.access' middleware (owner/admin/staff only).
     */
    public function update(Request $request)
    {
        $product = Product::findOrFail((int) $request->route('product'));

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('tenant.products', 'slug')->ignore($product->id),
            ],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'sku' => ['nullable', 'string', 'max:255'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'has_variants' => ['nullable', 'boolean'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'archived'])],
        ]);

        $product->update($validated);

        return $product->load('images');
    }

    /**
     * Remove the specified resource from storage.
     *
     * Soft delete, not a hard one: a hard delete would throw a raw
     * FK-constraint error the moment the product has any order history
     * (order_items.product_id isn't nullable/cascading on purpose --
     * losing a past order's line-item detail would be worse than refusing
     * the delete). Archiving the status too means it reads as
     * discontinued even for any code path that queries withTrashed().
     * Gated by the 'tenant.access' middleware (owner/admin/staff only).
     */
    public function destroy(Request $request)
    {
        $product = Product::findOrFail((int) $request->route('product'));
        $product->update(['status' => CatalogStatus::Archived]);
        $product->delete();

        return response()->noContent();
    }
}
