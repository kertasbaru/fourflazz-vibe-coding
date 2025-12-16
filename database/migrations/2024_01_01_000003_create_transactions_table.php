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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->string('phone_target'); // Phone number to receive the product
            $table->decimal('amount', 15, 2); // Transaction amount (selling price)
            $table->decimal('profit', 15, 2)->default(0); // Profit from the transaction
            $table->string('reference_number')->unique(); // Unique transaction reference
            $table->enum('status', ['pending', 'processing', 'success', 'failed', 'refunded'])->default('pending');
            $table->text('notes')->nullable();
            $table->text('provider_response')->nullable(); // API response from provider
            $table->string('serial_number')->nullable(); // Serial number if applicable
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('reference_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
