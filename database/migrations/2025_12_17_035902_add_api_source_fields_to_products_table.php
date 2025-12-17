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
            $table->string('api_source')->nullable()->after('product_code'); // kmsp, kaje, etc.
            $table->string('external_code')->nullable()->after('api_source'); // Original code from API
            $table->json('api_metadata')->nullable()->after('external_code'); // Additional data from API

            // Add index for faster lookups
            $table->index(['api_source', 'external_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['api_source', 'external_code']);
            $table->dropColumn(['api_source', 'external_code', 'api_metadata']);
        });
    }
};
