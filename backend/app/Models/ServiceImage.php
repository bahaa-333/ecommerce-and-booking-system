<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceImage extends Model
{
    protected $connection = 'tenant';

    protected $fillable = [
        'service_id',
        'url',
        'position',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
