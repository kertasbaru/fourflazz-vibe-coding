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

        // Get or create a default category for imported products
        $defaultCategory = ProductCategory::firstOrCreate(
            ['slug' => 'api-import'],
            [
                'name' => 'API Import',
                'description' => 'Products imported from API providers',
                'icon' => 'cloud_download',
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

                $productFields = [
                    'name' => $productData['name'] ?? 'Unknown Product',
                    'slug' => Str::slug($productData['name'] ?? 'product') . '-' . Str::lower($provider) . '-' . Str::random(4),
                    'description' => $productData['description'] ?? null,
                    'price' => $productData['price'] ?? 0,
                    'selling_price' => ($productData['price'] ?? 0) * 1.1, // 10% markup as default
                    'provider' => $productData['metadata']['brands'][0] ?? strtoupper($provider),
                    'product_code' => $externalCode,
                    'api_source' => $provider,
                    'external_code' => $externalCode,
                    'api_metadata' => $productData['metadata'] ?? [],
                    'type' => $productData['metadata']['type'] ?? 'prepaid',
                    'stock' => $productData['metadata']['stock'] ?? -1,
                    'is_active' => ($productData['metadata']['status'] ?? 'open') === 'open',
                    'category_id' => $defaultCategory->id,
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
}
