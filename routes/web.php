<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OtpSessionController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\TopUpController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\Admin;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Authenticated User Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Products
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
    Route::post('/products/{product}/purchase', [ProductController::class, 'purchase'])->name('products.purchase');

    // Categories
    Route::get('/categories', [App\Http\Controllers\CategoryController::class, 'index'])->name('categories.index');
    Route::get('/categories/{category}', [App\Http\Controllers\CategoryController::class, 'show'])->name('categories.show');
    Route::post('/categories/{category}/products-by-input', [ProductController::class, 'getProductsByInput'])->name('categories.products-by-input');

    // Top-up
    Route::get('/topup', [TopUpController::class, 'index'])->name('topup.index');
    Route::post('/topup/create', [TopUpController::class, 'createTopUp'])->name('topup.create');
    Route::post('/topup/{topUpRequest}/upload-proof', [TopUpController::class, 'uploadProof'])->name('topup.upload-proof');
    Route::post('/topup', [TopUpController::class, 'store'])->name('topup.store');

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show'])->name('transactions.show');

    // OTP Sessions
    Route::get('/otp-sessions', [OtpSessionController::class, 'index'])->name('otp-sessions.index');
    Route::post('/otp-sessions/request-otp', [OtpSessionController::class, 'requestOtp'])->name('otp-sessions.request-otp');
    Route::post('/otp-sessions/verify-otp', [OtpSessionController::class, 'verifyOtp'])->name('otp-sessions.verify-otp');
    Route::post('/otp-sessions/{session}/extend', [OtpSessionController::class, 'extend'])->name('otp-sessions.extend');
    Route::post('/otp-sessions/sync', [OtpSessionController::class, 'sync'])->name('otp-sessions.sync');
    Route::delete('/otp-sessions/{session}', [OtpSessionController::class, 'destroy'])->name('otp-sessions.destroy');

    // Purchases
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');
    Route::get('/purchases/{product}/requirements', [PurchaseController::class, 'requirements'])->name('purchases.requirements');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
});

// Webhook for QR Top-up Verification (no auth required)
Route::post('/webhook/topup-verification', [App\Http\Controllers\WebhookController::class, 'verifyTopUp'])->name('webhook.topup.verify');

// SanPay Callback (no auth required)
Route::post('/topup/callback', [TopUpController::class, 'callback'])->name('topup.callback');

// KAJE Webhook for transaction updates (no auth required)
Route::post('/webhook/kaje/transaction', [App\Http\Controllers\KajeWebhookController::class, 'handleCallback'])->name('webhook.kaje.transaction');

// Profile Routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Admin Routes
Route::prefix('admin')
    ->middleware(['auth', 'verified', 'admin'])
    ->name('admin.')
    ->group(function () {
        Route::get('/', [Admin\DashboardController::class, 'index'])->name('dashboard');

        // Products
        Route::resource('products', Admin\ProductController::class);
        Route::post('products/bulk-inactive', [Admin\ProductController::class, 'bulkInactive'])->name('products.bulk-inactive');
        Route::post('products/bulk-active', [Admin\ProductController::class, 'bulkActive'])->name('products.bulk-active');
        Route::post('products/bulk-delete', [Admin\ProductController::class, 'bulkDelete'])->name('products.bulk-delete');
        Route::post('products/bulk-margin', [Admin\ProductController::class, 'bulkUpdateMargin'])->name('products.bulk-margin');
        Route::post('products/bulk-category', [Admin\ProductController::class, 'bulkUpdateCategory'])->name('products.bulk-category');
        Route::get('products-export', [Admin\ProductController::class, 'export'])->name('products.export');
        Route::post('products-import', [Admin\ProductController::class, 'import'])->name('products.import');
        Route::get('products-template', [Admin\ProductController::class, 'downloadTemplate'])->name('products.template');

        // Categories
        Route::resource('categories', Admin\CategoryController::class);

        // Users
        Route::get('users', [Admin\UserController::class, 'index'])->name('users.index');
        Route::get('users/{user}', [Admin\UserController::class, 'show'])->name('users.show');
        Route::get('users/{user}/edit', [Admin\UserController::class, 'edit'])->name('users.edit');
        Route::patch('users/{user}', [Admin\UserController::class, 'update'])->name('users.update');
        Route::post('users/{user}/adjust-balance', [Admin\UserController::class, 'adjustBalance'])->name('users.adjust-balance');

        // Transactions
        Route::get('transactions', [Admin\TransactionController::class, 'index'])->name('transactions.index');
        Route::get('transactions/{transaction}', [Admin\TransactionController::class, 'show'])->name('transactions.show');
        Route::post('transactions/{transaction}/update-status', [Admin\TransactionController::class, 'updateStatus'])->name('transactions.update-status');
        Route::post('transactions/{transaction}/check-status', [Admin\TransactionController::class, 'checkStatus'])->name('transactions.check-status');

        // Top Ups
        Route::get('topups', [Admin\TopUpController::class, 'index'])->name('topups.index');
        Route::post('topups/{topUpRequest}/update-status', [Admin\TopUpController::class, 'updateStatus'])->name('topups.update-status');

        // Providers
        Route::get('providers', [Admin\ProviderController::class, 'index'])->name('providers.index');
        Route::get('providers/all-products', [Admin\ProviderController::class, 'allProducts'])->name('providers.all-products');
        Route::get('providers/{provider}/products', [Admin\ProviderController::class, 'products'])->name('providers.products');
        Route::get('providers/{provider}/balance', [Admin\ProviderController::class, 'balance'])->name('providers.balance');
        Route::post('providers/{provider}/sync', [Admin\ProviderController::class, 'sync'])->name('providers.sync');
        Route::post('providers/{provider}/partial-sync', [Admin\ProviderController::class, 'partialSync'])->name('providers.partial-sync');
        Route::post('providers/{provider}/check-stock', [Admin\ProviderController::class, 'checkStock'])->name('providers.check-stock');
        Route::post('providers/{provider}/refresh-balance', [Admin\ProviderController::class, 'refreshBalance'])->name('providers.refresh-balance');

        // Settings
        Route::get('settings', [Admin\SettingsController::class, 'index'])->name('settings.index');
        Route::post('settings', [Admin\SettingsController::class, 'update'])->name('settings.update');
        Route::post('settings/upload-qr', [Admin\SettingsController::class, 'uploadQrCode'])->name('settings.upload-qr');
        Route::delete('settings/delete-qr', [Admin\SettingsController::class, 'deleteQrCode'])->name('settings.delete-qr');

        // API Logs
        Route::get('api-logs', [Admin\ApiLogController::class, 'index'])->name('api-logs.index');
        Route::get('api-logs/{log}', [Admin\ApiLogController::class, 'show'])->name('api-logs.show');

        // System Logs
        Route::get('logs', [Admin\LogController::class, 'index'])->name('logs.index');
        Route::post('logs/clear', [Admin\LogController::class, 'clear'])->name('logs.clear');
        Route::get('logs/download', [Admin\LogController::class, 'download'])->name('logs.download');
    });

require __DIR__ . '/auth.php';
