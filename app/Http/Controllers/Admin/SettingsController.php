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
        $qrisData = Setting::get('qris_data', []);

        $settings = [
            'product_margin' => Setting::get('product_margin', 10),
            'min_topup_amount' => Setting::get('min_topup_amount', 10000),
            'qr_topup_image' => $qrImagePath ? asset('storage/' . $qrImagePath) : null,
            'qr_topup_image_path' => $qrImagePath,
            'qris_mode' => Setting::get('qris_mode', 'static'),
            'qris_data' => $qrisData,
            'qris_labels' => !empty($qrisData) ? \App\Services\QrisParser::getLabels($qrisData) : null,
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

    /**
     * Update QRIS mode (static or dynamic).
     */
    public function updateQrisMode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mode' => 'required|in:static,dynamic',
        ]);

        Setting::set('qris_mode', $validated['mode'], 'string');

        return response()->json([
            'success' => true,
            'message' => 'Mode QRIS berhasil diperbarui',
        ]);
    }

    /**
     * Update QRIS dynamic data.
     */
    public function updateQrisData(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qris_data' => 'required|array',
        ]);

        Setting::set('qris_data', json_encode($validated['qris_data']), 'json');

        return response()->json([
            'success' => true,
            'message' => 'Data QRIS berhasil disimpan',
        ]);
    }

    /**
     * Parse QRIS string and return structured data.
     */
    public function parseQrisString(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qris_string' => 'required|string',
        ]);

        try {
            $qrisString = trim($validated['qris_string']);

            // Validate CRC
            if (!\App\Services\QrisParser::validateCrc($qrisString)) {
                return response()->json([
                    'success' => false,
                    'message' => 'QRIS string tidak valid (CRC checksum mismatch)',
                ], 422);
            }

            // Parse QRIS string
            $parsedData = \App\Services\QrisParser::parse($qrisString);
            $labels = \App\Services\QrisParser::getLabels($parsedData);

            // Save the base QRIS string for dynamic QR generation
            Setting::set('qris_base_string', $qrisString, 'string');

            return response()->json([
                'success' => true,
                'data' => $parsedData,
                'labels' => $labels,
                'message' => 'QRIS berhasil diparsing',
            ]);
        } catch (\Exception $e) {
            \Log::error('QRIS parsing error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses QRIS string: ' . $e->getMessage(),
            ], 500);
        }
    }
}
