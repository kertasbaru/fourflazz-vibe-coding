<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing categories with appropriate values
        $updates = [
            // Phone-based categories
            ['slug' => 'pulsa', 'input_type' => 'phone', 'category_group' => 'Gaya Hidup', 'badge_label' => 'PROMO', 'badge_color' => '#FF6B35'],
            ['slug' => 'paket-data', 'input_type' => 'phone', 'category_group' => 'Gaya Hidup', 'badge_label' => null, 'badge_color' => null],

            // Customer ID based categories  
            ['slug' => 'token-listrik', 'input_type' => 'customer_id', 'category_group' => 'Gaya Hidup', 'badge_label' => 'BARU', 'badge_color' => '#4CAF50'],
            ['slug' => 'e-wallet', 'input_type' => 'customer_id', 'category_group' => 'Keuangan', 'badge_label' => null, 'badge_color' => null],
            ['slug' => 'voucher-game', 'input_type' => 'customer_id', 'category_group' => 'Games', 'badge_label' => 'PROMO', 'badge_color' => '#FF6B35'],
            ['slug' => 'bpjs', 'input_type' => 'customer_id', 'category_group' => 'Keuangan', 'badge_label' => null, 'badge_color' => null],
            ['slug' => 'others', 'input_type' => 'customer_id', 'category_group' => 'Lainnya', 'badge_label' => null, 'badge_color' => null],
        ];

        foreach ($updates as $update) {
            DB::table('product_categories')
                ->where('slug', $update['slug'])
                ->update([
                        'input_type' => $update['input_type'],
                        'category_group' => $update['category_group'],
                        'badge_label' => $update['badge_label'],
                        'badge_color' => $update['badge_color'],
                    ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse needed as we're just updating data
    }
};
