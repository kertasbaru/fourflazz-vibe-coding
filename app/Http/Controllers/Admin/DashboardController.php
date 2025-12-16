<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\TopUpRequest;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // User stats
        $totalUsers = User::where('role', 'user')->count();
        $newUsersThisMonth = User::where('role', 'user')
            ->whereMonth('created_at', now()->month)
            ->count();

        // Product stats
        $totalProducts = Product::count();
        $activeProducts = Product::active()->count();

        // Category stats
        $totalCategories = ProductCategory::count();

        // Transaction stats
        $totalTransactions = Transaction::count();
        $successfulTransactions = Transaction::where('status', Transaction::STATUS_SUCCESS)->count();
        $totalRevenue = Transaction::where('status', Transaction::STATUS_SUCCESS)->sum('profit');
        $todayRevenue = Transaction::where('status', Transaction::STATUS_SUCCESS)
            ->whereDate('created_at', today())
            ->sum('profit');

        // Top-up stats
        $totalTopUps = TopUpRequest::where('status', TopUpRequest::STATUS_PAID)->sum('amount');
        $pendingTopUps = TopUpRequest::where('status', TopUpRequest::STATUS_PENDING)->count();

        // Recent transactions
        $recentTransactions = Transaction::with(['user', 'product'])
            ->latest()
            ->take(10)
            ->get();

        // Chart data - last 7 days transactions
        $chartData = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo);
            return [
                'date' => $date->format('M d'),
                'transactions' => Transaction::whereDate('created_at', $date)->count(),
                'revenue' => Transaction::where('status', Transaction::STATUS_SUCCESS)
                    ->whereDate('created_at', $date)
                    ->sum('profit'),
            ];
        });

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalUsers' => $totalUsers,
                'newUsersThisMonth' => $newUsersThisMonth,
                'totalProducts' => $totalProducts,
                'activeProducts' => $activeProducts,
                'totalCategories' => $totalCategories,
                'totalTransactions' => $totalTransactions,
                'successfulTransactions' => $successfulTransactions,
                'totalRevenue' => $totalRevenue,
                'todayRevenue' => $todayRevenue,
                'totalTopUps' => $totalTopUps,
                'pendingTopUps' => $pendingTopUps,
            ],
            'recentTransactions' => $recentTransactions,
            'chartData' => $chartData,
        ]);
    }
}
