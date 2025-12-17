<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OtpSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'provider',
        'phone',
        'session_id',
        'access_token',
        'auth_id',
        'otp_requested_at',
        'expires_at',
        'last_extended_at',
        'is_active',
    ];

    protected $casts = [
        'otp_requested_at' => 'datetime',
        'expires_at' => 'datetime',
        'last_extended_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Get the user that owns this session.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for active sessions.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for specific provider.
     */
    public function scopeProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Scope for KMSP provider.
     */
    public function scopeKmsp($query)
    {
        return $query->where('provider', 'kmsp');
    }

    /**
     * Check if session is expired.
     */
    public function isExpired(): bool
    {
        if (!$this->expires_at) {
            return false;
        }

        return $this->expires_at->isPast();
    }

    /**
     * Check if session can be extended.
     */
    public function canExtend(): bool
    {
        return $this->is_active && $this->access_token && $this->session_id;
    }

    /**
     * Get formatted access token for API calls.
     */
    public function getFormattedTokenAttribute(): ?string
    {
        if (!$this->session_id || !$this->access_token) {
            return null;
        }

        return "{$this->session_id}:{$this->access_token}";
    }

    /**
     * Get masked phone for display.
     */
    public function getMaskedPhoneAttribute(): string
    {
        if (strlen($this->phone) < 8) {
            return $this->phone;
        }

        return substr($this->phone, 0, 4) . '****' . substr($this->phone, -4);
    }
}
