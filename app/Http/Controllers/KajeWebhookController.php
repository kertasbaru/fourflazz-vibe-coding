<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\ApiLog;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class KajeWebhookController extends Controller
{
    /**
     * Handle KAJE webhook callback for transaction status updates.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function handleCallback(Request $request): JsonResponse
    {
        $startTime = microtime(true);
        $rawBody = $request->getContent();

        // Security Check: Verify API key from Authorization header
        $authHeader = $request->header('Authorization');
        $providedKey = null;
        if ($authHeader) {
            $providedKey = str_starts_with($authHeader, 'Bearer ')
                ? substr($authHeader, 7)
                : $authHeader;
        }

        $validApiKey = config('providers.kaje.api_key');
        if (!empty($validApiKey) && $providedKey !== $validApiKey) {
            Log::warning('KAJE Webhook unauthorized attempt', [
                'ip' => $request->ip(),
                'auth_header' => $authHeader ? 'present' : 'missing',
            ]);

            $this->logWebhook($request, null, null, false, 'Unauthorized: Invalid API Key', $startTime);

            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
            ], 401);
        }

        // Log raw request for debugging
        Log::info('KAJE Webhook Raw Request', [
            'raw_body' => $rawBody,
            'content_type' => $request->header('Content-Type'),
            'headers' => $request->headers->all(),
            'ip' => $request->ip(),
        ]);

        // Try to parse JSON, fallback to request input if JSON fails
        $data = json_decode($rawBody, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Fallback to form data or query params
            $data = $request->all();
            Log::info('KAJE Webhook: Using form/query data instead of JSON', ['data' => $data]);
        }

        // If still empty, try to get from request body as form-urlencoded
        if (empty($data)) {
            parse_str($rawBody, $data);
            Log::info('KAJE Webhook: Parsed as form-urlencoded', ['data' => $data]);
        }

        Log::info('KAJE Webhook Parsed Payload', ['payload' => $data]);

        // Validate payload structure
        $validationResult = $this->validatePayload($data);
        if (!$validationResult['valid']) {
            $this->logWebhook($request, $data, null, false, $validationResult['error'], $startTime);

            return response()->json([
                'status' => 'error',
                'message' => $validationResult['error']
            ], 400);
        }

        // Extract data from payload - support multiple field name formats
        $refId = $data['ref_id'] ?? $data['refId'] ?? $data['reference_id'] ?? null;
        $trxId = $data['trx_id'] ?? $data['trxId'] ?? $data['transaction_id'] ?? $data['id'] ?? null;
        $status = $data['status'] ?? null;
        $destination = $data['destination'] ?? $data['msisdn'] ?? $data['phone'] ?? null;
        $serialNumber = $data['serial_number'] ?? $data['serialNumber'] ?? $data['sn'] ?? null;
        $message = $data['message'] ?? $data['info'] ?? $data['description'] ?? null;
        $deeplink = $data['deeplink'] ?? null;
        $metaData = $data['meta_data'] ?? $data['metadata'] ?? [];

        // Find transaction by reference number
        $transaction = Transaction::where('reference_number', $refId)->first();

        if (!$transaction) {
            $this->logWebhook($request, $data, null, false, "Transaction not found for ref_id: {$refId}", $startTime);

            return response()->json([
                'status' => 'error',
                'message' => 'Transaction not found'
            ], 404);
        }

        // Map KAJE status to internal status
        $internalStatus = $this->mapStatus($status);

        // Prepare provider response data
        $providerResponse = [
            'trx_id' => $trxId,
            'status' => $status,
            'destination' => $destination,
            'serial_number' => $serialNumber,
            'message' => $message,
            'deeplink' => $deeplink,
            'meta_data' => $metaData,
            'webhook_received_at' => now()->toDateTimeString(),
        ];

        // Update transaction
        $transaction->update([
            'status' => $internalStatus,
            'serial_number' => $serialNumber,
            'notes' => $message,
            'provider_response' => json_encode($providerResponse),
        ]);

        // Create notification for user if transaction is completed
        if (in_array($internalStatus, [Transaction::STATUS_SUCCESS, Transaction::STATUS_FAILED])) {
            $this->createUserNotification($transaction, $internalStatus, $message);
        }

        $this->logWebhook($request, $data, $transaction, true, null, $startTime);

        Log::info('KAJE Webhook Processed Successfully', [
            'ref_id' => $refId,
            'trx_id' => $trxId,
            'old_status' => $transaction->getOriginal('status'),
            'new_status' => $internalStatus,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Webhook processed successfully',
            'ref_id' => $refId,
        ], 200);
    }

    /**
     * Validate webhook payload structure.
     *
     * @param array|null $data
     * @return array{valid: bool, error: ?string}
     */
    protected function validatePayload(?array $data): array
    {
        if (!$data || empty($data)) {
            return ['valid' => false, 'error' => 'Empty or null payload'];
        }

        // Check for ref_id (support multiple field names)
        $refId = $data['ref_id'] ?? $data['refId'] ?? $data['reference_id'] ?? null;
        if (empty($refId)) {
            return ['valid' => false, 'error' => 'Missing ref_id field'];
        }

        // Check for status
        $status = $data['status'] ?? null;
        if (empty($status)) {
            return ['valid' => false, 'error' => 'Missing status field'];
        }

        // trx_id is optional for some providers
        // $trxId = $data['trx_id'] ?? $data['trxId'] ?? $data['transaction_id'] ?? $data['id'] ?? null;
        // if (empty($trxId)) {
        //     return ['valid' => false, 'error' => 'Missing trx_id field'];
        // }

        return ['valid' => true, 'error' => null];
    }

    /**
     * Map KAJE status to internal transaction status.
     *
     * @param string $kajeStatus
     * @return string
     */
    protected function mapStatus(string $kajeStatus): string
    {
        return match (strtolower($kajeStatus)) {
            'pending' => Transaction::STATUS_PENDING,
            'processing', 'process' => Transaction::STATUS_PROCESSING,
            'success', 'sukses', 'berhasil' => Transaction::STATUS_SUCCESS,
            'failed', 'gagal', 'error' => Transaction::STATUS_FAILED,
            'refund', 'refunded' => Transaction::STATUS_REFUNDED,
            default => Transaction::STATUS_PENDING,
        };
    }

    /**
     * Create notification for user about transaction status.
     *
     * @param Transaction $transaction
     * @param string $status
     * @param string|null $message
     * @return void
     */
    protected function createUserNotification(Transaction $transaction, string $status, ?string $message): void
    {
        $title = $status === Transaction::STATUS_SUCCESS
            ? 'Transaksi Berhasil'
            : 'Transaksi Gagal';

        $body = $message ?? ($status === Transaction::STATUS_SUCCESS
            ? "Transaksi {$transaction->reference_number} berhasil diproses"
            : "Transaksi {$transaction->reference_number} gagal diproses");

        Notification::create([
            'user_id' => $transaction->user_id,
            'type' => 'transaction_update',
            'title' => $title,
            'message' => $body,
            'data' => [
                'transaction_id' => $transaction->id,
                'reference_number' => $transaction->reference_number,
                'status' => $status,
                'product_name' => $transaction->product?->name ?? 'Unknown',
                'amount' => $transaction->amount,
            ],
            'read_at' => null,
        ]);
    }

    /**
     * Log webhook call to API logs.
     *
     * @param Request $request
     * @param array|null $payload
     * @param Transaction|null $transaction
     * @param bool $success
     * @param string|null $errorMessage
     * @param float $startTime
     * @return void
     */
    protected function logWebhook(
        Request $request,
        ?array $payload,
        ?Transaction $transaction,
        bool $success,
        ?string $errorMessage = null,
        float $startTime = 0
    ): void {
        $responseTime = $startTime > 0 ? microtime(true) - $startTime : null;

        ApiLog::create([
            'provider' => 'kaje',
            'endpoint' => '/webhook/kaje/transaction',
            'method' => 'POST',
            'request_data' => $payload,
            'response_data' => $transaction ? [
                'transaction_id' => $transaction->id,
                'reference_number' => $transaction->reference_number,
                'status' => $transaction->status,
            ] : null,
            'response_code' => $success ? 200 : ($transaction ? 404 : 400),
            'success' => $success,
            'error_message' => $errorMessage,
            'response_time' => $responseTime,
            'user_id' => $transaction->user_id ?? null,
            'ip_address' => $request->ip(),
        ]);
    }
}
