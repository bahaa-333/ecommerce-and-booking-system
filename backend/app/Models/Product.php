<?php

namespace App\Models;

use App\Enums\CatalogStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'sku',
        'stock_quantity',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => CatalogStatus::class,
            'price' => 'decimal:2',
        ];
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
