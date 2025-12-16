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
        Schema::table('top_up_requests', function (Blueprint $table) {
            // Rename Midtrans-specific columns to generic names
            $table->renameColumn('snap_token', 'payment_url');
            $table->renameColumn('midtrans_transaction_id', 'payment_transaction_id');
            $table->renameColumn('midtrans_response', 'payment_response');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('top_up_requests', function (Blueprint $table) {
            $table->renameColumn('payment_url', 'snap_token');
            $table->renameColumn('payment_transaction_id', 'midtrans_transaction_id');
            $table->renameColumn('payment_response', 'midtrans_response');
        });
    }
};
