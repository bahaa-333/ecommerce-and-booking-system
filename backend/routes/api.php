<?php

use App\Http\Controllers\Api\Admin\BusinessTypeController;
use App\Http\Controllers\Api\Admin\TenantController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Tenant\BookingController;
use App\Http\Controllers\Api\Tenant\OrderController;
use App\Http\Controllers\Api\Tenant\ProductController;
use App\Http\Controllers\Api\Tenant\ServiceController;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
});

Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::apiResource('business-types', BusinessTypeController::class);
    Route::apiResource('tenants', TenantController::class);
});

// Tenant-scoped catalog. {tenant} is a slug, resolved (and its Postgres
// schema switched to) by the 'tenant' middleware. Browsing is public;
// writes require being the tenant's owner, a platform admin, or active
// tenant staff (see EnsureTenantAccess).
Route::prefix('tenants/{tenant}')->middleware('tenant')->group(function () {
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{product}', [ProductController::class, 'show']);
    Route::get('services', [ServiceController::class, 'index']);
    Route::get('services/{service}', [ServiceController::class, 'show']);

    Route::middleware(['auth:sanctum', 'tenant.access'])->group(function () {
        Route::post('products', [ProductController::class, 'store']);
        Route::put('products/{product}', [ProductController::class, 'update']);
        Route::patch('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy']);

        Route::post('services', [ServiceController::class, 'store']);
        Route::put('services/{service}', [ServiceController::class, 'update']);
        Route::patch('services/{service}', [ServiceController::class, 'update']);
        Route::delete('services/{service}', [ServiceController::class, 'destroy']);
    });

    // Orders and bookings are never public — always someone's own purchase/
    // appointment, or visible to whoever manages the tenant (see
    // Tenant::isManagedBy, checked inside each controller method).
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('orders', [OrderController::class, 'index']);
        Route::post('orders', [OrderController::class, 'store']);
        Route::get('orders/{order}', [OrderController::class, 'show']);

        Route::get('bookings', [BookingController::class, 'index']);
        Route::post('bookings', [BookingController::class, 'store']);
        Route::get('bookings/{booking}', [BookingController::class, 'show']);
    });
});
