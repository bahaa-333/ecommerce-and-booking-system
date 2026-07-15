<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessType;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class BusinessTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return BusinessType::orderBy('name')->paginate((int) $request->integer('per_page', 15));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:business_types,slug'],
        ]);

        $businessType = BusinessType::create($validated);

        return response()->json($businessType, Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(BusinessType $businessType)
    {
        return $businessType;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, BusinessType $businessType)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('business_types', 'slug')->ignore($businessType->id),
            ],
        ]);

        $businessType->update($validated);

        return $businessType;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BusinessType $businessType)
    {
        $businessType->delete();

        return response()->noContent();
    }
}
