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
            if (!Schema::hasColumn('top_up_requests', 'bank_code')) {
                $table->string('bank_code')->nullable()->after('payment_code');
            }
            if (!Schema::hasColumn('top_up_requests', 'payment_code')) {
                $table->string('payment_code')->nullable()->after('payment_method');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('top_up_requests', function (Blueprint $table) {
            $table->dropColumn(['bank_code', 'payment_code']);
        });
    }
};
