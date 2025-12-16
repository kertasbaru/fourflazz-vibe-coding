<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = $user->transactions()->with('product.category')->latest();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('reference_number', 'like', '%' . $request->search . '%')
                  ->orWhere('phone_target', 'like', '%' . $request->search . '%');
            });
        }

        $transactions = $query->paginate(15)->withQueryString();

        // Get stats
        $stats = [
            'total' => $user->transactions()->count(),
            'success' => $user->transactions()->where('status', Transaction::STATUS_SUCCESS)->count(),
            'pending' => $user->transactions()->where('status', Transaction::STATUS_PENDING)->count(),
            'failed' => $user->transactions()->where('status', Transaction::STATUS_FAILED)->count(),
        ];

        return Inertia::render('Transactions/Index', [
            'transactions' => $transactions,
            'stats' => $stats,
            'filters' => $request->only(['status', 'from', 'to', 'search']),
        ]);
    }

    public function show(Transaction $transaction)
    {
        // Ensure user can only view their own transactions
        if ($transaction->user_id !== auth()->id()) {
            abort(403);
        }

        $transaction->load('product.category');

        return Inertia::render('Transactions/Show', [
            'transaction' => $transaction,
        ]);
    }
}
