<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        User::create([
            'name' => 'Admin',
            'email' => 'admin@fourflazz.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'balance' => 0,
        ]);

        // Create Test User
        User::create([
            'name' => 'Test User',
            'email' => 'user@fourflazz.com',
            'phone' => '081234567890',
            'password' => bcrypt('password'),
            'role' => 'user',
            'balance' => 100000,
        ]);

        // Create Categories
        $categories = [
            [
                'name' => 'Pulsa',
                'slug' => 'pulsa',
                'icon' => 'phone_android',
                'description' => 'Isi ulang pulsa semua operator',
                'sort_order' => 1,
            ],
            [
                'name' => 'Paket Data',
                'slug' => 'paket-data',
                'icon' => 'signal_cellular_alt',
                'description' => 'Paket internet semua operator',
                'sort_order' => 2,
            ],
            [
                'name' => 'Token Listrik',
                'slug' => 'token-listrik',
                'icon' => 'bolt',
                'description' => 'Token listrik PLN prabayar',
                'sort_order' => 3,
            ],
            [
                'name' => 'E-Wallet',
                'slug' => 'e-wallet',
                'icon' => 'account_balance_wallet',
                'description' => 'Top up e-wallet populer',
                'sort_order' => 4,
            ],
            [
                'name' => 'Voucher Game',
                'slug' => 'voucher-game',
                'icon' => 'sports_esports',
                'description' => 'Voucher game online populer',
                'sort_order' => 5,
            ],
            [
                'name' => 'BPJS',
                'slug' => 'bpjs',
                'icon' => 'health_and_safety',
                'description' => 'Pembayaran BPJS Kesehatan',
                'sort_order' => 6,
            ],
        ];

        foreach ($categories as $category) {
            ProductCategory::create($category);
        }

        // Create Sample Products
        $pulsa = ProductCategory::where('slug', 'pulsa')->first();
        $paketData = ProductCategory::where('slug', 'paket-data')->first();
        $tokenListrik = ProductCategory::where('slug', 'token-listrik')->first();
        $eWallet = ProductCategory::where('slug', 'e-wallet')->first();
        $voucherGame = ProductCategory::where('slug', 'voucher-game')->first();

        // Pulsa Telkomsel
        $pulsaProducts = [
            ['name' => 'Telkomsel 5.000', 'price' => 5500, 'selling_price' => 6000, 'provider' => 'Telkomsel'],
            ['name' => 'Telkomsel 10.000', 'price' => 10500, 'selling_price' => 11000, 'provider' => 'Telkomsel'],
            ['name' => 'Telkomsel 20.000', 'price' => 20500, 'selling_price' => 21000, 'provider' => 'Telkomsel'],
            ['name' => 'Telkomsel 50.000', 'price' => 50500, 'selling_price' => 51000, 'provider' => 'Telkomsel'],
            ['name' => 'Telkomsel 100.000', 'price' => 100500, 'selling_price' => 101000, 'provider' => 'Telkomsel'],
            ['name' => 'XL 5.000', 'price' => 5400, 'selling_price' => 6000, 'provider' => 'XL'],
            ['name' => 'XL 10.000', 'price' => 10400, 'selling_price' => 11000, 'provider' => 'XL'],
            ['name' => 'XL 25.000', 'price' => 25400, 'selling_price' => 26000, 'provider' => 'XL'],
            ['name' => 'XL 50.000', 'price' => 50400, 'selling_price' => 51000, 'provider' => 'XL'],
            ['name' => 'Indosat 5.000', 'price' => 5300, 'selling_price' => 6000, 'provider' => 'Indosat'],
            ['name' => 'Indosat 10.000', 'price' => 10300, 'selling_price' => 11000, 'provider' => 'Indosat'],
            ['name' => 'Indosat 25.000', 'price' => 25300, 'selling_price' => 26000, 'provider' => 'Indosat'],
        ];

        foreach ($pulsaProducts as $product) {
            Product::create([
                'category_id' => $pulsa->id,
                'name' => $product['name'],
                'slug' => Str::slug($product['name']) . '-' . Str::random(4),
                'description' => 'Pulsa ' . $product['provider'],
                'price' => $product['price'],
                'selling_price' => $product['selling_price'],
                'provider' => $product['provider'],
                'product_code' => strtoupper(Str::random(8)),
                'type' => 'prepaid',
                'stock' => -1,
                'is_active' => true,
            ]);
        }

        // Paket Data
        $dataProducts = [
            ['name' => 'Telkomsel 1GB 7 Hari', 'price' => 12000, 'selling_price' => 15000, 'provider' => 'Telkomsel'],
            ['name' => 'Telkomsel 3GB 30 Hari', 'price' => 30000, 'selling_price' => 35000, 'provider' => 'Telkomsel'],
            ['name' => 'Telkomsel 10GB 30 Hari', 'price' => 75000, 'selling_price' => 80000, 'provider' => 'Telkomsel'],
            ['name' => 'XL 2GB 30 Hari', 'price' => 20000, 'selling_price' => 25000, 'provider' => 'XL'],
            ['name' => 'XL 5GB 30 Hari', 'price' => 45000, 'selling_price' => 50000, 'provider' => 'XL'],
            ['name' => 'Indosat 3GB 30 Hari', 'price' => 28000, 'selling_price' => 33000, 'provider' => 'Indosat'],
        ];

        foreach ($dataProducts as $product) {
            Product::create([
                'category_id' => $paketData->id,
                'name' => $product['name'],
                'slug' => Str::slug($product['name']) . '-' . Str::random(4),
                'description' => 'Paket data ' . $product['provider'],
                'price' => $product['price'],
                'selling_price' => $product['selling_price'],
                'provider' => $product['provider'],
                'product_code' => strtoupper(Str::random(8)),
                'type' => 'prepaid',
                'stock' => -1,
                'is_active' => true,
            ]);
        }

        // Token Listrik
        $tokenProducts = [
            ['name' => 'Token PLN 20.000', 'price' => 20500, 'selling_price' => 22000],
            ['name' => 'Token PLN 50.000', 'price' => 50500, 'selling_price' => 52000],
            ['name' => 'Token PLN 100.000', 'price' => 100500, 'selling_price' => 102000],
            ['name' => 'Token PLN 200.000', 'price' => 200500, 'selling_price' => 202000],
            ['name' => 'Token PLN 500.000', 'price' => 500500, 'selling_price' => 502000],
        ];

        foreach ($tokenProducts as $product) {
            Product::create([
                'category_id' => $tokenListrik->id,
                'name' => $product['name'],
                'slug' => Str::slug($product['name']) . '-' . Str::random(4),
                'description' => 'Token listrik PLN prabayar',
                'price' => $product['price'],
                'selling_price' => $product['selling_price'],
                'provider' => 'PLN',
                'product_code' => strtoupper(Str::random(8)),
                'type' => 'prepaid',
                'stock' => -1,
                'is_active' => true,
            ]);
        }

        // E-Wallet
        $walletProducts = [
            ['name' => 'GoPay 20.000', 'price' => 20500, 'selling_price' => 21500, 'provider' => 'GoPay'],
            ['name' => 'GoPay 50.000', 'price' => 50500, 'selling_price' => 51500, 'provider' => 'GoPay'],
            ['name' => 'GoPay 100.000', 'price' => 100500, 'selling_price' => 101500, 'provider' => 'GoPay'],
            ['name' => 'OVO 20.000', 'price' => 20500, 'selling_price' => 21500, 'provider' => 'OVO'],
            ['name' => 'OVO 50.000', 'price' => 50500, 'selling_price' => 51500, 'provider' => 'OVO'],
            ['name' => 'DANA 25.000', 'price' => 25500, 'selling_price' => 26500, 'provider' => 'DANA'],
            ['name' => 'DANA 50.000', 'price' => 50500, 'selling_price' => 51500, 'provider' => 'DANA'],
            ['name' => 'ShopeePay 25.000', 'price' => 25500, 'selling_price' => 26500, 'provider' => 'ShopeePay'],
        ];

        foreach ($walletProducts as $product) {
            Product::create([
                'category_id' => $eWallet->id,
                'name' => $product['name'],
                'slug' => Str::slug($product['name']) . '-' . Str::random(4),
                'description' => 'Top up ' . $product['provider'],
                'price' => $product['price'],
                'selling_price' => $product['selling_price'],
                'provider' => $product['provider'],
                'product_code' => strtoupper(Str::random(8)),
                'type' => 'prepaid',
                'stock' => -1,
                'is_active' => true,
            ]);
        }

        // Voucher Game
        $gameProducts = [
            ['name' => 'Mobile Legends 86 Diamonds', 'price' => 19000, 'selling_price' => 22000, 'provider' => 'Mobile Legends'],
            ['name' => 'Mobile Legends 172 Diamonds', 'price' => 38000, 'selling_price' => 44000, 'provider' => 'Mobile Legends'],
            ['name' => 'Free Fire 100 Diamonds', 'price' => 14000, 'selling_price' => 16000, 'provider' => 'Free Fire'],
            ['name' => 'Free Fire 310 Diamonds', 'price' => 42000, 'selling_price' => 48000, 'provider' => 'Free Fire'],
            ['name' => 'PUBG Mobile 60 UC', 'price' => 13000, 'selling_price' => 15000, 'provider' => 'PUBG Mobile'],
            ['name' => 'Genshin Impact 60 Genesis', 'price' => 14000, 'selling_price' => 16000, 'provider' => 'Genshin Impact'],
        ];

        foreach ($gameProducts as $product) {
            Product::create([
                'category_id' => $voucherGame->id,
                'name' => $product['name'],
                'slug' => Str::slug($product['name']) . '-' . Str::random(4),
                'description' => 'Voucher ' . $product['provider'],
                'price' => $product['price'],
                'selling_price' => $product['selling_price'],
                'provider' => $product['provider'],
                'product_code' => strtoupper(Str::random(8)),
                'type' => 'prepaid',
                'stock' => -1,
                'is_active' => true,
            ]);
        }
    }
}
