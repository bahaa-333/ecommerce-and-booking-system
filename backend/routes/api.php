<?php

use App\Http\Controllers\Api\Admin\BusinessTypeController;
use App\Http\Controllers\Api\Admin\TenantController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
});

Route::prefix('admin')->group(function () {
    Route::apiResource('business-types', BusinessTypeController::class);
    Route::apiResource('tenants', TenantController::class);
});
