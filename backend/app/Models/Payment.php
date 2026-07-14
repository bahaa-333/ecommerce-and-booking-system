<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Payment extends Model
{
    protected $fillable = [
        'payable_type',
        'payable_id',
        'amount',
        'currency',
        'method',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'method' => PaymentMethod::class,
            'status' => PaymentStatus::class,
            'amount' => 'decimal:2',
        ];
    }

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }
}
