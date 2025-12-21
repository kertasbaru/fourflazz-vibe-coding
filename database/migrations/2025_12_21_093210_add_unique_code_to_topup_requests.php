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
        Schema::table('top_up_requests', function (Blueprint $table) {
            $table->integer('unique_code')->nullable()->after('amount');
            $table->decimal('total_amount', 15, 2)->nullable()->after('unique_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('top_up_requests', function (Blueprint $table) {
            $table->dropColumn(['unique_code', 'total_amount']);
        });
    }
};
