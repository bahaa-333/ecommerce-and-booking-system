<?php

namespace App\Services;

use App\Enums\TransactionStatus;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class OrderCancellationService
{
    /**
     * Cancel an order and restore stock_quantity for any tracked
     * product/variant in it -- it was decremented at placement time.
     * Shared by OrderController::update() and the scheduled stale-order
     * cleanup, so the two can't drift out of sync.
     */
    public function cancel(Order $order): void
    {
        DB::connection('tenant')->transaction(function () use ($order) {
            foreach ($order->items as $item) {
                $stockHolder = $item->product_variant_id ? $item->variant : $item->product;

                if ($stockHolder && $stockHolder->stock_quantity !== null) {
                    $stockHolder->increment('stock_quantity', $item->quantity);
                }
            }

            $order->update(['status' => TransactionStatus::Cancelled]);
        });
    }
}
