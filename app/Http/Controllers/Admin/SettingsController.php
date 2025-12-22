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
        $qrImagePath = Setting::get('qr_topup_image', null);

        $settings = [
            'product_margin' => Setting::get('product_margin', 10),
            'min_topup_amount' => Setting::get('min_topup_amount', 10000),
            'qr_topup_image' => $qrImagePath ? asset('storage/' . $qrImagePath) : null,
            'qr_topup_image_path' => $qrImagePath,
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
            'min_topup_amount' => 'required|numeric|min:1|max:100000000',
        ]);

        Setting::set('product_margin', $validated['product_margin'], 'float');
        Setting::set('min_topup_amount', $validated['min_topup_amount'], 'float');

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
        ]);
    }

    /**
     * Upload QR code for top-up.
     */
    public function uploadQrCode(Request $request): JsonResponse
    {
        $request->validate([
            'qr_image' => 'required|image|mimes:jpeg,jpg,png|max:2048', // Max 2MB
        ]);

        try {
            // Delete old QR code if exists
            $oldPath = Setting::get('qr_topup_image', null);
            if ($oldPath && \Storage::disk('public')->exists($oldPath)) {
                \Storage::disk('public')->delete($oldPath);
            }

            // Store new QR code
            $path = $request->file('qr_image')->store('qr-codes', 'public');

            // Save to settings
            Setting::set('qr_topup_image', $path, 'string');

            return response()->json([
                'success' => true,
                'message' => 'QR Code berhasil diupload',
                'path' => asset('storage/' . $path),
            ]);
        } catch (\Exception $e) {
            \Log::error('QR upload error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupload QR Code',
            ], 500);
        }
    }

    /**
     * Delete uploaded QR code and use default.
     */
    public function deleteQrCode(): JsonResponse
    {
        try {
            $oldPath = Setting::get('qr_topup_image', null);

            if ($oldPath && \Storage::disk('public')->exists($oldPath)) {
                \Storage::disk('public')->delete($oldPath);
            }

            // Remove from settings
            Setting::where('key', 'qr_topup_image')->delete();

            return response()->json([
                'success' => true,
                'message' => 'QR Code berhasil dihapus, menggunakan QR default',
            ]);
        } catch (\Exception $e) {
            \Log::error('QR delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus QR Code',
            ], 500);
        }
    }
}
