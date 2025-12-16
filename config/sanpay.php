<?php

return [
    /*
    |--------------------------------------------------------------------------
    | SanPay API Configuration
    |--------------------------------------------------------------------------
    */

    'api_key' => env('SANPAY_API_KEY', ''),
    
    'merchant_code' => env('SANPAY_MERCHANT_CODE', ''),
    
    'base_url' => env('SANPAY_BASE_URL', 'https://sanpay.site/api/v1'),
    
    /*
    |--------------------------------------------------------------------------
    | QRIS Configuration
    |--------------------------------------------------------------------------
    */
    
    'qris_expiry_seconds' => env('SANPAY_QRIS_EXPIRY', 900), // 15 minutes default
    
    /*
    |--------------------------------------------------------------------------
    | Whitelisted IP for Callbacks
    |--------------------------------------------------------------------------
    | SanPay server IP that should be whitelisted: 103.127.137.140
    */
    
    'callback_ip' => '103.127.137.140',
];
