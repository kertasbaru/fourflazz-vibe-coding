<?php

namespace App\Services;

use App\Contracts\ProductProviderInterface;
use App\Models\ApiLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KajeService implements ProductProviderInterface
{
    protected string $apiKey;
    protected string $baseUrl;
    protected bool $enabled;
    protected int $timeout;

    public function __construct()
    {
        $this->apiKey = config('providers.kaje.api_key');
        $this->baseUrl = config('providers.kaje.base_url');
        $this->enabled = config('providers.kaje.enabled', true);
        $this->timeout = config('providers.kaje.timeout', 30);
    }

    /**
     * Get the provider name identifier.
     */
    public function getProviderName(): string
    {
        return 'kaje';
    }

    /**
     * Check if the provider is enabled.
     */
    public function isEnabled(): bool
    {
        return $this->enabled && !empty($this->apiKey);
    }

    /**
     * Make authenticated request to KAJE API with logging.
     *
     * @param string $endpoint
     * @param array $data
     * @param string $method
     * @return array
     */
    protected function makeRequest(string $endpoint, array $data = [], string $method = 'POST'): array
    {
        $startTime = microtime(true);

        // Prepare logged data (hide API key)
        $loggedData = $data;

        try {
            $request = Http::timeout($this->timeout)
                ->withHeaders([
                    'x-api-key' => $this->apiKey,
                    'accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ]);

            if ($method === 'POST') {
                $response = $request->post("{$this->baseUrl}{$endpoint}", $data);
            } else {
                $response = $request->get("{$this->baseUrl}{$endpoint}", $data);
            }

            $responseTime = microtime(true) - $startTime;
            $responseData = $response->json();
            $success = $response->successful();

            // Log the API call
            ApiLog::logApiCall(
                'kaje',
                $endpoint,
                $method,
                $loggedData,
                $responseData,
                $response->status(),
                $success,
                $success ? null : ($responseData['info'] ?? 'Unknown error'),
                $responseTime
            );

            return [
                'success' => $success,
                'status_code' => $response->status(),
                'data' => $responseData,
            ];
        } catch (\Exception $e) {
            $responseTime = microtime(true) - $startTime;

            // Log the failed API call
            ApiLog::logApiCall(
                'kaje',
                $endpoint,
                $method,
                $loggedData,
                null,
                null,
                false,
                $e->getMessage(),
                $responseTime
            );

            Log::error('KAJE API exception', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'KAJE service error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get list of products from KAJE API.
     *
     * @return array{success: bool, data?: array, message?: string}
     */
    public function getProducts(): array
    {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KAJE provider is not enabled or API key is missing. Please add KAJE_API_KEY to your .env file.',
            ];
        }

        $result = $this->makeRequest('/api/service/list-product', []);

        if (!$result['success']) {
            return [
                'success' => false,
                'message' => $result['message'] ?? 'Failed to fetch products from KAJE. Please check your API key and network connection.',
            ];
        }

        $data = $result['data'] ?? [];

        if (isset($data['success']) && $data['success'] === true) {
            // KAJE returns data as object with 'info' and 'products' keys
            $apiData = $data['data'] ?? [];
            $allProducts = [];

            // Check if data is an object with products key (single category)
            if (isset($apiData['products']) && is_array($apiData['products'])) {
                $categoryInfo = $apiData['info'] ?? 'Unknown';
                foreach ($apiData['products'] as $product) {
                    $product['category_info'] = $categoryInfo;
                    $allProducts[] = $product;
                }
            }
            // Or if data is an array of categories
            elseif (is_array($apiData)) {
                foreach ($apiData as $category) {
                    if (isset($category['products']) && is_array($category['products'])) {
                        $categoryInfo = $category['info'] ?? 'Unknown';
                        foreach ($category['products'] as $product) {
                            $product['category_info'] = $categoryInfo;
                            $allProducts[] = $product;
                        }
                    }
                }
            }

            $normalizedProducts = $this->normalizeProducts($allProducts);

            return [
                'success' => true,
                'data' => $normalizedProducts,
                'raw' => $apiData,
                'count' => count($normalizedProducts),
                'info' => $apiData['info'] ?? null,
            ];
        }

        Log::error('KAJE products API error', [
            'response' => $data,
        ]);

        return [
            'success' => false,
            'message' => $data['message'] ?? 'Failed to fetch products from KAJE. The API returned an unexpected response.',
            'code' => $data['code'] ?? null,
        ];
    }

    /**
     * Get account balance from KAJE API.
     *
     * @return array{success: bool, data?: array, message?: string}
     */
    public function getBalance(): array
    {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KAJE provider is not enabled or API key is missing',
            ];
        }

        $result = $this->makeRequest('/api/info/saldo', []);

        if (!$result['success']) {
            return [
                'success' => false,
                'message' => $result['message'] ?? 'Failed to fetch balance from KAJE',
            ];
        }

        $data = $result['data'] ?? [];

        if (isset($data['success']) && $data['success'] === true) {
            return [
                'success' => true,
                'data' => [
                    'balance' => $data['data']['raw'] ?? 0,
                    'balance_formatted' => $data['data']['formatted'] ?? 'Rp 0',
                ],
                'raw' => $data,
            ];
        }

        Log::error('KAJE balance API error', [
            'response' => $data,
        ]);

        return [
            'success' => false,
            'message' => $data['message'] ?? 'Failed to fetch balance from KAJE',
            'code' => $data['code'] ?? null,
        ];
    }

    /**
     * Normalize KAJE product data to standard format.
     *
     * @param array $products
     * @return array
     */
    protected function normalizeProducts(array $products): array
    {
        return array_map(function ($product) {
            // Handle description - KAJE returns array of strings
            $description = $product['description'] ?? [];
            if (is_array($description)) {
                $description = implode("\n", $description);
            }

            return [
                'code' => $product['code'] ?? null,
                'name' => $product['name'] ?? null,
                'description' => $description,
                'price' => $product['price'] ?? 0,
                'price_formatted' => isset($product['price']) ? 'Rp ' . number_format($product['price'], 0, ',', '.') : null,
                'provider' => 'kaje',
                'metadata' => [
                    'category' => $product['category'] ?? null,
                    'category_info' => $product['category_info'] ?? null,
                    'type' => $product['type'] ?? null,
                    'status' => $product['status'] ?? null,
                    'stock' => $product['stock'] ?? null,
                    'is_trial' => $product['is_trial'] ?? false,
                    'is_manual' => $product['is_manual'] ?? false,
                    'brands' => $product['brands'] ?? [],
                    'prefix' => $product['prefix'] ?? [],
                ],
            ];
        }, $products);
    }

    /**
     * Check stock for a specific product.
     */
    public function checkStock(string $productCode): array
    {
        if (!$this->isEnabled()) {
            return [
                'success' => false,
                'message' => 'KAJE provider is not enabled',
            ];
        }

        $result = $this->makeRequest('/api/service/stock-product', [
            'code' => $productCode,
        ]);

        if (!$result['success']) {
            return [
                'success' => false,
                'message' => $result['message'] ?? 'Failed to check stock from KAJE',
            ];
        }

        $data = $result['data'] ?? [];

        if (isset($data['success']) && $data['success'] === true) {
            $stockProducts = $data['data'] ?? [];

            // Find our product in the response
            $stockInfo = null;
            foreach ($stockProducts as $item) {
                if ($item['code'] === $productCode) {
                    $stockInfo = $item;
                    break;
                }
            }

            if ($stockInfo) {
                $status = $stockInfo['status'] ?? 'close';
                $stock = $stockInfo['stock'] ?? 0;

                // Determine stock status
                $stockStatus = 'unknown';
                if ($status === 'close') {
                    $stockStatus = 'out_of_stock';
                } elseif ($stock <= 0) {
                    $stockStatus = 'out_of_stock';
                } elseif ($stock < 10) {
                    $stockStatus = 'limited';
                } else {
                    $stockStatus = 'available';
                }

                return [
                    'success' => true,
                    'data' => [
                        'product_code' => $productCode,
                        'stock' => $stock,
                        'status' => $status,
                        'stock_status' => $stockStatus,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => 'Product not found in stock check response',
            ];
        }

        return [
            'success' => false,
            'message' => $data['message'] ?? 'Failed to check stock from KAJE',
        ];
    }

    /**
     * Get products with stock and price only (for partial sync).
     */
    public function getProductsPriceAndStock(): array
    {
        // KAJE doesn't have a dedicated partial endpoint, so we use the full product list
        // and extract only the necessary fields
        $fullProducts = $this->getProducts();

        if (!$fullProducts['success']) {
            return $fullProducts;
        }

        $partialData = array_map(function ($product) {
            $stock = $product['metadata']['stock'] ?? -1;
            $status = $product['metadata']['status'] ?? 'close';

            // Determine stock status
            $stockStatus = 'unknown';
            if ($status === 'close') {
                $stockStatus = 'out_of_stock';
            } elseif ($stock <= 0) {
                $stockStatus = 'out_of_stock';
            } elseif ($stock > 0 && $stock < 10) {
                $stockStatus = 'limited';
            } elseif ($stock >= 10) {
                $stockStatus = 'available';
            }

            return [
                'code' => $product['code'],
                'price' => $product['price'],
                'stock' => $stock,
                'stock_status' => $stockStatus,
            ];
        }, $fullProducts['data'] ?? []);

        return [
            'success' => true,
            'data' => $partialData,
            'count' => count($partialData),
        ];
    }
}
