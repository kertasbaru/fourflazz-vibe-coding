<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TopUpRequest extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_PAID = 'paid';
    const STATUS_FAILED = 'failed';
    const STATUS_EXPIRED = 'expired';
    const STATUS_CANCELLED = 'cancelled';

    const TYPE_QRIS = 'qris';
    const TYPE_VA = 'va';
    const TYPE_RETAIL = 'retail';

    protected $fillable = [
        'user_id',
        'amount',
        'unique_code',
        'total_amount',
        'order_id',
        'payment_type',
        'payment_method',
        'payment_code',
        'bank_code',
        'payment_transaction_id',
        'status',
        'balance_before',
        'balance_after',
        'paid_at',
        'expired_at',
        'payment_response',
        'payment_proof',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'paid_at' => 'datetime',
        'expired_at' => 'datetime',
        'payment_response' => 'array',
    ];

    /**
     * Get the user who made this request.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate unique order ID.
     */
    public static function generateOrderId(): string
    {
        $prefix = 'TOPUP';
        $date = now()->format('Ymd');
        $random = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
        return "{$prefix}-{$date}-{$random}";
    }

    /**
     * Check if request is paid.
     */
    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    /**
     * Check if request is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Mark as paid and credit user balance.
     */
    public function markAsPaid(string $transactionId = '', array $response = []): void
    {
        if ($this->isPaid()) {
            return; // Already paid, prevent double credit
        }

        $user = $this->user;

        $this->update([
            'status' => self::STATUS_PAID,
            'payment_transaction_id' => $transactionId ?: $this->payment_transaction_id,
            'balance_before' => $user->balance,
            'balance_after' => $user->balance + $this->total_amount, // Use total_amount (includes unique code)
            'paid_at' => now(),
            'payment_response' => array_merge($this->payment_response ?? [], $response),
        ]);

        $user->addBalance($this->total_amount); // Credit total amount including unique code
    }

    /**
     * Mark as failed.
     */
    public function markAsFailed(array $response = []): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'payment_response' => array_merge($this->payment_response ?? [], $response),
        ]);
    }

    /**
     * Get formatted amount.
     */
    public function getFormattedAmountAttribute(): string
    {
        return 'Rp ' . number_format($this->amount, 0, ',', '.');
    }

    /**
     * Get payment method label.
     */
    public function getPaymentMethodLabelAttribute(): string
    {
        return match ($this->payment_method) {
            self::TYPE_QRIS => 'QRIS',
            self::TYPE_VA => 'VA ' . ($this->bank_code ?? ''),
            self::TYPE_RETAIL => $this->bank_code ?? 'Retail',
            default => $this->payment_method ?? '-',
        };
    }

    /**
     * Get status badge color.
     */
    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'amber',
            self::STATUS_PAID => 'emerald',
            self::STATUS_FAILED => 'red',
            self::STATUS_EXPIRED => 'slate',
            self::STATUS_CANCELLED => 'slate',
            default => 'slate',
        };
    }
}
