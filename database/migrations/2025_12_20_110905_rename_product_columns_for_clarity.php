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
            // Rename columns for clarity
            $table->renameColumn('api_source', 'source');
            $table->renameColumn('price', 'cost');
            $table->renameColumn('selling_price', 'price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Revert column names
            $table->renameColumn('source', 'api_source');
            $table->renameColumn('cost', 'price');
            $table->renameColumn('price', 'selling_price');
        });
    }
};
