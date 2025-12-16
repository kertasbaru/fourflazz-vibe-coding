<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::withCount('transactions');

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function show(User $user)
    {
        $user->loadCount('transactions');
        
        $recentTransactions = $user->transactions()
            ->with('product')
            ->latest()
            ->take(10)
            ->get();

        $recentTopUps = $user->topUpRequests()
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'recentTransactions' => $recentTransactions,
            'recentTopUps' => $recentTopUps,
        ]);
    }

    public function edit(User $user)
    {
        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:user,admin',
        ]);

        $user->update($validated);

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    public function adjustBalance(Request $request, User $user)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'type' => 'required|in:add,deduct',
            'notes' => 'nullable|string|max:255',
        ]);

        $amount = abs($validated['amount']);

        if ($validated['type'] === 'add') {
            $user->addBalance($amount);
            $message = 'Added Rp ' . number_format($amount, 0, ',', '.') . ' to user balance.';
        } else {
            if ($user->balance < $amount) {
                return back()->with('error', 'User balance is insufficient for this deduction.');
            }
            $user->deductBalance($amount);
            $message = 'Deducted Rp ' . number_format($amount, 0, ',', '.') . ' from user balance.';
        }

        return back()->with('success', $message);
    }
}
