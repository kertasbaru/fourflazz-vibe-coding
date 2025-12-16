<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SanPayService
{
    protected string $apiKey;
    protected string $merchantCode;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('sanpay.api_key');
        $this->merchantCode = config('sanpay.merchant_code');
        $this->baseUrl = config('sanpay.base_url');
    }

    /**
     * Generate HMAC-SHA256 signature for request
     */
    protected function generateSignature(string $payload): string
    {
        return hash_hmac('sha256', $payload, $this->apiKey);
    }

    /**
     * Make authenticated request to SanPay API
     */
    protected function makeRequest(string $endpoint, array $data): array
    {
        try {
            $payload = json_encode($data);
            $signature = $this->generateSignature($payload);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-Merchant-Code' => $this->merchantCode,
                'X-Signature' => $signature,
            ])->withBody($payload, 'application/json')
              ->post("{$this->baseUrl}/{$endpoint}");

            $result = $response->json();

            if ($response->successful() && isset($result['status']) && $result['status'] === 'success') {
                return [
                    'success' => true,
                    'data' => $result,
                ];
            }

            Log::error('SanPay API error', [
                'endpoint' => $endpoint,
                'response' => $result,
                'data' => $data,
            ]);

            return [
                'success' => false,
                'message' => $result['message'] ?? 'API request failed',
                'data' => $result,
            ];
        } catch (\Exception $e) {
            Log::error('SanPay API exception', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
                'data' => $data,
            ]);

            return [
                'success' => false,
                'message' => 'Payment service error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Create QRIS payment
     */
    public function createQris(array $data): array
    {
        $payload = [
            'amount' => (int) $data['amount'],
            'partnerReferenceNo' => $data['reference_no'],
            'expirySeconds' => config('sanpay.qris_expiry_seconds', 900),
        ];

        $result = $this->makeRequest('topup_qris', $payload);

        if ($result['success']) {
            return [
                'success' => true,
                'type' => 'qris',
                'qr_content' => $result['data']['qrContent'] ?? null,
                'expires_at' => $result['data']['expiresAt'] ?? null,
                'amount' => $result['data']['amount'] ?? $data['amount'],
                'reference_no' => $result['data']['partnerReferenceNo'] ?? $data['reference_no'],
                'data' => $result['data'],
            ];
        }

        return $result;
    }

    /**
     * Create Virtual Account payment
     */
    public function createVA(array $data): array
    {
        $payload = [
            'amount' => (int) $data['amount'],
            'partnerReferenceNo' => $data['reference_no'],
            'bank_code' => strtoupper($data['bank_code']),
            'name' => $data['customer_name'] ?? '',
        ];

        $result = $this->makeRequest('topup_va', $payload);

        if ($result['success']) {
            return [
                'success' => true,
                'type' => 'va',
                'va_number' => $result['data']['va_number'] ?? null,
                'bank_code' => $result['data']['bank_code'] ?? $data['bank_code'],
                'expires_at' => $result['data']['expiration_date'] ?? null,
                'amount' => $result['data']['amount'] ?? $data['amount'],
                'reference_no' => $result['data']['partnerReferenceNo'] ?? $data['reference_no'],
                'data' => $result['data'],
            ];
        }

        return $result;
    }

    /**
     * Create Retail payment (Alfamart/Indomaret)
     */
    public function createRetail(array $data): array
    {
        $payload = [
            'amount' => (int) $data['amount'],
            'partnerReferenceNo' => $data['reference_no'],
            'retail_outlet' => strtoupper($data['retail_outlet']),
            'name' => $data['customer_name'] ?? '',
        ];

        $result = $this->makeRequest('topup_retail', $payload);

        if ($result['success']) {
            return [
                'success' => true,
                'type' => 'retail',
                'payment_code' => $result['data']['payment_code'] ?? null,
                'retail_outlet' => $result['data']['retail_outlet'] ?? $data['retail_outlet'],
                'expires_at' => $result['data']['expiration_date'] ?? null,
                'amount' => $result['data']['amount'] ?? $data['amount'],
                'reference_no' => $result['data']['partnerReferenceNo'] ?? $data['reference_no'],
                'data' => $result['data'],
            ];
        }

        return $result;
    }

    /**
     * Get available payment channels
     */
    public function getChannels(): array
    {
        try {
            $response = Http::get("{$this->baseUrl}/get_channels", [
                'apikey' => $this->apiKey,
                'merchant_code' => $this->merchantCode,
            ]);

            $result = $response->json();

            if ($response->successful() && isset($result['status']) && $result['status'] === 'success') {
                return [
                    'success' => true,
                    'va_channels' => $result['data']['va_channels'] ?? [],
                    'retail_channels' => $result['data']['retail_channels'] ?? [],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Failed to get channels',
            ];
        } catch (\Exception $e) {
            Log::error('SanPay get channels error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Failed to get payment channels',
            ];
        }
    }

    /**
     * Get transaction history (mutasi)
     */
    public function getMutasi(): array
    {
        try {
            $response = Http::get("{$this->baseUrl}/get_mutasi", [
                'apikey' => $this->apiKey,
                'merchant_code' => $this->merchantCode,
            ]);

            $result = $response->json();

            if ($response->successful() && isset($result['status']) && $result['status'] === 'success') {
                return [
                    'success' => true,
                    'data' => $result['data'] ?? [],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Failed to get transaction history',
            ];
        } catch (\Exception $e) {
            Log::error('SanPay get mutasi error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Failed to get transaction history',
            ];
        }
    }

    /**
     * Verify callback signature
     */
    public function verifyCallback(string $rawBody, string $signature, string $merchantCode): bool
    {
        // Verify merchant code
        if ($merchantCode !== $this->merchantCode) {
            Log::warning('SanPay callback: Invalid merchant code', [
                'received' => $merchantCode,
                'expected' => $this->merchantCode,
            ]);
            return false;
        }

        // Verify signature
        $calculatedSignature = $this->generateSignature($rawBody);
        if (!hash_equals($calculatedSignature, $signature)) {
            Log::warning('SanPay callback: Invalid signature');
            return false;
        }

        return true;
    }

    /**
     * Parse callback data
     */
    public function parseCallback(array $data): array
    {
        // Handle VA/Retail callback format
        if (isset($data['partnerReferenceNo'])) {
            return [
                'type' => 'va_retail',
                'reference_no' => $data['partnerReferenceNo'],
                'external_id' => $data['external_id'] ?? null,
                'amount' => $data['amount'] ?? 0,
                'status' => $data['payment_status'] ?? $data['status'] ?? 'unknown',
                'is_paid' => ($data['payment_status'] ?? '') === 'PAID' || ($data['status'] ?? '') === 'success',
            ];
        }

        // Handle QRIS callback format
        if (isset($data['transactionID'])) {
            return [
                'type' => 'qris',
                'transaction_id' => $data['transactionID'],
                'reference_no' => $data['referenceNo'] ?? null,
                'amount' => $data['amount'] ?? 0,
                'customer_name' => $data['customerName'] ?? '',
                'transaction_date' => $data['transactionDate'] ?? null,
                'is_paid' => true, // QRIS callbacks are only sent on successful payment
                'is_validation_test' => $data['isValidationTest'] ?? false,
            ];
        }

        return [
            'type' => 'unknown',
            'is_paid' => false,
            'data' => $data,
        ];
    }
}
