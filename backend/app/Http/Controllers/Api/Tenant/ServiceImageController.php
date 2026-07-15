<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Services\CloudinaryUploader;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ServiceImageController extends Controller
{
    public function __construct(private CloudinaryUploader $uploader) {}

    /**
     * Store a newly created resource in storage.
     *
     * Gated by the 'tenant.access' middleware (owner/admin/staff only).
     */
    public function store(Request $request)
    {
        $service = Service::findOrFail((int) $request->route('service'));

        $existingCount = $service->images()->count();

        if ($existingCount >= 4) {
            return response()->json([
                'message' => 'A service can have at most 4 images.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $uploaded = $this->uploader->upload($request->file('image'), "services/{$service->id}");

        $image = $service->images()->create([
            'url' => $uploaded['url'],
            'public_id' => $uploaded['public_id'],
            'position' => $existingCount,
        ]);

        return response()->json($image, Response::HTTP_CREATED);
    }

    /**
     * Remove the specified resource from storage.
     *
     * Gated by the 'tenant.access' middleware (owner/admin/staff only).
     */
    public function destroy(Request $request)
    {
        $service = Service::findOrFail((int) $request->route('service'));
        $image = $service->images()->findOrFail((int) $request->route('image'));

        $this->uploader->destroy($image->public_id);
        $image->delete();

        return response()->noContent();
    }
}
