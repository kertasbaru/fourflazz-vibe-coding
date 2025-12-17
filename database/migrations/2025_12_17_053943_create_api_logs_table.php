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
        Schema::create('api_logs', function (Blueprint $table) {
            $table->id();
            $table->string('provider'); // kmsp, kaje
            $table->string('endpoint'); // API endpoint called
            $table->string('method')->default('GET'); // HTTP method
            $table->json('request_data')->nullable(); // Request parameters
            $table->json('response_data')->nullable(); // API response
            $table->integer('response_code')->nullable(); // HTTP response code
            $table->boolean('success')->default(false); // Whether the call was successful
            $table->string('error_message')->nullable(); // Error message if failed
            $table->float('response_time')->nullable(); // Response time in seconds
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // User who triggered the call
            $table->string('ip_address')->nullable(); // IP address of request
            $table->timestamps();

            // Indexes for faster queries
            $table->index('provider');
            $table->index('success');
            $table->index('created_at');
            $table->index(['provider', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_logs');
    }
};
