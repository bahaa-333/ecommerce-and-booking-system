<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\CloudinaryUploader;
use Illuminate\Http\Request;

class TenantProfileController extends Controller
{
    public function __construct(private CloudinaryUploader $uploader) {}

    /**
     * Update the tenant's public-facing storefront copy.
     *
     * Gated by the 'tenant.access' middleware (owner/admin/staff only), same
     * as product/service writes. Not type-hinting Tenant $tenant -- see
     * ProductController::show() for why a route-typed model can't sit
     * alongside Request in these tenant-scoped methods.
     */
    public function update(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        $validated = $request->validate([
            'intro_text' => ['nullable', 'string', 'max:2000'],
        ]);

        $tenant->update($validated);

        return $tenant->load('businessType');
    }

    /**
     * Replace the tenant's cover photo -- a single image, not a gallery
     * (see product_images/service_images for that pattern), so this
     * destroys the previous Cloudinary asset (if any) rather than appending.
     *
     * Gated by the 'tenant.access' middleware (owner/admin/staff only).
     */
    public function updatePhoto(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        if ($tenant->cover_image_public_id) {
            $this->uploader->destroy($tenant->cover_image_public_id);
        }

        $uploaded = $this->uploader->upload($request->file('image'), "tenants/{$tenant->id}/cover");

        $tenant->update([
            'cover_image_url' => $uploaded['url'],
            'cover_image_public_id' => $uploaded['public_id'],
        ]);

        return $tenant->load('businessType');
    }
}
