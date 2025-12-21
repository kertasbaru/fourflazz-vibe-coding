<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TopUpRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TopUpController extends Controller
{
    public function index(Request $request)
    {
        $query = TopUpRequest::with('user')->latest();

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search) {
                        $u->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $topups = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/TopUps/Index', [
            'topups' => $topups,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function updateStatus(Request $request, TopUpRequest $topUpRequest)
    {
        $request->validate([
            'status' => 'required|in:paid,failed',
        ]);

        if ($topUpRequest->status === 'paid') {
            return back()->with('error', 'Transaksi sudah lunas, tidak dapat diubah lagi.');
        }

        $status = $request->status;

        if ($status === 'paid') {
            $topUpRequest->markAsPaid('MANUAL-' . auth()->id());
            return back()->with('success', 'Top up berhasil disetujui.');
        } else {
            $topUpRequest->markAsFailed(['reason' => 'Ditolak oleh admin']);
            return back()->with('success', 'Top up ditolak.');
        }
    }
}
