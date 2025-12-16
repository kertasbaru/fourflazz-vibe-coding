<?php

namespace App\Http\Controllers;

use App\Models\TopUpRequest;
use App\Services\SanPayService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TopUpController extends Controller
{
    protected SanPayService $sanPayService;

    public function __construct(SanPayService $sanPayService)
    {
        $this->sanPayService = $sanPayService;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $topUpRequests = $user->topUpRequests()
            ->latest()
            ->paginate(10);

        // Get available payment channels
        $channels = $this->sanPayService->getChannels();

        return Inertia::render('TopUp/Index', [
            'topUpRequests' => $topUpRequests,
            'balance' => $user->balance,
            'formattedBalance' => $user->formatted_balance,
            'vaChannels' => $channels['va_channels'] ?? [],
            'retailChannels' => $channels['retail_channels'] ?? [],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10000|max:10000000',
            'payment_method' => 'required|in:qris,va,retail',
            'bank_code' => 'required_if:payment_method,va,retail|nullable|string',
        ]);

        $user = $request->user();
        $orderId = TopUpRequest::generateOrderId();
        $paymentMethod = $request->payment_method;

        // Create top-up request
        $topUpRequest = TopUpRequest::create([
            'user_id' => $user->id,
            'amount' => $request->amount,
            'order_id' => $orderId,
            'payment_method' => $paymentMethod,
            'bank_code' => $request->bank_code,
            'status' => TopUpRequest::STATUS_PENDING,
        ]);

        // Create payment based on method
        $result = match($paymentMethod) {
            'qris' => $this->sanPayService->createQris([
                'amount' => $request->amount,
                'reference_no' => $orderId,
            ]),
            'va' => $this->sanPayService->createVA([
                'amount' => $request->amount,
                'reference_no' => $orderId,
                'bank_code' => $request->bank_code,
                'customer_name' => $user->name,
            ]),
            'retail' => $this->sanPayService->createRetail([
                'amount' => $request->amount,
                'reference_no' => $orderId,
                'retail_outlet' => $request->bank_code,
                'customer_name' => $user->name,
            ]),
            default => ['success' => false, 'message' => 'Invalid payment method'],
        };

        if (!$result['success']) {
            $topUpRequest->markAsFailed($result);

            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to create payment. Please try again.',
            ], 500);
        }

        // Update top-up request with payment details
        $paymentCode = match($paymentMethod) {
            'qris' => $result['qr_content'] ?? null,
            'va' => $result['va_number'] ?? null,
            'retail' => $result['payment_code'] ?? null,
            default => null,
        };

        $topUpRequest->update([
            'payment_code' => $paymentCode,
            'expired_at' => $result['expires_at'] ?? null,
            'payment_response' => $result['data'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'payment_method' => $paymentMethod,
            'payment_code' => $paymentCode,
            'bank_code' => $request->bank_code,
            'amount' => (int) $request->amount,
            'expires_at' => $result['expires_at'] ?? null,
            'order_id' => $orderId,
        ]);
    }

    public function callback(Request $request)
    {
        $rawBody = $request->getContent();
        $signature = $request->header('X-Signature', '');
        $merchantCode = $request->header('X-Merchant-Code', '');

        // Verify callback authenticity
        if (!$this->sanPayService->verifyCallback($rawBody, $signature, $merchantCode)) {
            return response()->json(['status' => 'error', 'message' => 'Invalid signature'], 401);
        }

        $data = json_decode($rawBody, true);
        $parsed = $this->sanPayService->parseCallback($data);

        // Handle validation test
        if ($parsed['is_validation_test'] ?? false) {
            return response()->json(['status' => 'success']);
        }

        // Find the top-up request
        $referenceNo = $parsed['reference_no'] ?? null;
        
        // For QRIS, try transaction_id if reference_no is empty
        if (!$referenceNo && isset($parsed['transaction_id'])) {
            $topUpRequest = TopUpRequest::where('payment_transaction_id', $parsed['transaction_id'])->first();
        } else {
            $topUpRequest = TopUpRequest::where('order_id', $referenceNo)->first();
        }

        if (!$topUpRequest) {
            return response()->json(['status' => 'not_found'], 404);
        }

        // Mark as paid if successful
        if ($parsed['is_paid'] ?? false) {
            $topUpRequest->markAsPaid(
                $parsed['transaction_id'] ?? $parsed['external_id'] ?? '',
                $data
            );
        }

        return response()->json(['status' => 'success']);
    }
}
