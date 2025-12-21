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
        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->string('type')->index(); // 'macrodroid_notification', 'topup_verification', etc
            $table->string('method')->default('POST');
            $table->string('endpoint');
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('headers')->nullable();
            $table->json('request_data');
            $table->json('response_data')->nullable();
            $table->integer('response_status')->nullable();
            $table->boolean('success')->default(false);
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_logs');
    }
};
