<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            // No schema changes needed - using existing settings table structure
        });

        // Insert default QRIS settings
        DB::table('settings')->insertOrIgnore([
            [
                'key' => 'qris_mode',
                'value' => 'static',
                'type' => 'string',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'qris_data',
                'value' => json_encode([]),
                'type' => 'json',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            // No schema changes to revert
        });

        // Remove QRIS settings
        DB::table('settings')->whereIn('key', ['qris_mode', 'qris_data'])->delete();
    }
};
