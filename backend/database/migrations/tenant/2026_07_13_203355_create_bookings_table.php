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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('public.users');
            $table->foreignId('service_id')->constrained('services');
            $table->foreignId('service_time_slot_id')->nullable()->constrained('service_time_slots')->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('public.tenant_staff')->nullOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
