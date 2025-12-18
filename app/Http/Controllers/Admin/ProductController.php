<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category');

        // Search
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('product_code', 'like', '%' . $request->search . '%')
                    ->orWhere('provider', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }

        // Filter by active status
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        // Filter by API source
        if ($request->filled('api_source')) {
            if ($request->api_source === 'manual') {
                $query->whereNull('api_source');
            } else {
                $query->where('api_source', $request->api_source);
            }
        }

        // Filter by OTP requirement (from metadata)
        if ($request->filled('need_otp')) {
            if ($request->need_otp === 'yes') {
                $query->whereRaw("JSON_EXTRACT(api_metadata, '$.no_need_login') = false");
            } elseif ($request->need_otp === 'no') {
                $query->whereRaw("JSON_EXTRACT(api_metadata, '$.no_need_login') = true");
            }
        }

        $products = $query->ordered()->paginate(15)->withQueryString();
        $categories = ProductCategory::ordered()->get();

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status', 'api_source', 'need_otp']),
        ]);
    }

    public function create()
    {
        $categories = ProductCategory::active()->ordered()->get();

        return Inertia::render('Admin/Products/Form', [
            'categories' => $categories,
            'product' => null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:product_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'provider' => 'nullable|string|max:100',
            'product_code' => 'nullable|string|max:100',
            'type' => 'required|in:prepaid,postpaid',
            'stock' => 'required|integer|min:-1',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(6);
        $validated['is_active'] = $request->boolean('is_active', true);

        Product::create($validated);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    public function edit(Product $product)
    {
        $categories = ProductCategory::active()->ordered()->get();

        return Inertia::render('Admin/Products/Form', [
            'categories' => $categories,
            'product' => $product,
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:product_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'provider' => 'nullable|string|max:100',
            'product_code' => 'nullable|string|max:100',
            'type' => 'required|in:prepaid,postpaid',
            'stock' => 'required|integer|min:-1',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);

        $product->update($validated);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        // Check if product has transactions
        if ($product->transactions()->count() > 0) {
            return back()->with('error', 'Cannot delete product with existing transactions.');
        }

        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }

    /**
     * Bulk inactive products.
     */
    public function bulkInactive(Request $request)
    {
        $request->validate([
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'required|integer|exists:products,id',
        ]);

        $count = Product::whereIn('id', $request->product_ids)
            ->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => "{$count} product(s) have been deactivated successfully.",
            'count' => $count,
        ]);
    }

    /**
     * Bulk delete products.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'required|integer|exists:products,id',
        ]);

        // Check if any products have transactions
        $productsWithTransactions = Product::whereIn('id', $request->product_ids)
            ->whereHas('transactions')
            ->count();

        if ($productsWithTransactions > 0) {
            return response()->json([
                'success' => false,
                'message' => "{$productsWithTransactions} product(s) have existing transactions and cannot be deleted.",
            ], 422);
        }

        $count = Product::whereIn('id', $request->product_ids)->delete();

        return response()->json([
            'success' => true,
            'message' => "{$count} product(s) have been deleted successfully.",
            'count' => $count,
        ]);
    }

    /**
     * Bulk update margin (percentage or fixed amount).
     */
    public function bulkUpdateMargin(Request $request)
    {
        $request->validate([
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'required|integer|exists:products,id',
            'margin_type' => 'required|in:percentage,fixed',
            'margin_value' => 'required|numeric|min:0',
        ]);

        $products = Product::whereIn('id', $request->product_ids)->get();
        $count = 0;

        foreach ($products as $product) {
            if ($request->margin_type === 'percentage') {
                // Apply percentage margin to base price
                $newSellingPrice = $product->price * (1 + ($request->margin_value / 100));
            } else {
                // Add fixed amount to base price
                $newSellingPrice = $product->price + $request->margin_value;
            }

            $product->update(['selling_price' => $newSellingPrice]);
            $count++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$count} product(s) margin updated successfully.",
            'count' => $count,
            'margin_type' => $request->margin_type,
            'margin_value' => $request->margin_value,
        ]);
    }

    /**
     * Bulk update category.
     */
    public function bulkUpdateCategory(Request $request)
    {
        $request->validate([
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'required|integer|exists:products,id',
            'category_id' => 'required|integer|exists:product_categories,id',
        ]);

        $count = Product::whereIn('id', $request->product_ids)
            ->update(['category_id' => $request->category_id]);

        $category = ProductCategory::find($request->category_id);

        return response()->json([
            'success' => true,
            'message' => "{$count} product(s) moved to category '{$category->name}'.",
            'count' => $count,
            'category_name' => $category->name,
        ]);
    }
}
