<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\KmspService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class TransactionController extends Controller
{
    protected KmspService $kmspService;

    public function __construct(KmspService $kmspService)
    {
        $this->kmspService = $kmspService;
    }

    public function index(Request $request)
    {
        $query = Transaction::with(['user', 'product.category']);

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('reference_number', 'like', '%' . $request->search . '%')
                    ->orWhere('phone_target', 'like', '%' . $request->search . '%')
                    ->orWhereHas('user', function ($uq) use ($request) {
                        $uq->where('name', 'like', '%' . $request->search . '%')
                            ->orWhere('email', 'like', '%' . $request->search . '%');
                    });
            });
        }

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

        $transactions = $query->latest()->paginate(20)->withQueryString();

        // Stats
        $stats = [
            'total' => Transaction::count(),
            'success' => Transaction::where('status', Transaction::STATUS_SUCCESS)->count(),
            'pending' => Transaction::where('status', Transaction::STATUS_PENDING)->count(),
            'processing' => Transaction::where('status', Transaction::STATUS_PROCESSING)->count(),
            'failed' => Transaction::where('status', Transaction::STATUS_FAILED)->count(),
            'totalRevenue' => Transaction::where('status', Transaction::STATUS_SUCCESS)->sum('profit'),
        ];

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'from', 'to']),
        ]);
    }

    /**
     * Show transaction details.
     */
    public function show(Transaction $transaction)
    {
        $transaction->load(['user', 'product.category']);

        return Inertia::render('Admin/Transactions/Show', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Update transaction status manually.
     */
    public function updateStatus(Request $request, Transaction $transaction): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,processing,success,failed,refunded',
            'notes' => 'nullable|string|max:500',
        ]);

        $oldStatus = $transaction->status;
        $newStatus = $request->status;
        $user = $request->user();

        // Handle refund if changing to failed/refunded from a paid status
        if (
            in_array($newStatus, ['failed', 'refunded']) &&
            in_array($oldStatus, ['pending', 'processing', 'success'])
        ) {

            // Check if payment was by balance and refund if needed
            $notes = json_decode($transaction->notes, true) ?? [];
            if (($notes['payment_method'] ?? '') === 'BALANCE') {
                $transaction->user->increment('balance', (float) $transaction->amount);
            }
        }

        // Update transaction
        $currentNotes = json_decode($transaction->notes, true) ?? [];
        $currentNotes['admin_update'] = [
            'previous_status' => $oldStatus,
            'updated_by' => $user->name,
            'updated_at' => now()->toIso8601String(),
            'admin_notes' => $request->notes,
        ];

        $transaction->update([
            'status' => $newStatus,
            'notes' => json_encode($currentNotes),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Transaction status updated from {$oldStatus} to {$newStatus}",
        ]);
    }

    /**
     * Check transaction status from provider API.
     */
    public function checkStatus(Transaction $transaction): JsonResponse
    {
        // Get trx_id from notes
        $notes = json_decode($transaction->notes, true) ?? [];
        $trxId = $notes['trx_id'] ?? null;

        if (!$trxId) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot check status: This transaction does not have an external transaction ID from the provider. Please update the status manually.',
            ], 400);
        }

        // Check with KMSP API
        $result = $this->kmspService->checkTransactionStatus($trxId);

        if ($result['success']) {
            $newStatus = $result['data']['status'] ?? null;
            $oldStatus = $transaction->status;
            $refunded = false;
            $refundAmount = 0;

            if ($newStatus && $newStatus !== $oldStatus) {
                $transaction->update([
                    'status' => $newStatus,
                    'serial_number' => $result['data']['serial_number'] ?? $transaction->serial_number,
                    'provider_response' => json_encode($result['data']),
                ]);

                // Handle refund if transaction failed
                if ($newStatus === Transaction::STATUS_FAILED) {
                    $paymentMethod = $notes['payment_method'] ?? null;
                    if ($paymentMethod === 'BALANCE') {
                        $transaction->user->increment('balance', (float) $transaction->amount);
                        $refunded = true;
                        $refundAmount = $transaction->amount;
                    }
                }

                // Send notification to user
                $transaction->load('product');
                $transactionData = [
                    'transaction_id' => $transaction->id,
                    'reference_number' => $transaction->reference_number,
                    'product_name' => $transaction->product?->name ?? 'Unknown Product',
                    'phone_target' => $transaction->phone_target,
                    'amount' => $transaction->amount,
                    'amount_formatted' => 'Rp ' . number_format((float) $transaction->amount, 0, ',', '.'),
                    'serial_number' => $result['data']['serial_number'] ?? null,
                    'refunded' => $refunded,
                ];

                if ($newStatus === Transaction::STATUS_SUCCESS) {
                    \App\Models\Notification::createTransactionSuccess($transaction->user_id, $transactionData);
                } elseif ($newStatus === Transaction::STATUS_FAILED) {
                    \App\Models\Notification::createTransactionFailed($transaction->user_id, $transactionData, $refunded);
                }
            }

            return response()->json([
                'success' => true,
                'message' => $oldStatus !== $newStatus
                    ? "Status updated: {$oldStatus} → {$newStatus}" . ($refunded ? ' (balance refunded)' : '')
                    : 'Status unchanged',
                'data' => [
                    'previous_status' => $oldStatus,
                    'current_status' => $newStatus ?? $oldStatus,
                    'status_changed' => $oldStatus !== $newStatus,
                    'api_status' => $result['data']['status'] ?? null,
                    'serial_number' => $result['data']['serial_number'] ?? null,
                    'refunded' => $refunded,
                    'refund_amount' => $refundAmount,
                    'refund_amount_formatted' => $refunded ? 'Rp ' . number_format((float) $refundAmount, 0, ',', '.') : null,
                ],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'] ?? 'Failed to check transaction status',
        ], 400);
    }
}

