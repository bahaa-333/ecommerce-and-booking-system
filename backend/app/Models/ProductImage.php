<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    protected $connection = 'tenant';

    protected $fillable = [
        'product_id',
        'url',
        'public_id',
        'position',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
