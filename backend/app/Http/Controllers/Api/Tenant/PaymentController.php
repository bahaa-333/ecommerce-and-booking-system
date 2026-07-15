<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * Manager-only (Tenant::isManagedBy) -- a payment always belongs to
     * someone's order or booking, so there's no "my payments" case to
     * carve out the way OrderController/BookingController do. Optional
     * ?status=paid|unpaid filter. payable (the underlying order/booking)
     * is eager-loaded per-type via morphWith so the table can show what
     * each payment is actually for without an extra request per row.
     */
    public function index(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if (! $tenant->isManagedBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        $query = Payment::with(['payable' => function ($morphTo) {
            $morphTo->morphWith([
                Order::class => ['user'],
                Booking::class => ['user', 'service'],
            ]);
        }]);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $query->orderByDesc('created_at')->paginate((int) $request->integer('per_page', 15));
    }

    /**
     * Update the specified resource in storage.
     *
     * Only `status` (paid/unpaid) is editable, and only by whoever manages
     * this tenant — these are all pay-in-person/manual methods (see
     * PaymentMethod), so it's staff confirming they received the money, not
     * something a customer self-reports.
     */
    public function update(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if (! $tenant->isManagedBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        $payment = Payment::findOrFail((int) $request->route('payment'));

        $validated = $request->validate([
            'status' => ['required', Rule::in(['paid', 'unpaid'])],
        ]);

        $payment->update($validated);

        return $payment;
    }
}
