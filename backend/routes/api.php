<?php

use App\Http\Controllers\Api\Admin\BusinessTypeController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\TenantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\StoreSignupController;
use App\Http\Controllers\Api\TenantDiscoveryController;
use App\Http\Controllers\Api\Tenant\BookingController;
use App\Http\Controllers\Api\Tenant\OrderController;
use App\Http\Controllers\Api\Tenant\PaymentController;
use App\Http\Controllers\Api\Tenant\ProductController;
use App\Http\Controllers\Api\Tenant\ProductImageController;
use App\Http\Controllers\Api\Tenant\ServiceController;
use App\Http\Controllers\Api\Tenant\ServiceImageController;
use App\Http\Controllers\Api\Tenant\ServiceTimeSlotController;
use App\Http\Controllers\Api\Tenant\TenantStaffController;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register']);
Route::post('store-signup', [StoreSignupController::class, 'store']);
Route::post('login', [AuthController::class, 'login']);

// Public — the signup page's business-type dropdown needs the full list
// before any tenant exists, so it can't rely on TenantDiscoveryController.
Route::get('business-types', [BusinessTypeController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    // Not tenant-scoped -- a user's notifications span every tenant
    // they've ordered/booked with or work for.
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
});

Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('stats', [DashboardController::class, 'stats']);
    Route::apiResource('business-types', BusinessTypeController::class);
    Route::apiResource('tenants', TenantController::class);
});

// Public tenant discovery — how a customer finds a business at all, before
// they know its slug. Not tenant-scoped, doesn't touch a tenant's schema.
Route::get('tenants', [TenantDiscoveryController::class, 'index']);

// Tenant-scoped catalog. {tenant} is a slug, resolved (and its Postgres
// schema switched to) by the 'tenant' middleware. Browsing is public;
// writes require being the tenant's owner, a platform admin, or active
// tenant staff (see EnsureTenantAccess).
Route::prefix('tenants/{tenant}')->middleware('tenant')->group(function () {
    Route::get('/', [TenantDiscoveryController::class, 'show']);

    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{product}', [ProductController::class, 'show']);
    Route::get('services', [ServiceController::class, 'index']);
    Route::get('services/{service}', [ServiceController::class, 'show']);

    Route::middleware(['auth:sanctum', 'tenant.access'])->group(function () {
        Route::post('products', [ProductController::class, 'store']);
        Route::put('products/{product}', [ProductController::class, 'update']);
        Route::patch('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy']);
        Route::post('products/{product}/images', [ProductImageController::class, 'store']);
        Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy']);

        Route::post('services', [ServiceController::class, 'store']);
        Route::put('services/{service}', [ServiceController::class, 'update']);
        Route::patch('services/{service}', [ServiceController::class, 'update']);
        Route::delete('services/{service}', [ServiceController::class, 'destroy']);
        Route::post('services/{service}/images', [ServiceImageController::class, 'store']);
        Route::delete('services/{service}/images/{image}', [ServiceImageController::class, 'destroy']);

        Route::post('services/{service}/time-slots', [ServiceTimeSlotController::class, 'store']);
        Route::patch('services/{service}/time-slots/{slot}', [ServiceTimeSlotController::class, 'update']);
        Route::delete('services/{service}/time-slots/{slot}', [ServiceTimeSlotController::class, 'destroy']);
        Route::put('services/{service}/time-slots/{slot}/staff', [ServiceTimeSlotController::class, 'syncStaff']);
    });

    Route::get('services/{service}/time-slots', [ServiceTimeSlotController::class, 'index']);

    // Orders and bookings are never public — always someone's own purchase/
    // appointment, or visible to whoever manages the tenant (see
    // Tenant::isManagedBy, checked inside each controller method).
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('orders', [OrderController::class, 'index']);
        Route::post('orders', [OrderController::class, 'store']);
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::patch('orders/{order}', [OrderController::class, 'update']);

        Route::get('bookings', [BookingController::class, 'index']);
        Route::post('bookings', [BookingController::class, 'store']);
        Route::get('bookings/{booking}', [BookingController::class, 'show']);
        Route::patch('bookings/{booking}', [BookingController::class, 'update']);

        Route::patch('payments/{payment}', [PaymentController::class, 'update']);

        Route::get('staff', [TenantStaffController::class, 'index']);
        Route::post('staff', [TenantStaffController::class, 'store']);
        Route::patch('staff/{staff}', [TenantStaffController::class, 'update']);
        Route::delete('staff/{staff}', [TenantStaffController::class, 'destroy']);
    });
});
