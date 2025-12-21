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
}
