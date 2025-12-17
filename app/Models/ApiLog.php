<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider',
        'endpoint',
        'method',
        'request_data',
        'response_data',
        'response_code',
        'success',
        'error_message',
        'response_time',
        'user_id',
        'ip_address',
    ];

    protected $casts = [
        'request_data' => 'array',
        'response_data' => 'array',
        'success' => 'boolean',
        'response_time' => 'float',
    ];

    /**
     * Get the user who triggered this API call.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for specific provider.
     */
    public function scopeProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Scope for successful calls.
     */
    public function scopeSuccessful($query)
    {
        return $query->where('success', true);
    }

    /**
     * Scope for failed calls.
     */
    public function scopeFailed($query)
    {
        return $query->where('success', false);
    }

    /**
     * Log an API call.
     */
    public static function logApiCall(
        string $provider,
        string $endpoint,
        string $method,
        ?array $requestData,
        ?array $responseData,
        ?int $responseCode,
        bool $success,
        ?string $errorMessage = null,
        ?float $responseTime = null
    ): self {
        return self::create([
            'provider' => $provider,
            'endpoint' => $endpoint,
            'method' => $method,
            'request_data' => $requestData,
            'response_data' => $responseData,
            'response_code' => $responseCode,
            'success' => $success,
            'error_message' => $errorMessage,
            'response_time' => $responseTime,
            'user_id' => auth()->id(),
            'ip_address' => request()->ip(),
        ]);
    }

    /**
     * Get masked request data (hide sensitive info like API keys).
     */
    public function getMaskedRequestDataAttribute(): ?array
    {
        if (!$this->request_data) {
            return null;
        }

        $masked = $this->request_data;
        $sensitiveKeys = ['api_key', 'password', 'token', 'access_token', 'otp'];

        foreach ($sensitiveKeys as $key) {
            if (isset($masked[$key])) {
                $masked[$key] = '***HIDDEN***';
            }
        }

        return $masked;
    }
}
