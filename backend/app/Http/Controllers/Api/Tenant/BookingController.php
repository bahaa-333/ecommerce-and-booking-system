<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\DurationUnit;
use App\Enums\PaymentStatus;
use App\Enums\TransactionStatus;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Service;
use App\Models\ServiceTimeSlot;
use App\Models\Tenant;
use App\Notifications\BookingStatusChanged;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * Whoever manages this tenant (see Tenant::isManagedBy) sees every
     * booking; everyone else sees only their own.
     */
    public function index(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');
        $user = $request->user();

        $query = Booking::with(['service', 'timeSlot', 'staff']);

        if (! $tenant->isManagedBy($user)) {
            $query->where('user_id', $user->id);
        }

        return $query->orderByDesc('starts_at')->get();
    }

    /**
     * Store a newly created resource in storage.
     *
     * Enforces advance-notice and capacity (max overlapping bookings) rules
     * from the service, and opens an unpaid Payment for the chosen method.
     *
     * If both service_time_slot_id and staff_id are given, staff_id must be
     * assigned to that slot (service_time_slot_staff, managed via
     * ServiceTimeSlotController::syncStaff) — otherwise staff_id is only
     * checked against "is this an active staff member of this tenant" at
     * all, since a slot-less booking has no eligibility list to check
     * against.
     *
     * The service row is locked (lockForUpdate) for the whole capacity
     * check + insert: without it, two simultaneous requests for the last
     * open slot could both count the same (pre-insert) number of
     * overlapping bookings, both pass the capacity check, and both insert
     * -- overbooking by however many requests raced. The lock makes the
     * second request wait for the first transaction to commit (its new
     * booking now counts) or roll back before it counts, so its check sees
     * the real number.
     */
    public function store(Request $request)
    {
        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        $validated = $request->validate([
            // exists: queries the raw table and doesn't know about soft
            // deletes, so a plain 'exists:tenant.services,id' would still
            // accept an archived/deleted service's id -- whereNull excludes it.
            'service_id' => [
                'required', 'integer',
                Rule::exists('tenant.services', 'id')->whereNull('deleted_at'),
            ],
            'service_time_slot_id' => ['nullable', 'integer', 'exists:tenant.service_time_slots,id'],
            'staff_id' => ['nullable', 'integer', Rule::exists('tenant_staff', 'id')->where('tenant_id', $tenant->id)],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'payment_method' => ['required', Rule::in(['pay_at_shop', 'cash_on_delivery', 'manual_payment'])],
        ]);

        $booking = DB::connection('tenant')->transaction(function () use ($request, $validated) {
            $service = Service::lockForUpdate()->findOrFail($validated['service_id']);

            $timeSlot = null;
            if (! empty($validated['service_time_slot_id'])) {
                $timeSlot = ServiceTimeSlot::where('id', $validated['service_time_slot_id'])
                    ->where('service_id', $service->id)
                    ->first();

                if (! $timeSlot) {
                    throw ValidationException::withMessages([
                        'service_time_slot_id' => ['This time slot does not belong to the selected service.'],
                    ]);
                }
            }

            if ($timeSlot && ! empty($validated['staff_id'])) {
                $eligible = $timeSlot->staff()->where('tenant_staff.id', $validated['staff_id'])->exists();

                if (! $eligible) {
                    throw ValidationException::withMessages([
                        'staff_id' => ['This staff member is not assigned to the selected time slot.'],
                    ]);
                }
            }

            $startsAt = Carbon::parse($validated['starts_at']);
            $endsAt = isset($validated['ends_at'])
                ? Carbon::parse($validated['ends_at'])
                : $this->deriveEndsAt($startsAt, $service);

            if ($service->advance_booking_value && $service->advance_booking_unit) {
                $earliestAllowed = $this->addDuration(now(), $service->advance_booking_value, $service->advance_booking_unit);

                if ($startsAt->lt($earliestAllowed)) {
                    throw ValidationException::withMessages([
                        'starts_at' => ["This service requires at least {$service->advance_booking_value} {$service->advance_booking_unit->value} advance notice."],
                    ]);
                }
            }

            $overlapping = Booking::where('service_id', $service->id)
                ->where('status', '!=', 'cancelled')
                ->where('starts_at', '<', $endsAt)
                ->where('ends_at', '>', $startsAt)
                ->count();

            if ($overlapping >= $service->capacity) {
                throw ValidationException::withMessages([
                    'starts_at' => ['This service is fully booked for the selected time.'],
                ]);
            }

            $booking = Booking::create([
                'user_id' => $request->user()->id,
                'service_id' => $service->id,
                'service_time_slot_id' => $timeSlot?->id,
                'staff_id' => $validated['staff_id'] ?? null,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'status' => 'pending',
            ]);

            $booking->payments()->create([
                'amount' => $service->price,
                'currency' => 'USD',
                'method' => $validated['payment_method'],
                'status' => PaymentStatus::Unpaid,
            ]);

            return $booking;
        });

        return response()->json($booking->load(['service', 'timeSlot', 'staff', 'payments']), Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     *
     * Visible to the customer who made it, or whoever manages this tenant.
     *
     * Takes only Request — see ProductController::show() for why a second,
     * scalar-typed route parameter isn't safe alongside a DI parameter.
     */
    public function show(Request $request)
    {
        $booking = Booking::with(['service', 'timeSlot', 'staff', 'payments'])
            ->findOrFail((int) $request->route('booking'));

        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');

        if ($booking->user_id !== $request->user()->id && ! $tenant->isManagedBy($request->user())) {
            abort(403, 'This action is unauthorized.');
        }

        return $booking;
    }

    /**
     * Transition the booking's status. Only `status` is editable here.
     *
     * Tenant managers (see Tenant::isManagedBy) can make any valid
     * transition (confirm, complete, cancel); the customer who made the
     * booking may only cancel it. Unlike orders, there's no stock to
     * restore on cancellation. Notifies the customer of the new status
     * (database notification).
     */
    public function update(Request $request)
    {
        $booking = Booking::findOrFail((int) $request->route('booking'));

        /** @var Tenant $tenant */
        $tenant = $request->route('tenant');
        $user = $request->user();
        $isManager = $tenant->isManagedBy($user);

        if ($booking->user_id !== $user->id && ! $isManager) {
            abort(403, 'This action is unauthorized.');
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(array_column(TransactionStatus::cases(), 'value'))],
        ]);

        $newStatus = TransactionStatus::from($validated['status']);

        if (! $isManager && $newStatus !== TransactionStatus::Cancelled) {
            abort(403, 'Customers may only cancel their own booking.');
        }

        if (! $booking->status->canTransitionTo($newStatus)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot move a booking from \"{$booking->status->value}\" to \"{$newStatus->value}\"."],
            ]);
        }

        $booking->update(['status' => $newStatus]);

        $booking->user->notify(new BookingStatusChanged($booking, $tenant));

        return $booking->load(['service', 'timeSlot', 'staff', 'payments']);
    }

    private function deriveEndsAt(Carbon $startsAt, Service $service): Carbon
    {
        if (! $service->duration_value || ! $service->duration_unit) {
            throw ValidationException::withMessages([
                'ends_at' => ['This service has no default duration; ends_at is required.'],
            ]);
        }

        return $this->addDuration($startsAt, $service->duration_value, $service->duration_unit);
    }

    private function addDuration(Carbon $date, int $value, DurationUnit $unit): Carbon
    {
        return match ($unit) {
            DurationUnit::Minutes => $date->clone()->addMinutes($value),
            DurationUnit::Hours => $date->clone()->addHours($value),
            DurationUnit::Days => $date->clone()->addDays($value),
        };
    }
}
