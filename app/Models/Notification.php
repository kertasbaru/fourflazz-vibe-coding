<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    const TYPE_TRANSACTION_SUCCESS = 'transaction_success';
    const TYPE_TRANSACTION_FAILED = 'transaction_failed';
    const TYPE_TRANSACTION_REFUNDED = 'transaction_refunded';
    const TYPE_TOPUP_SUCCESS = 'topup_success';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    /**
     * Get the user this notification belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if notification is read.
     */
    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(): void
    {
        if (!$this->read_at) {
            $this->update(['read_at' => now()]);
        }
    }

    /**
     * Scope for unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Get icon based on notification type.
     */
    public function getIconAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_TRANSACTION_SUCCESS => 'check_circle',
            self::TYPE_TRANSACTION_FAILED => 'error',
            self::TYPE_TRANSACTION_REFUNDED => 'undo',
            self::TYPE_TOPUP_SUCCESS => 'account_balance_wallet',
            default => 'notifications',
        };
    }

    /**
     * Get color based on notification type.
     */
    public function getColorAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_TRANSACTION_SUCCESS, self::TYPE_TOPUP_SUCCESS => 'emerald',
            self::TYPE_TRANSACTION_FAILED => 'red',
            self::TYPE_TRANSACTION_REFUNDED => 'purple',
            default => 'blue',
        };
    }

    /**
     * Create a transaction success notification.
     */
    public static function createTransactionSuccess(int $userId, array $transactionData): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_TRANSACTION_SUCCESS,
            'title' => 'Transaction Successful',
            'message' => "Your purchase of {$transactionData['product_name']} for {$transactionData['phone_target']} was successful.",
            'data' => $transactionData,
        ]);
    }

    /**
     * Create a transaction failed notification.
     */
    public static function createTransactionFailed(int $userId, array $transactionData, bool $refunded = false): self
    {
        $message = "Your purchase of {$transactionData['product_name']} for {$transactionData['phone_target']} has failed.";
        if ($refunded) {
            $message .= " Your balance of {$transactionData['amount_formatted']} has been refunded.";
        }

        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_TRANSACTION_FAILED,
            'title' => 'Transaction Failed',
            'message' => $message,
            'data' => $transactionData,
        ]);
    }

    /**
     * Create a top-up success notification.
     */
    public static function createTopUpSuccess(int $userId, array $topUpData): self
    {
        return self::create([
            'user_id' => $userId,
            'type' => self::TYPE_TOPUP_SUCCESS,
            'title' => 'Top Up Successful',
            'message' => "Your balance has been topped up by {$topUpData['amount_formatted']}.",
            'data' => $topUpData,
        ]);
    }
}
