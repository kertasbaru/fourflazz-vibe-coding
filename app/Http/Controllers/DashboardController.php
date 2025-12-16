<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Transaction;
use App\Models\TopUpRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get user's recent transactions
        $recentTransactions = $user->transactions()
            ->with('product')
            ->latest()
            ->take(5)
            ->get();

        // Get transaction stats
        $totalTransactions = $user->transactions()->count();
        $successfulTransactions = $user->transactions()
            ->where('status', Transaction::STATUS_SUCCESS)
            ->count();
        $totalSpent = $user->transactions()
            ->where('status', Transaction::STATUS_SUCCESS)
            ->sum('amount');

        // Get pending top-ups
        $pendingTopUps = $user->topUpRequests()
            ->where('status', TopUpRequest::STATUS_PENDING)
            ->count();

        // Get categories for quick access
        $categories = ProductCategory::active()
            ->ordered()
            ->take(6)
            ->get();

        // Get popular products
        $popularProducts = Product::active()
            ->with('category')
            ->ordered()
            ->take(6)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'balance' => $user->balance,
                'formattedBalance' => $user->formatted_balance,
                'totalTransactions' => $totalTransactions,
                'successfulTransactions' => $successfulTransactions,
                'totalSpent' => $totalSpent,
                'pendingTopUps' => $pendingTopUps,
            ],
            'recentTransactions' => $recentTransactions,
            'categories' => $categories,
            'popularProducts' => $popularProducts,
        ]);
    }
}
