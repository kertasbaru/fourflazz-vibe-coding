<?php

namespace App\Http\Controllers;

use App\Models\TopUpRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Verify top-up payment from MacroDroid webhook
     */
    public function verifyTopUp(Request $request)
    {
        // Security Check: API Key
        $apiKey = $request->input('api_key');
        // Fallback to empty string if env not set to prevent null === null bypass if that were possible (though it's not)
        $validApiKey = env('WEBHOOK_API_KEY');

        if (empty($validApiKey)) {
            Log::error('WEBHOOK_API_KEY is not set in .env');
            return response()->json([
                'success' => false,
                'message' => 'Server Configuration Error: API Key not set'
            ], 500);
        }

        if ($apiKey !== $validApiKey) {
            Log::warning('Webhook unauthorized attempt', [
                'ip' => $request->ip(),
                'provided_key' => '***' // Don't log the key
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid API Key'
            ], 401);
        }

        // Validasi request dari MacroDroid
        $amount = $request->input('amount'); // e.g., 100.123

        Log::info('TopUp webhook received', [
            'amount' => $amount,
            'ip' => $request->ip(),
            'all_data' => $request->all()
        ]);

        if (!$amount) {
            return response()->json([
                'success' => false,
                'message' => 'Amount is required'
            ], 400);
        }

        // Cari transaksi dengan total_amount yang cocok
        $topup = TopUpRequest::where('total_amount', $amount)
            ->where('status', 'pending')
            ->where('created_at', '>=', now()->subHours(24)) // Max 24 jam
            ->first();

        if (!$topup) {
            Log::warning('TopUp not found', [
                'amount' => $amount,
                'searched_since' => now()->subHours(24)
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan atau sudah diproses'
            ], 404);
        }

        // Update status dan tambah balance menggunakan method model
        $topup->markAsPaid(
            'WEBHOOK-' . time(),
            ['webhook_data' => $request->all()]
        );

        // Refresh user data (balance already updated by markAsPaid)
        $user = $topup->user;

        Log::info('TopUp verified successfully', [
            'topup_id' => $topup->id,
            'user_id' => $user->id,
            'amount' => $topup->amount,
            'unique_code' => $topup->unique_code,
            'new_balance' => $user->balance
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Top-up berhasil diverifikasi',
            'data' => [
                'topup_id' => $topup->id,
                'user_id' => $user->id,
                'amount' => $topup->amount,
                'new_balance' => $user->balance
            ]
        ]);
    }

    /**
     * Handle MacroDroid notifications
     */
    public function handleNotification(Request $request)
    {
        $startTime = microtime(true);
        $responseData = null;
        $responseStatus = 200;
        $success = false;
        $errorMessage = null;

        try {
            // Security Check: API Key from Authorization header
            $authHeader = $request->header('Authorization');
            $validApiKey = env('WEBHOOK_API_KEY');

            if (empty($validApiKey)) {
                $errorMessage = 'WEBHOOK_API_KEY is not set in .env';
                Log::error($errorMessage);

                $responseData = [
                    'success' => false,
                    'message' => 'Server Configuration Error: API Key not set'
                ];
                $responseStatus = 500;

                return response()->json($responseData, $responseStatus);
            }

            // Check Authorization header (Bearer token format or just the key)
            $providedKey = null;
            if ($authHeader) {
                // Support both "Bearer TOKEN" and just "TOKEN"
                if (str_starts_with($authHeader, 'Bearer ')) {
                    $providedKey = substr($authHeader, 7);
                } else {
                    $providedKey = $authHeader;
                }
            }

            if ($providedKey !== $validApiKey) {
                $errorMessage = 'Invalid API Key';
                Log::warning('MacroDroid notification unauthorized attempt', [
                    'ip' => $request->ip(),
                    'auth_header' => $authHeader ? 'present' : 'missing'
                ]);

                $responseData = [
                    'success' => false,
                    'message' => 'Unauthorized: Invalid API Key'
                ];
                $responseStatus = 401;

                return response()->json($responseData, $responseStatus);
            }

            // Get notification data
            $data = $request->validate([
                'notification_app_package' => 'nullable|string',
                'notification_text' => 'nullable|string',
                'notification_title' => 'nullable|string',
            ]);

            // Log received notification
            Log::info('MacroDroid notification received', [
                'ip' => $request->ip(),
                'data' => $data,
                'all_params' => $request->all()
            ]);

            Log::debug('MacroDroid raw request body', [
                'raw_body' => $request->getContent()
            ]);

            // Process QRIS payment notification
            $verifiedTopUp = null;
            $notificationText = $data['notification_text'] ?? '';

            if (!empty($notificationText)) {
                // Parse amount from notification text
                // Format examples:
                // "sebesar Rp. 1"
                // "sebesar Rp. 100.000"
                // "sebesar Rp 100000"

                $amount = $this->parseAmountFromText($notificationText);

                if ($amount) {
                    Log::info('Parsed amount from notification', [
                        'text' => $notificationText,
                        'parsed_amount' => $amount
                    ]);

                    // Find matching pending top-up request
                    $topup = TopUpRequest::where('total_amount', $amount)
                        ->where('status', 'pending')
                        ->where('created_at', '>=', now()->subHours(24))
                        ->orderBy('created_at', 'desc')
                        ->first();

                    if ($topup) {
                        // Mark as paid
                        $topup->markAsPaid(
                            'QRIS-NOTIFICATION-' . time(),
                            [
                                'notification_data' => $data,
                                'parsed_amount' => $amount
                            ]
                        );

                        $verifiedTopUp = [
                            'topup_id' => $topup->id,
                            'user_id' => $topup->user_id,
                            'amount' => $topup->amount,
                            'total_amount' => $topup->total_amount,
                            'verified' => true
                        ];

                        Log::info('Top-up auto-verified from QRIS notification', [
                            'topup_id' => $topup->id,
                            'user_id' => $topup->user_id,
                            'amount' => $amount
                        ]);
                    } else {
                        Log::warning('No matching top-up request found', [
                            'parsed_amount' => $amount,
                            'searched_since' => now()->subHours(24)
                        ]);
                    }
                } else {
                    Log::warning('Could not parse amount from notification text', [
                        'text' => $notificationText
                    ]);
                }
            }

            // Prepare success response
            $success = true;
            $responseData = [
                'success' => true,
                'message' => 'Notification received',
                'received_data' => [
                    'app_package' => $data['notification_app_package'] ?? null,
                    'text' => $data['notification_text'] ?? null,
                    'title' => $data['notification_title'] ?? null,
                ],
                'processing_time' => round((microtime(true) - $startTime) * 1000, 2) . 'ms'
            ];

            // Add verification info if top-up was verified
            if ($verifiedTopUp) {
                $responseData['topup_verified'] = $verifiedTopUp;
            }

            $responseStatus = 200;

            return response()->json($responseData, $responseStatus);

        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            Log::error('MacroDroid webhook error', [
                'error' => $errorMessage,
                'trace' => $e->getTraceAsString()
            ]);

            $responseData = [
                'success' => false,
                'message' => 'Internal server error',
                'error' => $errorMessage
            ];
            $responseStatus = 500;

            return response()->json($responseData, $responseStatus);

        } finally {
            // Always log to database
            try {
                \App\Models\WebhookLog::create([
                    'type' => 'macrodroid_notification',
                    'method' => $request->method(),
                    'endpoint' => $request->path(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'headers' => $request->headers->all(),
                    'request_data' => $request->all(),
                    'response_data' => $responseData,
                    'response_status' => $responseStatus,
                    'success' => $success,
                    'error_message' => $errorMessage,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to log webhook to database', [
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Parse amount from notification text
     * Examples:
     * "sebesar Rp. 1" -> 1
     * "sebesar Rp. 100.000" -> 100000
     * "sebesar Rp 100000" -> 100000
     * "menerima saldo QRIS sebesar Rp. 100.123" -> 100123
     */
    private function parseAmountFromText(string $text): ?float
    {
        // Pattern untuk match berbagai format:
        // Rp. 100.000
        // Rp 100000
        // Rp. 100,000
        // Rp.100.000

        $patterns = [
            '/sebesar\s*Rp\.?\s*([\d.,]+)/i',  // sebesar Rp. 100.000
            '/Rp\.?\s*([\d.,]+)/i',             // Rp. 100.000 atau Rp 100000
            '/sebesar\s*([\d.,]+)/i',           // sebesar 100.000
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $amountStr = $matches[1];

                // Remove dots (thousand separators) and convert comma to dot
                // Handle both formats: 100.000 and 100,000
                // Also handle decimal: 100.000,50 or 100,000.50

                // Check if comma is used as decimal separator (European format)
                if (strpos($amountStr, ',') !== false && strpos($amountStr, '.') !== false) {
                    // Format: 100.000,50 (European)
                    $amountStr = str_replace('.', '', $amountStr); // Remove thousand separator
                    $amountStr = str_replace(',', '.', $amountStr); // Convert decimal separator
                } elseif (strpos($amountStr, ',') !== false) {
                    // Format: 100,000 or 100,50
                    // Check if it's likely a thousand separator or decimal
                    $parts = explode(',', $amountStr);
                    if (strlen($parts[count($parts) - 1]) == 3) {
                        // Likely thousand separator: 100,000
                        $amountStr = str_replace(',', '', $amountStr);
                    } else {
                        // Likely decimal: 100,50
                        $amountStr = str_replace(',', '.', $amountStr);
                    }
                } else {
                    // Format: 100.000 or 100.50
                    // Remove dots if they're thousand separators
                    // Keep dot if it's decimal (check if last part is 2 digits)
                    $parts = explode('.', $amountStr);
                    if (count($parts) > 1 && strlen($parts[count($parts) - 1]) == 3) {
                        // Likely thousand separator: 100.000
                        $amountStr = str_replace('.', '', $amountStr);
                    }
                    // Else keep as is (100.50 decimal format)
                }

                $amount = floatval($amountStr);

                if ($amount > 0) {
                    return $amount;
                }
            }
        }

        return null;
    }
}
