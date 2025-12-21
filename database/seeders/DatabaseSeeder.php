<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create verified admin user for both production and development
        User::create([
            'name' => 'Admin',
            'email' => 'admin@fourflazz.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(), // Auto-verify
            'role' => 'admin',
            'balance' => 0,
        ]);
    }
}
