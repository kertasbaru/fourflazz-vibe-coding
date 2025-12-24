<?php

namespace App\Services;

use App\Models\Setting;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrisGenerator
{
    /**
     * Generate dynamic QRIS QR code with specific amount.
     *
     * @param float $amount Transaction amount
     * @return string|null Base64 encoded QR code image or null if QRIS data not available
     */
    public static function generateDynamicQr(float $amount): ?string
    {
        // Check if QRIS mode is dynamic
        $qrisMode = Setting::get('qris_mode', 'static');

        if ($qrisMode !== 'dynamic') {
            return null;
        }

        // Get saved QRIS data
        $qrisData = Setting::get('qris_data', []);

        if (empty($qrisData)) {
            return null;
        }

        // We need to reconstruct the base QRIS string from the saved data
        // For now, we'll use a different approach: save the original QRIS string
        $baseQrisString = Setting::get('qris_base_string', null);

        if (!$baseQrisString) {
            return null;
        }

        // Modify amount in QRIS string
        $modifiedQris = QrisParser::setAmount($baseQrisString, $amount);

        // Generate QR code as base64 PNG
        $qrCode = QrCode::format('png')
            ->size(300)
            ->errorCorrection('H')
            ->generate($modifiedQris);

        // Convert to base64
        return 'data:image/png;base64,' . base64_encode($qrCode);
    }

    /**
     * Generate QR code from QRIS string.
     *
     * @param string $qrisString
     * @param int $size
     * @return string Base64 encoded QR code image
     */
    public static function generateQrFromString(string $qrisString, int $size = 300): string
    {
        $qrCode = QrCode::format('png')
            ->size($size)
            ->errorCorrection('H')
            ->generate($qrisString);

        return 'data:image/png;base64,' . base64_encode($qrCode);
    }

    /**
     * Check if dynamic QRIS is configured and available.
     *
     * @return bool
     */
    public static function isDynamicQrisAvailable(): bool
    {
        $qrisMode = Setting::get('qris_mode', 'static');
        $baseQrisString = Setting::get('qris_base_string', null);

        return $qrisMode === 'dynamic' && !empty($baseQrisString);
    }
}
