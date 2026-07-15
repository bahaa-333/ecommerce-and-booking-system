<?php

namespace App\Services;

use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\UploadedFile;

class CloudinaryUploader
{
    /**
     * @return array{url: string, public_id: string}
     */
    public function upload(UploadedFile $file, string $folder): array
    {
        $result = Cloudinary::uploadApi()->upload($file->getRealPath(), [
            'folder' => $folder,
        ]);

        return [
            'url' => $result['secure_url'],
            'public_id' => $result['public_id'],
        ];
    }

    public function destroy(string $publicId): void
    {
        Cloudinary::uploadApi()->destroy($publicId);
    }
}
