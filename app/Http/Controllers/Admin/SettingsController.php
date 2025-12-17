<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Display settings page.
     */
    public function index(): Response
    {
        $settings = [
            'product_margin' => Setting::get('product_margin', 10),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_margin' => 'required|numeric|min:0|max:1000',
        ]);

        Setting::set('product_margin', $validated['product_margin'], 'float');

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
        ]);
    }
}
