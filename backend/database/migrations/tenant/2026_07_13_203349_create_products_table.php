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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('sku')->nullable();
            $table->unsignedInteger('stock_quantity')->nullable();
            $table->boolean('has_variants')->default(false);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // Cloudinary URLs — max 4 per product, enforced at the application level, not here.
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('url');
            $table->unsignedTinyInteger('position')->default(0);
            $table->timestamps();
        });

        // e.g. "Size", "Color", "Days" — an option group for a product.
        Schema::create('product_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        // e.g. "Small" / "Red" / "3" — the choices within one option group.
        Schema::create('product_option_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_option_id')->constrained('product_options')->cascadeOnDelete();
            $table->string('value');
            $table->timestamps();
        });

        // Only meaningful when products.has_variants is true — one purchasable
        // combination of option values (e.g. Size=Large + Color=Red), with its
        // own price/stock/description overriding the parent product's.
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('price', 10, 2);
            $table->unsignedInteger('stock_quantity')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Which option value(s) make up a given variant, e.g. variant #1 = {Large, Red}.
        Schema::create('product_variant_option_values', function (Blueprint $table) {
            $table->foreignId('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('product_option_value_id')->constrained('product_option_values')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['product_variant_id', 'product_option_value_id']);
        });

        // Cloudinary URLs — max 4 per variant, enforced at the application level, not here.
        Schema::create('product_variant_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->string('url');
            $table->unsignedTinyInteger('position')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variant_images');
        Schema::dropIfExists('product_variant_option_values');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_option_values');
        Schema::dropIfExists('product_options');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
    }
};
