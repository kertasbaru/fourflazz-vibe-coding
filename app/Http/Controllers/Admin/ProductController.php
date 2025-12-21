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
                    ->orWhere('product_code', 'like', '%' . $request->search . '%');
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

        // Filter by source
        if ($request->filled('source')) {
            if ($request->source === 'manual') {
                $query->whereNull('source');
            } else {
                $query->where('source', $request->source);
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
            'filters' => $request->only(['search', 'category', 'status', 'source', 'need_otp']),
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
            'cost' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'source' => 'nullable|string|max:100',
            'product_code' => 'nullable|string|max:100',
            'type' => 'required|in:prepaid,postpaid',
            'stock' => 'required|integer|min:-1',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
            'brands' => 'nullable|string',
            'prefixes' => 'nullable|string',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(6);
        $validated['is_active'] = $request->boolean('is_active', true);

        // Parse brands and prefixes from comma-separated strings
        $validated['brands'] = $this->parseCommaSeparated($request->brands);
        $validated['prefixes'] = $this->parseCommaSeparated($request->prefixes);

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
            'cost' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'source' => 'nullable|string|max:100',
            'product_code' => 'nullable|string|max:100',
            'type' => 'required|in:prepaid,postpaid',
            'stock' => 'required|integer|min:-1',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
            'brands' => 'nullable|string',
            'prefixes' => 'nullable|string',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);

        // Parse brands and prefixes from comma-separated strings
        $validated['brands'] = $this->parseCommaSeparated($request->brands);
        $validated['prefixes'] = $this->parseCommaSeparated($request->prefixes);

        $product->update($validated);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Parse comma-separated string to array.
     */
    private function parseCommaSeparated(?string $value): array
    {
        if (empty($value)) {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $value))));
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
     * Bulk active products.
     */
    public function bulkActive(Request $request)
    {
        $request->validate([
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'required|integer|exists:products,id',
        ]);

        $count = Product::whereIn('id', $request->product_ids)
            ->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'message' => "{$count} product(s) have been activated successfully.",
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
                // Apply percentage margin to cost
                $newPrice = $product->cost * (1 + ($request->margin_value / 100));
            } else {
                // Add fixed amount to cost
                $newPrice = $product->cost + $request->margin_value;
            }

            $product->update(['price' => $newPrice]);
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

    /**
     * Export products to CSV.
     */
    public function export(Request $request)
    {
        $query = Product::with('category');

        // Apply same filters as index
        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }
        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }
        if ($request->filled('source')) {
            if ($request->source === 'manual') {
                $query->whereNull('source');
            } else {
                $query->where('source', $request->source);
            }
        }

        $products = $query->ordered()->get();

        $filename = 'products-' . date('Y-m-d-His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($products) {
            $file = fopen('php://output', 'w');

            // CSV header
            fputcsv($file, [
                'id',
                'product_code',
                'name',
                'description',
                'category_name',
                'category_id',
                'cost',
                'price',
                'source',
                'brands',
                'type',
                'stock',
                'is_active',
                'sort_order',
            ]);

            // CSV data
            foreach ($products as $product) {
                fputcsv($file, [
                    $product->id,
                    $product->product_code,
                    $product->name,
                    $product->description,
                    $product->category?->name,
                    $product->category_id,
                    $product->cost,
                    $product->price,
                    $product->source,
                    is_array($product->brands) ? implode(', ', $product->brands) : '',
                    $product->type,
                    $product->stock,
                    $product->is_active ? 'yes' : 'no',
                    $product->sort_order,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Import products from CSV.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120', // 5MB max
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        $handle = fopen($path, 'r');
        $header = fgetcsv($handle); // Skip header row

        // Normalize header
        $header = array_map(function ($col) {
            return strtolower(trim($col));
        }, $header);

        $created = 0;
        $updated = 0;
        $errors = [];
        $row = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $row++;

            // Skip empty rows
            if (count(array_filter($data)) === 0) {
                continue;
            }

            try {
                // Map CSV columns to product fields
                $rowData = array_combine($header, $data);

                // Find existing product by product_code or ID
                $product = null;
                if (!empty($rowData['product_code'])) {
                    $product = Product::where('product_code', $rowData['product_code'])->first();
                }
                if (!$product && !empty($rowData['id']) && is_numeric($rowData['id'])) {
                    $product = Product::find($rowData['id']);
                }

                // Resolve category
                $categoryId = null;
                if (!empty($rowData['category_id']) && is_numeric($rowData['category_id'])) {
                    $categoryId = $rowData['category_id'];
                } elseif (!empty($rowData['category_name'])) {
                    $category = ProductCategory::where('name', $rowData['category_name'])->first();
                    $categoryId = $category?->id;
                }

                if (!$categoryId) {
                    // Use first category as default
                    $categoryId = ProductCategory::first()?->id;
                }

                $productData = [
                    'name' => $rowData['name'] ?? $product?->name ?? 'Unnamed Product',
                    'description' => $rowData['description'] ?? $product?->description ?? null,
                    'category_id' => $categoryId,
                    'cost' => floatval($rowData['cost'] ?? $product?->cost ?? 0),
                    'price' => floatval($rowData['price'] ?? $rowData['cost'] ?? $product?->price ?? 0),
                    'source' => $rowData['source'] ?? $product?->source ?? null,
                    'brands' => isset($rowData['brands']) ? array_values(array_filter(array_map('trim', explode(',', $rowData['brands'])))) : ($product?->brands ?? []),
                    'product_code' => $rowData['product_code'] ?? $product?->product_code ?? null,
                    'type' => $rowData['type'] ?? $product?->type ?? 'prepaid',
                    'stock' => intval($rowData['stock'] ?? $product?->stock ?? -1),
                    'is_active' => isset($rowData['is_active'])
                        ? (strtolower($rowData['is_active']) === 'yes' || $rowData['is_active'] === '1' || $rowData['is_active'] === 'true')
                        : ($product?->is_active ?? true),
                    'sort_order' => intval($rowData['sort_order'] ?? $product?->sort_order ?? 0),
                ];

                if ($product) {
                    // Update existing product
                    $product->update($productData);
                    $updated++;
                } else {
                    // Create new product
                    $productData['slug'] = Str::slug($productData['name']) . '-' . Str::random(6);
                    Product::create($productData);
                    $created++;
                }
            } catch (\Exception $e) {
                $errors[] = "Row {$row}: " . $e->getMessage();
            }
        }

        fclose($handle);

        $message = "Import completed: {$created} created, {$updated} updated.";
        if (count($errors) > 0) {
            $message .= " " . count($errors) . " error(s) occurred.";
        }

        return back()->with('success', $message)->with('import_errors', $errors);
    }

    /**
     * Download import template.
     */
    public function downloadTemplate()
    {
        $filename = 'products-import-template.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');

            // CSV header
            fputcsv($file, [
                'id',
                'product_code',
                'name',
                'description',
                'category_name',
                'category_id',
                'cost',
                'price',
                'source',
                'brands',
                'type',
                'stock',
                'is_active',
                'sort_order',
            ]);

            // Example row
            fputcsv($file, [
                '', // id (leave empty for new)
                'PRODUCT-001',
                'Example Product',
                'Product description',
                '', // category_name (optional)
                '1', // category_id
                '10000', // cost
                '12000', // price
                'kmsp', // source: kmsp, kaje, or empty
                'Telkomsel, Indosat', // brands (comma-separated)
                'prepaid',
                '-1', // -1 for unlimited
                'yes',
                '0',
            ]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
