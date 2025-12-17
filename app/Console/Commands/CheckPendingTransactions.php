<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Transaction;
use App\Services\KmspService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckPendingTransactions extends Command
{
    protected $signature = 'transactions:check-pending {--limit=50 : Maximum transactions to check}';
    protected $description = 'Check status of pending/processing transactions via KMSP API';

    protected KmspService $kmspService;

    public function __construct(KmspService $kmspService)
    {
        parent::__construct();
        $this->kmspService = $kmspService;
    }

    public function handle(): int
    {
        $limit = (int) $this->option('limit');

        // Get processing transactions with trx_id
        $transactions = Transaction::where('status', Transaction::STATUS_PROCESSING)
            ->whereNotNull('notes')
            ->latest()
            ->take($limit)
            ->get();

        $this->info("Found {$transactions->count()} processing transactions to check.");

        $updated = 0;
        $failed = 0;

        foreach ($transactions as $transaction) {
            $notes = json_decode($transaction->notes, true) ?? [];
            $trxId = $notes['trx_id'] ?? null;

            if (!$trxId) {
                $this->warn("Transaction #{$transaction->id} has no trx_id, skipping.");
                continue;
            }

            $this->info("Checking transaction #{$transaction->id} (trx_id: {$trxId})...");

            try {
                $result = $this->kmspService->checkTransactionStatus($trxId);

                if ($result['success']) {
                    $newStatus = $result['data']['status'] ?? null;
                    $oldStatus = $transaction->status;

                    if ($newStatus && $newStatus !== $oldStatus) {
                        $transaction->update([
                            'status' => $newStatus,
                            'serial_number' => $result['data']['serial_number'] ?? $transaction->serial_number,
                            'provider_response' => json_encode($result['data']),
                        ]);

                        $updated++;
                        $this->info("  → Status updated: {$oldStatus} → {$newStatus}");

                        // Handle refund if transaction failed
                        $refunded = false;
                        if ($newStatus === Transaction::STATUS_FAILED) {
                            $refunded = $this->refundBalance($transaction, $notes);
                        }

                        // Create notification for status change
                        $this->createNotification($transaction, $newStatus, $refunded);
                    } else {
                        $this->info("  → Status unchanged: {$oldStatus}");
                    }
                } else {
                    $failed++;
                    $this->error("  → API Error: {$result['message']}");
                }
            } catch (\Exception $e) {
                $failed++;
                Log::error("Check pending transaction error", [
                    'transaction_id' => $transaction->id,
                    'error' => $e->getMessage(),
                ]);
                $this->error("  → Exception: {$e->getMessage()}");
            }

            // Small delay to avoid rate limiting
            usleep(200000); // 200ms
        }

        $this->newLine();
        $this->info("Summary: {$updated} updated, {$failed} failed, " . ($transactions->count() - $updated - $failed) . " unchanged.");

        return Command::SUCCESS;
    }

    /**
     * Refund balance if payment was made with balance.
     */
    protected function refundBalance(Transaction $transaction, array $notes): bool
    {
        $paymentMethod = $notes['payment_method'] ?? null;

        if ($paymentMethod === 'BALANCE') {
            $transaction->user->increment('balance', (float) $transaction->amount);
            $this->info("  → Balance refunded: Rp " . number_format((float) $transaction->amount, 0, ',', '.'));
            return true;
        }

        return false;
    }

    /**
     * Create notification based on new status.
     */
    protected function createNotification(Transaction $transaction, string $newStatus, bool $refunded = false): void
    {
        $transaction->load('product');

        $transactionData = [
            'transaction_id' => $transaction->id,
            'reference_number' => $transaction->reference_number,
            'product_name' => $transaction->product?->name ?? 'Unknown Product',
            'phone_target' => $transaction->phone_target,
            'amount' => $transaction->amount,
            'amount_formatted' => 'Rp ' . number_format((float) $transaction->amount, 0, ',', '.'),
            'serial_number' => $transaction->serial_number,
            'refunded' => $refunded,
        ];

        if ($newStatus === Transaction::STATUS_SUCCESS) {
            Notification::createTransactionSuccess($transaction->user_id, $transactionData);
            $this->info("  → Notification sent: Transaction successful");
        } elseif ($newStatus === Transaction::STATUS_FAILED) {
            Notification::createTransactionFailed($transaction->user_id, $transactionData, $refunded);
            $this->info("  → Notification sent: Transaction failed" . ($refunded ? ' (balance refunded)' : ''));
        }
    }
}
