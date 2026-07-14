<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_time_slot_staff', function (Blueprint $table) {
            $table->foreignId('service_time_slot_id')->constrained('service_time_slots')->cascadeOnDelete();
            $table->foreignId('tenant_staff_id')->constrained('public.tenant_staff')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['service_time_slot_id', 'tenant_staff_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_time_slot_staff');
    }
};
