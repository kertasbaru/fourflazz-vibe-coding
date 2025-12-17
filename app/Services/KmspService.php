<?php

namespace App\Services;

use App\Contracts\ProductProviderInterface;
use App\Traits\LogsApiCalls;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KmspService implements ProductProviderInterface
{
    use LogsApiCalls;
    protected string $apiKey;
    protected string $baseUrl;
    protected bool $enabled;
    protected int $timeout;

    // API endpoint base URLs for different services
    protected const OTP_REQUEST_URL = 'https://golang-openapi-reqotp-xltembakservice.kmsp-store.com';
    protected const OTP_LOGIN_URL = 'https://golang-openapi-login-xltembakservice.kmsp-store.com';
    protected const ACCESS_TOKEN_LIST_URL = 'https://golang-openapi-accesstokenlist-xltembakservice.kmsp-store.com';
    protected const PURCHASE_URL = 'https://golang-openapi-packagepurchase-xltembakservice.kmsp-store.com';

    public function __construct()
    {
        $this->apiKey = config('providers.kmsp.api_key');
        $this->baseUrl = config('providers.kmsp.base_url');
        $this->enabled = config('providers.kmsp.enabled', true);
        $this->timeout = config('providers.kmsp.timeout', 30);
    }

    /**
     * Get the provider name identifier.
     */
    public function getProviderName(): string
    {
        return 'kmsp';
    }

    /**
     * Check if the provider is enabled.
     */
    public function isEnabled(): bool
    {
        return $this->enabled && !empty($this->apiKey);
    }

    /**
     * Get list of products from KMSP API.
     *
     * @return array{success: bool, data?: array, message?: string}
     */
    public function getProducts(): array
    {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KMSP provider is not enabled or API key is missing. Please add KMSP_API_KEY to your .env file.',
            ];
        }

        try {
            $logged = $this->makeLoggedRequest('GET', "{$this->baseUrl}/v1", [
                'api_key' => $this->apiKey,
            ], 'products');

            $result = $logged['result'];

            if ($logged['success']) {
                $normalizedProducts = $this->normalizeProducts($result['data'] ?? []);

                return [
                    'success' => true,
                    'data' => $normalizedProducts,
                    'raw' => $result['data'] ?? [],
                    'count' => count($normalizedProducts),
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Failed to fetch products from KMSP. Please check your API key.',
                'code' => $result['code'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('KMSP API exception', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'KMSP service error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get account balance from KMSP.
     * Note: KMSP does not have a balance endpoint.
     */
    public function getBalance(): array
    {
        return [
            'success' => false,
            'message' => 'Balance check is not supported by KMSP provider',
        ];
    }

    // =====================================================
    // OTP MANAGEMENT METHODS
    // =====================================================

    /**
     * Request OTP to be sent to phone number.
     *
     * @param string $phone Phone number in 628xxx format
     * @return array
     */
    public function requestOtp(string $phone): array
    {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KMSP provider is not enabled',
            ];
        }

        try {
            $response = Http::timeout($this->timeout)
                ->get(self::OTP_REQUEST_URL . '/v1', [
                    'api_key' => $this->apiKey,
                    'phone' => $phone,
                    'method' => 'OTP',
                ]);

            $result = $response->json();

            if ($response->successful() && isset($result['status']) && $result['status'] === true) {
                return [
                    'success' => true,
                    'message' => $result['message'] ?? 'OTP sent successfully',
                    'data' => [
                        'auth_id' => $result['data']['auth_id'] ?? null,
                        'can_resend_in' => $result['data']['can_resend_in'] ?? 60,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Failed to send OTP. Please check the phone number is a valid XL/AXIS/LIVEON number.',
            ];
        } catch (\Exception $e) {
            Log::error('KMSP OTP request error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Failed to request OTP: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Login with OTP code.
     *
     * @param string $phone Phone number
     * @param string $authId Auth ID from request OTP response
     * @param string $otp OTP code received via SMS
     * @return array
     */
    public function loginOtp(string $phone, string $authId, string $otp): array
    {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KMSP provider is not enabled',
            ];
        }

        try {
            $response = Http::timeout($this->timeout)
                ->get(self::OTP_LOGIN_URL . '/v1', [
                    'api_key' => $this->apiKey,
                    'phone' => $phone,
                    'method' => 'OTP',
                    'auth_id' => $authId,
                    'otp' => $otp,
                ]);

            $result = $response->json();

            if ($response->successful() && isset($result['status']) && $result['status'] === true) {
                $accessToken = $result['data']['access_token'] ?? null;

                // Parse session_id from access_token (format: session_id:token)
                $sessionId = null;
                $token = null;
                if ($accessToken && str_contains($accessToken, ':')) {
                    [$sessionId, $token] = explode(':', $accessToken, 2);
                }

                return [
                    'success' => true,
                    'message' => $result['message'] ?? 'Login successful',
                    'data' => [
                        'access_token' => $accessToken,
                        'session_id' => $sessionId,
                        'token' => $token,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Login failed. Please check your OTP code.',
            ];
        } catch (\Exception $e) {
            Log::error('KMSP OTP login error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Failed to login: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get list of active access tokens.
     *
     * @param string|null $msisdn Optional filter by phone number
     * @return array
     */
    public function getAccessTokens(?string $msisdn = null): array
    {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KMSP provider is not enabled',
            ];
        }

        try {
            $params = ['api_key' => $this->apiKey];
            if ($msisdn) {
                $params['msisdn'] = $msisdn;
            }

            $response = Http::timeout($this->timeout)
                ->get(self::ACCESS_TOKEN_LIST_URL . '/v1', $params);

            $result = $response->json();

            if ($response->successful() && isset($result['status']) && $result['status'] === true) {
                return [
                    'success' => true,
                    'data' => $result['data'] ?? [],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Failed to get access tokens',
            ];
        } catch (\Exception $e) {
            Log::error('KMSP access token list error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Failed to get access tokens: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Extend session using existing access token.
     *
     * @param string $phone Phone number
     * @param string $sessionId Session ID
     * @param string $token Token
     * @return array
     */
    public function extendSession(string $phone, string $sessionId, string $token): array
    {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KMSP provider is not enabled',
            ];
        }

        try {
            $response = Http::timeout($this->timeout)
                ->get(self::OTP_LOGIN_URL . '/v1', [
                    'api_key' => $this->apiKey,
                    'phone' => $phone,
                    'method' => 'LOGIN_BY_ACCESS_TOKEN',
                    'auth_id' => "{$sessionId}:{$token}",
                ]);

            $result = $response->json();

            if ($response->successful() && isset($result['status']) && $result['status'] === true) {
                $newAccessToken = $result['data']['access_token'] ?? null;

                // Parse new session_id and token
                $newSessionId = null;
                $newToken = null;
                if ($newAccessToken && str_contains($newAccessToken, ':')) {
                    [$newSessionId, $newToken] = explode(':', $newAccessToken, 2);
                }

                return [
                    'success' => true,
                    'message' => $result['message'] ?? 'Session extended successfully',
                    'data' => [
                        'access_token' => $newAccessToken,
                        'session_id' => $newSessionId,
                        'token' => $newToken,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Failed to extend session. Please login again with OTP.',
            ];
        } catch (\Exception $e) {
            Log::error('KMSP extend session error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Failed to extend session: ' . $e->getMessage(),
            ];
        }
    }

    // =====================================================
    // PURCHASE METHODS
    // =====================================================

    /**
     * Purchase product without OTP (no_need_login = true).
     *
     * @param string $packageCode Product code
     * @param string $phone Target phone number
     * @param int|float $priceOrFee Price or processing fee
     * @return array
     */
    public function purchaseWithoutOtp(string $packageCode, string $phone, $priceOrFee): array
    {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KMSP provider is not enabled',
            ];
        }

        try {
            $logged = $this->makeLoggedRequest('GET', self::PURCHASE_URL . '/v1', [
                'api_key' => $this->apiKey,
                'package_code' => $packageCode,
                'phone' => $phone,
                'price_or_fee' => $priceOrFee,
            ], 'purchase-without-otp');

            $result = $logged['result'];

            if ($logged['success']) {
                return [
                    'success' => true,
                    'message' => $result['message'] ?? 'Purchase initiated',
                    'data' => [
                        'msisdn' => $result['data']['msisdn'] ?? null,
                        'package_code' => $result['data']['package_code'] ?? null,
                        'package_name' => $result['data']['package_name'] ?? null,
                        'processing_fee' => $result['data']['package_processing_fee'] ?? 0,
                        'trx_id' => $result['data']['trx_id'] ?? null,
                        'have_deeplink' => $result['data']['have_deeplink'] ?? false,
                        'deeplink_data' => $result['data']['deeplink_data'] ?? [],
                        'is_qris' => $result['data']['is_qris'] ?? false,
                        'qris_data' => $result['data']['qris_data'] ?? [],
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Purchase failed. Please try again.',
            ];
        } catch (\Exception $e) {
            Log::error('KMSP purchase error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Purchase failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Purchase product with OTP (no_need_login = false).
     *
     * @param string $packageCode Product code
     * @param string $phone Target phone number
     * @param string $accessToken Access token from login
     * @param string $paymentMethod Payment method (BALANCE, DANA, QRIS, GOPAY, SHOPEEPAY, OVO)
     * @param int|float $priceOrFee Price or processing fee
     * @param string|null $ewalletNumber E-wallet number (required for OVO)
     * @return array
     */
    public function purchaseWithOtp(
        string $packageCode,
        string $phone,
        string $accessToken,
        string $paymentMethod,
        $priceOrFee,
        ?string $ewalletNumber = null
    ): array {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KMSP provider is not enabled',
            ];
        }

        try {
            $params = [
                'api_key' => $this->apiKey,
                'package_code' => $packageCode,
                'phone' => $phone,
                'access_token' => $accessToken,
                'payment_method' => $paymentMethod,
                'price_or_fee' => $priceOrFee,
            ];

            // Add e-wallet number for OVO
            if ($paymentMethod === 'OVO' && $ewalletNumber) {
                $params['ewallet_number'] = $ewalletNumber;
            } else {
                $params['ewallet_number'] = '';
            }

            $logged = $this->makeLoggedRequest('GET', self::PURCHASE_URL . '/v1', $params, 'purchase-with-otp');

            $result = $logged['result'];

            if ($logged['success']) {
                return [
                    'success' => true,
                    'message' => $result['message'] ?? 'Purchase initiated',
                    'data' => [
                        'msisdn' => $result['data']['msisdn'] ?? null,
                        'package_code' => $result['data']['package_code'] ?? null,
                        'package_name' => $result['data']['package_name'] ?? null,
                        'processing_fee' => $result['data']['package_processing_fee'] ?? 0,
                        'trx_id' => $result['data']['trx_id'] ?? null,
                        'have_deeplink' => $result['data']['have_deeplink'] ?? false,
                        'deeplink_data' => $result['data']['deeplink_data'] ?? [],
                        'is_qris' => $result['data']['is_qris'] ?? false,
                        'qris_data' => $result['data']['qris_data'] ?? [],
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Purchase failed. Please try again.',
            ];
        } catch (\Exception $e) {
            Log::error('KMSP purchase with OTP error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Purchase failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Normalize KMSP product data to standard format.
     */
    protected function normalizeProducts(array $products): array
    {
        return array_map(function ($product) {
            return [
                'code' => $product['package_code'] ?? null,
                'name' => $product['package_name'] ?? null,
                'description' => $product['package_description'] ?? null,
                'price' => $product['package_harga_int'] ?? 0,
                'price_formatted' => $product['package_harga'] ?? null,
                'provider' => 'kmsp',
                'metadata' => [
                    'have_daily_limit' => $product['have_daily_limit'] ?? false,
                    'daily_limit_details' => $product['daily_limit_details'] ?? null,
                    'no_need_login' => $product['no_need_login'] ?? false,
                    'can_multi_trx' => $product['can_multi_trx'] ?? false,
                    'can_scheduled_trx' => $product['can_scheduled_trx'] ?? false,
                    'have_cut_off_time' => $product['have_cut_off_time'] ?? false,
                    'cut_off_time' => $product['cut_off_time'] ?? null,
                    'need_check_stock' => $product['need_check_stock'] ?? false,
                    'is_show_payment_method' => $product['is_show_payment_method'] ?? false,
                    'available_payment_methods' => $product['available_payment_methods'] ?? [],
                ],
            ];
        }, $products);
    }

    // =====================================================
    // TRANSACTION STATUS CHECK
    // =====================================================

    /**
     * Check transaction status from KMSP.
     * 
     * @param string $trxId Transaction ID from KMSP
     * @return array
     */
    public function checkTransactionStatus(string $trxId): array
    {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KMSP provider is not enabled',
            ];
        }

        try {
            // KMSP uses the same purchase endpoint with check_status parameter
            $response = Http::timeout($this->timeout)
                ->get(self::PURCHASE_URL . '/v1/status', [
                    'api_key' => $this->apiKey,
                    'trx_id' => $trxId,
                ]);

            $result = $response->json();

            if ($response->successful() && isset($result['status']) && $result['status'] === true) {
                $data = $result['data'] ?? [];

                // Map KMSP status to our internal status
                $mappedStatus = $this->mapTransactionStatus($data['status'] ?? 'unknown');

                return [
                    'success' => true,
                    'message' => $result['message'] ?? 'Status retrieved',
                    'data' => [
                        'trx_id' => $data['trx_id'] ?? $trxId,
                        'status' => $mappedStatus,
                        'original_status' => $data['status'] ?? 'unknown',
                        'serial_number' => $data['serial_number'] ?? null,
                        'message' => $data['message'] ?? null,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $result['message'] ?? 'Failed to get transaction status',
            ];
        } catch (\Exception $e) {
            Log::error('KMSP transaction status check error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Failed to check status: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Map KMSP status to internal status.
     */
    protected function mapTransactionStatus(string $kmspStatus): string
    {
        return match (strtolower($kmspStatus)) {
            'success', 'sukses', 'berhasil' => 'success',
            'failed', 'gagal', 'error' => 'failed',
            'pending', 'processing', 'proses' => 'processing',
            'refunded', 'refund' => 'refunded',
            default => 'processing',
        };
    }
}

