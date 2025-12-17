<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // KAJE-specific: Support for multi-brand products
            $table->json('brands')->nullable()->after('provider');

            // KAJE-specific: Phone number prefixes for SIM card validation
            $table->json('prefixes')->nullable()->after('brands');

            // Enhanced stock tracking
            $table->timestamp('last_stock_check_at')->nullable()->after('stock');
            $table->enum('stock_status', ['available', 'limited', 'out_of_stock', 'unknown'])
                ->default('unknown')
                ->after('last_stock_check_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['brands', 'prefixes', 'last_stock_check_at', 'stock_status']);
        });
    }
};
