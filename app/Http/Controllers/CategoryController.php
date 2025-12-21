<?php

namespace App\Http\Controllers;

use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display all categories grouped by category_group.
     */
    public function index()
    {
        $categoriesGrouped = ProductCategory::active()
            ->grouped()
            ->get()
            ->groupBy('category_group')
            ->sortBy(function ($products, $key) {
                // Move empty/null category group to bottom
                return $key ?: 'zzzzzz';
            });

        return Inertia::render('Categories/Index', [
            'categoriesGrouped' => $categoriesGrouped,
        ]);
    }

    /**
     * Show products for a specific category with input form.
     */
    public function show(ProductCategory $category)
    {
        if (!$category->is_active) {
            abort(404);
        }

        return Inertia::render('Categories/SelectProduct', [
            'category' => $category,
        ]);
    }
}
