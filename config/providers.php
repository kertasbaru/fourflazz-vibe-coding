<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Product API Providers Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for external API providers used to fetch product data.
    | Each provider has its own section with API credentials and settings.
    |
    */

    'default' => env('DEFAULT_PRODUCT_PROVIDER', 'kmsp'),

    /*
    |--------------------------------------------------------------------------
    | KMSP Provider
    |--------------------------------------------------------------------------
    */
    'kmsp' => [
        'base_url' => env('KMSP_BASE_URL', 'https://golang-openapi-packagelist-xltembakservice.kmsp-store.com'),
        'api_key' => env('KMSP_API_KEY', ''),
        'enabled' => env('KMSP_ENABLED', true),
        'timeout' => env('KMSP_TIMEOUT', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | KAJE Provider
    |--------------------------------------------------------------------------
    */
    'kaje' => [
        'base_url' => env('KAJE_BASE_URL', 'https://end.kaje-store.com'),
        'api_key' => env('KAJE_API_KEY', ''),
        'enabled' => env('KAJE_ENABLED', true),
        'timeout' => env('KAJE_TIMEOUT', 30),
    ],
];
