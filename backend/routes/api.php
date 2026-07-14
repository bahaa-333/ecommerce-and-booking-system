<?php

use App\Http\Controllers\Api\Admin\BusinessTypeController;
use App\Http\Controllers\Api\Admin\TenantController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->group(function () {
    Route::apiResource('business-types', BusinessTypeController::class);
    Route::apiResource('tenants', TenantController::class);
});
