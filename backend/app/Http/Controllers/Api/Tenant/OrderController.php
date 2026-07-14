<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * Whoever manages this tenant (see Tenant::isManagedBy) sees every
     * order; everyone else sees only their own.
     */
    public function index(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');
        $user = $request->user();

        $query = Order::with('items.product');

        if (! $tenant->isManagedBy($user)) {
            $query->where('user_id', $user->id);
        }

        return $query->orderByDesc('placed_at')->get();
    }

    /**
     * Store a newly created resource in storage.
     *
     * Snapshots product/variant price at order time, decrements stock
     * where it's tracked, and opens an unpaid Payment for the chosen
     * method -- there's no real payment gateway yet, PaymentMethod is
     * pay-in-person/manual options only.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:tenant.products,id'],
            'items.*.product_variant_id' => ['nullable', 'integer', 'exists:tenant.product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'payment_method' => ['required', Rule::in(['pay_at_shop', 'cash_on_delivery', 'manual_payment'])],
        ]);

        $order = DB::connection('tenant')->transaction(function () use ($validated, $request) {
            $total = 0;
            $lines = [];

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                $variant = null;
                if (! empty($item['product_variant_id'])) {
                    $variant = ProductVariant::where('id', $item['product_variant_id'])
                        ->where('product_id', $product->id)
                        ->first();

                    if (! $variant) {
                        throw ValidationException::withMessages([
                            'items' => ["The selected variant does not belong to product #{$product->id}."],
                        ]);
                    }
                }

                if ($product->has_variants && ! $variant) {
                    throw ValidationException::withMessages([
                        'items' => ["Product \"{$product->name}\" requires a product_variant_id."],
                    ]);
                }

                $stockHolder = $variant ?? $product;
                if ($stockHolder->stock_quantity !== null && $stockHolder->stock_quantity < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Not enough stock for \"{$product->name}\"."],
                    ]);
                }

                $unitPrice = $variant->price ?? $product->price;
                $total += $unitPrice * $item['quantity'];

                $lines[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => $variant?->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'stockHolder' => $stockHolder,
                ];
            }

            $order = Order::create([
                'user_id' => $request->user()->id,
                'status' => 'pending',
                'total_amount' => $total,
                'currency' => 'USD',
                'placed_at' => now(),
            ]);

            foreach ($lines as $line) {
                $order->items()->create([
                    'product_id' => $line['product_id'],
                    'product_variant_id' => $line['product_variant_id'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                ]);

                if ($line['stockHolder']->stock_quantity !== null) {
                    $line['stockHolder']->decrement('stock_quantity', $line['quantity']);
                }
            }

            $order->payments()->create([
                'amount' => $total,
                'currency' => 'USD',
                'method' => $validated['payment_method'],
                'status' => PaymentStatus::Unpaid,
            ]);

            return $order;
        });

        return response()->json($order->load(['items.product', 'payments']), Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     *
     * Visible to the customer who placed it, or whoever manages this tenant.
     *
     * Takes only Request — see ProductController::show() for why a second,
     * scalar-typed route parameter isn't safe alongside a DI parameter.
     */
    public function show(Request $request)
    {
        $order = Order::with(['items.product', 'items.variant', 'payments'])
            ->findOrFail((int) $request->route('order'));

        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if ($order->user_id !== $request->user()->id && ! $tenant->isManagedBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        return $order;
    }

    /**
     * Transition the order's status. Only `status` is editable here — an
     * order's contents aren't meant to change after placement.
     *
     * Tenant managers (see Tenant::isManagedBy) can make any valid
     * transition (confirm, complete, cancel); the customer who placed the
     * order may only cancel it. Cancelling restores stock_quantity for any
     * tracked product/variant in the order, since it was decremented at
     * placement time.
     */
    public function update(Request $request)
    {
        $order = Order::with('items')->findOrFail((int) $request->route('order'));

        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');
        $user = $request->user();
        $isManager = $tenant->isManagedBy($user);

        if ($order->user_id !== $user->id && ! $isManager) {
            abort(403, 'This action is unauthorized.');
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(array_column(TransactionStatus::cases(), 'value'))],
        ]);

        $newStatus = TransactionStatus::from($validated['status']);

        if (! $isManager && $newStatus !== TransactionStatus::Cancelled) {
            abort(403, 'Customers may only cancel their own order.');
        }

        if (! $order->status->canTransitionTo($newStatus)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot move an order from \"{$order->status->value}\" to \"{$newStatus->value}\"."],
            ]);
        }

        DB::connection('tenant')->transaction(function () use ($order, $newStatus) {
            if ($newStatus === TransactionStatus::Cancelled) {
                foreach ($order->items as $item) {
                    $stockHolder = $item->product_variant_id ? $item->variant : $item->product;

                    if ($stockHolder && $stockHolder->stock_quantity !== null) {
                        $stockHolder->increment('stock_quantity', $item->quantity);
                    }
                }
            }

            $order->update(['status' => $newStatus]);
        });

        return $order->load(['items.product', 'payments']);
    }
}
