<?php

namespace App\Http\Controllers\Api\Tenant;

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
    public function index()
    {
        return Product::with('images')->orderBy('name')->get();
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
     * Public (no auth).
     */
    public function show(int $product)
    {
        return Product::with(['images', 'options.values'])->findOrFail($product);
    }

    /**
     * Update the specified resource in storage.
     *
     * Gated by the 'tenant.access' middleware (owner/admin/staff only).
     */
    public function update(Request $request, int $product)
    {
        $product = Product::findOrFail($product);

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
     * Gated by the 'tenant.access' middleware (owner/admin/staff only).
     */
    public function destroy(int $product)
    {
        Product::findOrFail($product)->delete();

        return response()->noContent();
    }
}
