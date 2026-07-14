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
        Schema::create('service_time_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->string('availability_type')->default('standing');
            $table->unsignedTinyInteger('day_of_week')->nullable();
            $table->time('start_time');
            $table->time('end_time');
            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_time_slots');
    }
};
