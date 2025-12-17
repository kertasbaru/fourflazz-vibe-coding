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
        Schema::create('otp_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('provider')->default('kmsp'); // kmsp, kaje
            $table->string('phone'); // Phone number in 628xxx format
            $table->string('session_id')->nullable(); // Session ID from API
            $table->text('access_token')->nullable(); // Access token from login
            $table->string('auth_id')->nullable(); // Auth ID for OTP verification (temporary)
            $table->timestamp('otp_requested_at')->nullable(); // When OTP was requested
            $table->timestamp('expires_at')->nullable(); // Token expiration
            $table->timestamp('last_extended_at')->nullable(); // Last session extension
            $table->boolean('is_active')->default(false); // Active status (true after successful login)
            $table->timestamps();

            // Index for faster lookups
            $table->index(['user_id', 'provider', 'phone']);
            $table->index(['provider', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otp_sessions');
    }
};
