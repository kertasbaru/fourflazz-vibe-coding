<?php

namespace App\Services;

class QrisParser
{
    /**
     * Parse QRIS string into structured array.
     *
     * @param string $qrisString
     * @return array
     */
    public static function parse(string $qrisString): array
    {
        $data = [];
        $position = 0;
        $length = strlen($qrisString);

        while ($position < $length) {
            // Each tag is: 2-digit ID + 2-digit length + value
            if ($position + 4 > $length) {
                break;
            }

            $id = substr($qrisString, $position, 2);
            $valueLength = (int) substr($qrisString, $position + 2, 2);
            $value = substr($qrisString, $position + 4, $valueLength);

            $position += 4 + $valueLength;

            $data[$id] = $value;
        }

        return self::parseStructured($data);
    }

    /**
     * Parse structured QRIS data with nested tags.
     *
     * @param array $rawData
     * @return array
     */
    protected static function parseStructured(array $rawData): array
    {
        $structured = [
            'payload_format_indicator' => $rawData['00'] ?? null,
            'point_of_initiation_method' => $rawData['01'] ?? null,
            'merchant_account_info' => [],
            'qris_info' => [],
            'merchant_category_code' => $rawData['52'] ?? null,
            'transaction_currency' => $rawData['53'] ?? null,
            'country_code' => $rawData['58'] ?? null,
            'merchant_name' => $rawData['59'] ?? null,
            'merchant_city' => $rawData['60'] ?? null,
            'postal_code' => $rawData['61'] ?? null,
            'additional_data' => [],
            'crc' => $rawData['63'] ?? null,
        ];

        // Parse merchant account information (tag 26 - Nobu Bank)
        if (isset($rawData['26'])) {
            $structured['merchant_account_info'] = self::parseNestedTags($rawData['26']);
        }

        // Parse QRIS switching information (tag 51)
        if (isset($rawData['51'])) {
            $structured['qris_info'] = self::parseNestedTags($rawData['51']);
        }

        // Parse additional data field (tag 62)
        if (isset($rawData['62'])) {
            $structured['additional_data'] = self::parseNestedTags($rawData['62']);
        }

        return $structured;
    }

    /**
     * Parse nested tags within a value string.
     *
     * @param string $value
     * @return array
     */
    protected static function parseNestedTags(string $value): array
    {
        $nested = [];
        $position = 0;
        $length = strlen($value);

        while ($position < $length) {
            if ($position + 4 > $length) {
                break;
            }

            $id = substr($value, $position, 2);
            $valueLength = (int) substr($value, $position + 2, 2);
            $nestedValue = substr($value, $position + 4, $valueLength);

            $position += 4 + $valueLength;

            $nested[$id] = $nestedValue;
        }

        return $nested;
    }

    /**
     * Validate QRIS string CRC checksum.
     *
     * @param string $qrisString
     * @return bool
     */
    public static function validateCrc(string $qrisString): bool
    {
        if (strlen($qrisString) < 4) {
            return false;
        }

        // Extract CRC (last 4 characters)
        $providedCrc = substr($qrisString, -4);
        // The QRIS string already contains tag 63 (length 04) before the CRC value
        // So we don't need to append '6304' again
        $dataToValidate = substr($qrisString, 0, -4);

        // Calculate CRC-16-CCITT
        $calculatedCrc = self::calculateCrc16($dataToValidate);

        return strtoupper($providedCrc) === strtoupper($calculatedCrc);
    }

    /**
     * Calculate CRC-16-CCITT checksum.
     *
     * @param string $data
     * @return string
     */
    protected static function calculateCrc16(string $data): string
    {
        $crc = 0xFFFF;

        for ($i = 0; $i < strlen($data); $i++) {
            $crc ^= ord($data[$i]) << 8;

            for ($j = 0; $j < 8; $j++) {
                if ($crc & 0x8000) {
                    $crc = ($crc << 1) ^ 0x1021;
                } else {
                    $crc = $crc << 1;
                }
                $crc &= 0xFFFF;
            }
        }

        return strtoupper(dechex($crc));
    }

    /**
     * Get human-readable labels for QRIS data.
     *
     * @param array $parsedData
     * @return array
     */
    public static function getLabels(array $parsedData): array
    {
        return [
            'basic_info' => [
                'label' => 'Informasi Dasar',
                'fields' => [
                    'payload_format_indicator' => [
                        'label' => 'Payload Format Indicator',
                        'value' => $parsedData['payload_format_indicator'] ?? '-',
                    ],
                    'point_of_initiation_method' => [
                        'label' => 'Point of Initiation Method',
                        'value' => $parsedData['point_of_initiation_method'] ?? '-',
                        'description' => ($parsedData['point_of_initiation_method'] ?? '') === '11' ? 'Static QR' : 'Dynamic QR',
                    ],
                ],
            ],
            'merchant_account' => [
                'label' => 'Informasi Akun Merchant (Nobu Bank)',
                'fields' => [
                    'global_id' => [
                        'label' => 'Global ID',
                        'value' => $parsedData['merchant_account_info']['00'] ?? '-',
                    ],
                    'pan' => [
                        'label' => 'PAN / Nomor Identifikasi',
                        'value' => $parsedData['merchant_account_info']['01'] ?? '-',
                    ],
                    'merchant_id' => [
                        'label' => 'ID Merchant Internal',
                        'value' => $parsedData['merchant_account_info']['02'] ?? '-',
                    ],
                    'criteria' => [
                        'label' => 'Kriteria Usaha',
                        'value' => $parsedData['merchant_account_info']['03'] ?? '-',
                    ],
                ],
            ],
            'qris_info' => [
                'label' => 'Informasi QRIS Nasional',
                'fields' => [
                    'qris_id' => [
                        'label' => 'ID QRIS',
                        'value' => $parsedData['qris_info']['00'] ?? '-',
                    ],
                    'nmid' => [
                        'label' => 'NMID (National Merchant ID)',
                        'value' => $parsedData['qris_info']['02'] ?? '-',
                    ],
                    'criteria' => [
                        'label' => 'Kriteria',
                        'value' => $parsedData['qris_info']['03'] ?? '-',
                    ],
                ],
            ],
            'transaction_info' => [
                'label' => 'Detail Transaksi & Lokasi',
                'fields' => [
                    'merchant_category_code' => [
                        'label' => 'MCC (Merchant Category Code)',
                        'value' => $parsedData['merchant_category_code'] ?? '-',
                    ],
                    'transaction_currency' => [
                        'label' => 'Mata Uang',
                        'value' => $parsedData['transaction_currency'] ?? '-',
                        'description' => 'IDR (Rupiah)',
                    ],
                    'country_code' => [
                        'label' => 'Kode Negara',
                        'value' => $parsedData['country_code'] ?? '-',
                    ],
                    'merchant_name' => [
                        'label' => 'Nama Merchant',
                        'value' => $parsedData['merchant_name'] ?? '-',
                    ],
                    'merchant_city' => [
                        'label' => 'Kota',
                        'value' => $parsedData['merchant_city'] ?? '-',
                    ],
                    'postal_code' => [
                        'label' => 'Kode Pos',
                        'value' => $parsedData['postal_code'] ?? '-',
                    ],
                ],
            ],
            'additional_data' => [
                'label' => 'Informasi Tambahan',
                'fields' => [
                    'terminal_id' => [
                        'label' => 'Terminal ID',
                        'value' => $parsedData['additional_data']['01'] ?? '-',
                    ],
                    'customer_id' => [
                        'label' => 'Customer ID / Tag Internal',
                        'value' => $parsedData['additional_data']['07'] ?? '-',
                    ],
                    'purpose' => [
                        'label' => 'Purpose of Transaction',
                        'value' => $parsedData['additional_data']['08'] ?? '-',
                    ],
                ],
            ],
        ];
    }

    /**
     * Build QRIS string from raw tag data.
     *
     * @param array $tags Associative array of tag => value
     * @return string QRIS string without CRC
     */
    public static function buildQrisString(array $tags): string
    {
        $qrisString = '';

        // Sort tags by key to ensure proper order
        ksort($tags);

        foreach ($tags as $tag => $value) {
            $tag = str_pad($tag, 2, '0', STR_PAD_LEFT);
            $length = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
            $qrisString .= $tag . $length . $value;
        }

        return $qrisString;
    }

    /**
     * Build nested tag string.
     *
     * @param array $nestedTags
     * @return string
     */
    public static function buildNestedTags(array $nestedTags): string
    {
        $result = '';
        ksort($nestedTags);

        foreach ($nestedTags as $tag => $value) {
            $tag = str_pad($tag, 2, '0', STR_PAD_LEFT);
            $length = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
            $result .= $tag . $length . $value;
        }

        return $result;
    }

    /**
     * Set transaction amount in QRIS string.
     *
     * @param string $qrisString Original QRIS string
     * @param float $amount Transaction amount
     * @return string Modified QRIS string with new CRC
     */
    public static function setAmount(string $qrisString, float $amount): string
    {
        // Remove CRC (last 4 chars + tag 6304)
        $qrisWithoutCrc = substr($qrisString, 0, -8);

        // Format amount (2 decimal places as per QRIS spec)
        $amountStr = number_format($amount, 2, '.', '');

        // Parse existing tags
        $tags = [];
        $position = 0;
        $length = strlen($qrisWithoutCrc);

        while ($position < $length) {
            if ($position + 4 > $length) {
                break;
            }

            $id = substr($qrisWithoutCrc, $position, 2);
            $valueLength = (int) substr($qrisWithoutCrc, $position + 2, 2);
            $value = substr($qrisWithoutCrc, $position + 4, $valueLength);

            // Skip tag 54 (we'll add it fresh)
            if ($id !== '54') {
                $tags[$id] = $value;
            }

            $position += 4 + $valueLength;
        }

        // Change Point of Initiation Method from 11 (static) to 12 (dynamic)
        // This is REQUIRED for QRIS with transaction amount
        $tags['01'] = '12';

        // Add amount tag
        $tags['54'] = $amountStr;

        // Rebuild QRIS string
        $newQris = self::buildQrisString($tags);

        // Add CRC tag placeholder
        $newQris .= '6304';

        // Calculate and append CRC
        $crc = self::calculateCrc16($newQris);
        $newQris .= $crc;

        return $newQris;
    }

    /**
     * Parse raw QRIS string to tag array (without nested parsing).
     *
     * @param string $qrisString
     * @return array
     */
    public static function parseRaw(string $qrisString): array
    {
        $tags = [];
        $position = 0;
        // Remove CRC (last 8 chars: 6304XXXX)
        $length = strlen($qrisString) - 8;

        while ($position < $length) {
            if ($position + 4 > $length) {
                break;
            }

            $id = substr($qrisString, $position, 2);
            $valueLength = (int) substr($qrisString, $position + 2, 2);
            $value = substr($qrisString, $position + 4, $valueLength);

            $tags[$id] = $value;
            $position += 4 + $valueLength;
        }

        return $tags;
    }
}
