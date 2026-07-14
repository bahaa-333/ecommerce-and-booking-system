<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    /**
     * Update the specified resource in storage.
     *
     * Only `status` (paid/unpaid) is editable, and only by whoever manages
     * this tenant — these are all pay-in-person/manual methods (see
     * PaymentMethod), so it's staff confirming they received the money, not
     * something a customer self-reports. There's no standalone index/show:
     * payments are only ever seen embedded in their order/booking.
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
