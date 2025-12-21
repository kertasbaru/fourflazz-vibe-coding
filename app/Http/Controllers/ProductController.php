<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::active()->with('category')->ordered();

        // Filter by category
        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by brand
        if ($request->filled('brand')) {
            $query->whereJsonContains('brands', $request->brand);
        }

        $products = $query->paginate(12)->withQueryString();

        $categories = ProductCategory::active()->ordered()->get();

        // Get unique brands for filter
        $allBrands = Product::active()
            ->whereNotNull('brands')
            ->pluck('brands')
            ->flatten()
            ->unique()
            ->filter()
            ->sort()
            ->values();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $allBrands,
            'filters' => $request->only(['category', 'search', 'brand']),
        ]);
    }

    /**
     * Get products for a category filtered by phone prefix or customer ID.
     */
    public function getProductsByInput(Request $request, ProductCategory $category)
    {
        $request->validate([
            'input_value' => 'required|string',
        ]);

        $inputValue = $request->input_value;

        // Get all active products in this category
        $allProducts = Product::active()
            ->where('category_id', $category->id)
            ->with('category')
            ->ordered()
            ->get();

        // If category requires phone number, filter by phone prefix matching
        if ($category->requiresPhoneNumber()) {
            // Filter products using their stored prefixes
            $products = $allProducts->filter(function ($product) use ($inputValue) {
                return $product->matchesPrefix($inputValue);
            })->values();

            // Try to detect brand name from filtered products for display
            $detectedBrand = $products->first()?->brands[0] ?? null;
        } else {
            // For customer ID based products, return all products
            $products = $allProducts;
            $detectedBrand = null;
        }

        return response()->json([
            'success' => true,
            'products' => $products,
            'detected_prefix' => $detectedBrand,
        ]);
    }

    public function show(Product $product)
    {
        if (!$product->is_active) {
            abort(404);
        }

        $product->load('category');

        // Get related products
        $relatedProducts = Product::active()
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->take(4)
            ->get();

        return Inertia::render('Products/Show', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
        ]);
    }

    public function purchase(Request $request, Product $product)
    {
        $request->validate([
            'phone_target' => 'required|string|min:10|max:15',
        ]);

        $user = $request->user();

        // Check if product is available
        if (!$product->is_active || !$product->isInStock()) {
            return back()->with('error', 'Product is not available.');
        }

        // Check user balance
        if ($user->balance < $product->price) {
            return back()->with('error', 'Insufficient balance. Please top up first.');
        }

        try {
            DB::transaction(function () use ($user, $product, $request) {
                // Deduct balance
                $user->deductBalance($product->price);

                // Create transaction
                Transaction::create([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                    'phone_target' => $request->phone_target,
                    'amount' => $product->price,
                    'profit' => $product->getProfit(),
                    'reference_number' => Transaction::generateReferenceNumber(),
                    'status' => Transaction::STATUS_PROCESSING,
                    'notes' => 'Purchase: ' . $product->name,
                ]);

                // Decrement stock if not unlimited
                if ($product->stock > 0) {
                    $product->decrement('stock');
                }
            });

            return redirect()->route('transactions.index')
                ->with('success', 'Purchase successful! Your transaction is being processed.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to process purchase. Please try again.');
        }
    }
}
