<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\ProductProviderFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProviderController extends Controller
{
    protected ProductProviderFactory $providerFactory;

    public function __construct(ProductProviderFactory $providerFactory)
    {
        $this->providerFactory = $providerFactory;
    }

    /**
     * Display list of all registered providers.
     */
    public function index(): Response
    {
        $providers = [];

        foreach ($this->providerFactory->getAllProviders() as $name => $provider) {
            // Count synced products for this provider
            $syncedCount = Product::where('api_source', $name)->count();

            $providers[] = [
                'name' => $name,
                'display_name' => strtoupper($name),
                'enabled' => $provider->isEnabled(),
                'synced_products' => $syncedCount,
            ];
        }

        return Inertia::render('Admin/Providers/Index', [
            'providers' => $providers,
        ]);
    }

    /**
     * Get products from a specific provider.
     */
    public function products(string $provider): JsonResponse
    {
        if (!$this->providerFactory->hasProvider($provider)) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is not registered in the system. Available providers: " . implode(', ', $this->providerFactory->getProviderNames()),
            ], 404);
        }

        $providerInstance = $this->providerFactory->getProvider($provider);

        if (!$providerInstance->isEnabled()) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is disabled. Please check that the API key is configured in your .env file (e.g., " . strtoupper($provider) . "_API_KEY=your_api_key).",
            ], 400);
        }

        $result = $providerInstance->getProducts();

        if (!$result['success']) {
            // Add more descriptive error message
            $errorMessage = $result['message'] ?? 'Unknown error occurred';
            $errorCode = $result['code'] ?? null;

            $detailedMessage = "Failed to fetch products from {$provider}: {$errorMessage}";

            if ($errorCode === 'BACKEND_HTTP_ERROR') {
                $detailedMessage .= ". This usually means the API key is invalid or expired. Please verify your " . strtoupper($provider) . "_API_KEY in the .env file.";
            }

            return response()->json([
                'success' => false,
                'message' => $detailedMessage,
                'code' => $errorCode,
            ], 400);
        }

        return response()->json($result, 200);
    }

    /**
     * Get balance from a specific provider.
     */
    public function balance(string $provider): JsonResponse
    {
        if (!$this->providerFactory->hasProvider($provider)) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is not registered in the system.",
            ], 404);
        }

        $providerInstance = $this->providerFactory->getProvider($provider);

        if (!$providerInstance->isEnabled()) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is disabled. Please configure the API key in your .env file.",
            ], 400);
        }

        $result = $providerInstance->getBalance();

        if (!$result['success']) {
            $errorMessage = $result['message'] ?? 'Unknown error occurred';
            return response()->json([
                'success' => false,
                'message' => "Failed to check balance from {$provider}: {$errorMessage}",
            ], 400);
        }

        return response()->json($result, 200);
    }

    /**
     * Sync products from provider to local database.
     */
    public function sync(Request $request, string $provider): JsonResponse
    {
        if (!$this->providerFactory->hasProvider($provider)) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is not registered in the system.",
            ], 404);
        }

        $providerInstance = $this->providerFactory->getProvider($provider);

        if (!$providerInstance->isEnabled()) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is disabled. Please configure the API key in your .env file before syncing.",
            ], 400);
        }

        // Fetch products from provider
        $result = $providerInstance->getProducts();

        if (!$result['success']) {
            $errorMessage = $result['message'] ?? 'Unknown error occurred';
            $errorCode = $result['code'] ?? null;

            $detailedMessage = "Failed to fetch products from {$provider} for sync: {$errorMessage}";

            if ($errorCode === 'BACKEND_HTTP_ERROR') {
                $detailedMessage .= ". Please verify your API key is valid and not expired.";
            }

            return response()->json([
                'success' => false,
                'message' => $detailedMessage,
                'code' => $errorCode,
            ], 400);
        }

        $products = $result['data'] ?? [];

        if (empty($products)) {
            return response()->json([
                'success' => false,
                'message' => "No products returned from {$provider}. The API returned an empty product list.",
            ], 400);
        }

        // Get or create "Others" category for imported products
        $defaultCategory = ProductCategory::firstOrCreate(
            ['slug' => 'others'],
            [
                'name' => 'Others',
                'description' => 'Other products',
                'icon' => 'category',
                'sort_order' => 99,
            ]
        );

        $stats = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        DB::beginTransaction();

        try {
            foreach ($products as $productData) {
                $externalCode = $productData['code'] ?? null;

                if (empty($externalCode)) {
                    $stats['skipped']++;
                    continue;
                }

                // Check if product already exists
                $existingProduct = Product::where('api_source', $provider)
                    ->where('external_code', $externalCode)
                    ->first();

                // Detect operator from product name (XL, Telkomsel, AXIS, etc.)
                $productName = $productData['name'] ?? 'Unknown Product';
                $operator = $this->parseOperatorFromName($productName);

                // Determine stock status
                $stock = $productData['metadata']['stock'] ?? -1;
                $status = $productData['metadata']['status'] ?? 'open';
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

                $productFields = [
                    'name' => $productName,
                    'slug' => Str::slug($productData['name'] ?? 'product') . '-' . Str::lower($provider) . '-' . Str::random(4),
                    'description' => $productData['description'] ?? null,
                    'price' => $productData['price'] ?? 0,
                    'selling_price' => ($productData['price'] ?? 0) * (1 + (\App\Models\Setting::get('product_margin', 10) / 100)),
                    'provider' => $operator, // Operator (XL, Telkomsel, AXIS, etc.)
                    'product_code' => $externalCode,
                    'api_source' => $provider, // API Provider (KMSP, KAJET, etc.)
                    'external_code' => $externalCode,
                    'api_metadata' => $productData['metadata'] ?? [],
                    'type' => $productData['metadata']['type'] ?? 'prepaid',
                    'stock' => $stock,
                    'stock_status' => $stockStatus,
                    'is_active' => $status === 'open',
                    'category_id' => $defaultCategory->id,
                    // KAJE-specific fields
                    'brands' => $productData['metadata']['brands'] ?? null,
                    'prefixes' => $productData['metadata']['prefix'] ?? null,
                ];

                if ($existingProduct) {
                    // Update existing product (except slug)
                    unset($productFields['slug']);
                    $existingProduct->update($productFields);
                    $stats['updated']++;
                } else {
                    // Create new product
                    Product::create($productFields);
                    $stats['created']++;
                }
            }

            DB::commit();

            $totalProcessed = $stats['created'] + $stats['updated'];

            return response()->json([
                'success' => true,
                'message' => "Successfully synced {$totalProcessed} products from {$provider}. Created: {$stats['created']}, Updated: {$stats['updated']}, Skipped: {$stats['skipped']}",
                'stats' => $stats,
                'total_from_api' => count($products),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("Product sync error for {$provider}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => "An error occurred while syncing products: {$e->getMessage()}",
            ], 500);
        }
    }

    /**
     * Parse operator/carrier name from product name.
     * Detects telecom operators like XL, Telkomsel, AXIS, Indosat, Tri, etc.
     */
    protected function parseOperatorFromName(string $productName): string
    {
        $productNameLower = strtolower($productName);

        // Telkomsel variants
        if (str_contains($productNameLower, 'telkomsel') || str_contains($productNameLower, 'tsel')) {
            return 'Telkomsel';
        }

        // XL variants
        if (preg_match('/\bxl\b/i', $productName) || str_contains($productNameLower, 'xtra')) {
            return 'XL';
        }

        // AXIS
        if (str_contains($productNameLower, 'axis')) {
            return 'AXIS';
        }

        // LiveOn (XL subsidiary)
        if (str_contains($productNameLower, 'liveon') || str_contains($productNameLower, 'live on')) {
            return 'LiveOn';
        }

        // Indosat/IM3/Ooredoo
        if (str_contains($productNameLower, 'indosat') || str_contains($productNameLower, 'im3') || str_contains($productNameLower, 'ooredoo')) {
            return 'Indosat';
        }

        // Tri/3 (Three)
        if (preg_match('/\btri\b|\bthree\b|^3\s/i', $productName)) {
            return 'Tri';
        }

        // Smartfren
        if (str_contains($productNameLower, 'smartfren') || str_contains($productNameLower, 'smart')) {
            return 'Smartfren';
        }

        // by.U (Telkomsel digital)
        if (str_contains($productNameLower, 'by.u') || str_contains($productNameLower, 'byu')) {
            return 'by.U';
        }

        // PLN (Electricity)
        if (str_contains($productNameLower, 'pln') || str_contains($productNameLower, 'listrik')) {
            return 'PLN';
        }

        // E-Wallet detections
        if (str_contains($productNameLower, 'dana')) {
            return 'DANA';
        }
        if (str_contains($productNameLower, 'gopay')) {
            return 'GoPay';
        }
        if (str_contains($productNameLower, 'ovo')) {
            return 'OVO';
        }
        if (str_contains($productNameLower, 'shopeepay')) {
            return 'ShopeePay';
        }

        // Default: Unknown operator
        return 'Other';
    }

    /**
     * Get all products from all enabled providers (API endpoint).
     */
    public function allProducts(): JsonResponse
    {
        $allProducts = $this->providerFactory->getAllProducts();

        return response()->json([
            'success' => true,
            'data' => $allProducts,
        ]);
    }

    /**
     * Partial sync - update only stock and price for existing products.
     */
    public function partialSync(Request $request, string $provider): JsonResponse
    {
        if (!$this->providerFactory->hasProvider($provider)) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is not registered.",
            ], 404);
        }

        $providerInstance = $this->providerFactory->getProvider($provider);

        if (!$providerInstance->isEnabled()) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is disabled.",
            ], 400);
        }

        // Fetch partial product data (stock & price only)
        $result = $providerInstance->getProductsPriceAndStock();

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to fetch product data',
            ], 400);
        }

        $products = $result['data'] ?? [];

        if (empty($products)) {
            return response()->json([
                'success' => false,
                'message' => 'No products returned from provider',
            ], 400);
        }

        $stats = [
            'updated' => 0,
            'skipped' => 0,
            'not_found' => 0,
        ];

        DB::beginTransaction();

        try {
            foreach ($products as $productData) {
                $externalCode = $productData['code'] ?? null;

                if (empty($externalCode)) {
                    $stats['skipped']++;
                    continue;
                }

                // Find existing product
                $existingProduct = Product::where('api_source', $provider)
                    ->where('external_code', $externalCode)
                    ->first();

                if (!$existingProduct) {
                    $stats['not_found']++;
                    continue;
                }

                // Calculate new selling price with margin
                $newPrice = $productData['price'] ?? $existingProduct->price;
                $margin = \App\Models\Setting::get('product_margin', 10) / 100;
                $newSellingPrice = $newPrice * (1 + $margin);

                // Update only stock, price, and stock_status
                $existingProduct->update([
                    'price' => $newPrice,
                    'selling_price' => $newSellingPrice,
                    'stock' => $productData['stock'] ?? $existingProduct->stock,
                    'stock_status' => $productData['stock_status'] ?? $existingProduct->stock_status,
                    'last_stock_check_at' => now(),
                ]);

                $stats['updated']++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Partial sync completed. Updated: {$stats['updated']}, Not Found: {$stats['not_found']}, Skipped: {$stats['skipped']}",
                'stats' => $stats,
                'total_from_api' => count($products),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("Partial sync error for {$provider}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => "Partial sync failed: {$e->getMessage()}",
            ], 500);
        }
    }

    /**
     * Check stock for specific products.
     */
    public function checkStock(Request $request, string $provider): JsonResponse
    {
        $request->validate([
            'product_codes' => 'required|array|min:1',
            'product_codes.*' => 'required|string',
        ]);

        if (!$this->providerFactory->hasProvider($provider)) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is not registered.",
            ], 404);
        }

        $providerInstance = $this->providerFactory->getProvider($provider);

        if (!$providerInstance->isEnabled()) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is disabled.",
            ], 400);
        }

        $productCodes = $request->product_codes;
        $results = [];
        $errors = [];

        foreach ($productCodes as $code) {
            $stockResult = $providerInstance->checkStock($code);

            if ($stockResult['success']) {
                $results[] = $stockResult['data'];
            } else {
                $errors[] = [
                    'product_code' => $code,
                    'error' => $stockResult['message'] ?? 'Unknown error',
                ];
            }
        }

        return response()->json([
            'success' => count($results) > 0,
            'data' => $results,
            'errors' => $errors,
            'total_checked' => count($productCodes),
            'successful' => count($results),
            'failed' => count($errors),
        ]);
    }

    /**
     * Refresh balance from provider API.
     */
    public function refreshBalance(string $provider): JsonResponse
    {
        if (!$this->providerFactory->hasProvider($provider)) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is not registered.",
            ], 404);
        }

        $providerInstance = $this->providerFactory->getProvider($provider);

        if (!$providerInstance->isEnabled()) {
            return response()->json([
                'success' => false,
                'message' => "Provider '{$provider}' is disabled.",
            ], 400);
        }

        // Force refresh balance (bypassing any cache)
        $result = $providerInstance->getBalance();

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to refresh balance',
            ], 400);
        }

        return response()->json($result, 200);
    }
}
