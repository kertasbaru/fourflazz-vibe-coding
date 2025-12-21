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
        Schema::table('product_categories', function (Blueprint $table) {
            $table->enum('input_type', ['phone', 'customer_id'])->default('customer_id')->after('icon');
            $table->string('category_group')->nullable()->after('input_type');
            $table->string('badge_label')->nullable()->after('category_group');
            $table->string('badge_color')->nullable()->after('badge_label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_categories', function (Blueprint $table) {
            $table->dropColumn(['input_type', 'category_group', 'badge_label', 'badge_color']);
        });
    }
};
