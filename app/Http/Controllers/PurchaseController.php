<?php

namespace App\Http\Controllers;

use App\Models\OtpSession;
use App\Models\Product;
use App\Models\Transaction;
use App\Services\KmspService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PurchaseController extends Controller
{
    protected KmspService $kmspService;

    public function __construct(KmspService $kmspService)
    {
        $this->kmspService = $kmspService;
    }

    /**
     * Initiate a product purchase.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'phone' => 'required|string|regex:/^628[0-9]{8,12}$/',
            'otp_session_id' => 'nullable|integer',
            'payment_method' => 'nullable|string|in:BALANCE,DANA,QRIS,GOPAY,SHOPEEPAY,OVO',
            'ewallet_number' => 'nullable|string|regex:/^08[0-9]{8,12}$/',
        ]);

        $user = Auth::user();
        $product = Product::findOrFail($request->input('product_id'));
        $phone = $request->input('phone');

        // Check if product is active
        if (!$product->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This product is not available for purchase.',
            ], 400);
        }

        // Check if product is from KMSP
        if ($product->api_source !== 'kmsp') {
            return response()->json([
                'success' => false,
                'message' => 'Purchase is only supported for KMSP products at this time.',
            ], 400);
        }

        // Check if product requires OTP
        $metadata = $product->api_metadata ?? [];
        $requiresOtp = !($metadata['no_need_login'] ?? false);

        $accessToken = null;
        $paymentMethod = $request->input('payment_method', 'BALANCE');

        if ($requiresOtp) {
            // OTP session is required
            $sessionId = $request->input('otp_session_id');

            if (!$sessionId) {
                return response()->json([
                    'success' => false,
                    'message' => 'This product requires an active OTP session. Please login with OTP first.',
                    'requires_otp' => true,
                ], 400);
            }

            $session = OtpSession::where('id', $sessionId)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'OTP session not found or inactive. Please login again.',
                    'requires_otp' => true,
                ], 400);
            }

            $accessToken = $session->formatted_token;

            if (!$accessToken) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid session. Please login again with OTP.',
                    'requires_otp' => true,
                ], 400);
            }
        }

        // Check user balance (if using balance payment)
        if ($paymentMethod === 'BALANCE' && $user->balance < $product->selling_price) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient balance. Please top up your account.',
                'required_balance' => $product->selling_price,
                'current_balance' => $user->balance,
            ], 400);
        }

        DB::beginTransaction();

        try {
            // Create transaction record
            $referenceNumber = Transaction::generateReferenceNumber();
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'reference_number' => $referenceNumber,
                'phone_target' => $phone,
                'amount' => $product->selling_price,
                'profit' => $product->selling_price - $product->price,
                'status' => 'pending',
                'notes' => json_encode([
                    'api_source' => 'kmsp',
                    'external_code' => $product->external_code,
                    'requires_otp' => $requiresOtp,
                    'payment_method' => $paymentMethod,
                ]),
            ]);

            // Deduct balance if using balance payment
            if ($paymentMethod === 'BALANCE') {
                $user->decrement('balance', (float) $product->selling_price);
            }

            // Call KMSP API to purchase
            if ($requiresOtp) {
                $result = $this->kmspService->purchaseWithOtp(
                    $product->external_code,
                    $phone,
                    $accessToken,
                    $paymentMethod,
                    (float) $product->price,
                    $request->input('ewallet_number')
                );
            } else {
                $result = $this->kmspService->purchaseWithoutOtp(
                    $product->external_code,
                    $phone,
                    (float) $product->price
                );
            }

            if (!$result['success']) {
                // Refund balance if purchase failed
                if ($paymentMethod === 'BALANCE') {
                    $user->increment('balance', (float) $product->selling_price);
                }

                $transaction->update([
                    'status' => 'failed',
                    'notes' => json_encode([
                        'api_source' => 'kmsp',
                        'external_code' => $product->external_code,
                        'requires_otp' => $requiresOtp,
                        'payment_method' => $paymentMethod,
                        'error' => $result['message'],
                    ]),
                ]);

                DB::commit();

                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                    'transaction_id' => $transaction->id,
                ], 400);
            }

            // Update transaction with API response
            $apiData = $result['data'];
            $transaction->update([
                'status' => 'processing',
                'provider_response' => json_encode($apiData),
                'notes' => json_encode([
                    'api_source' => 'kmsp',
                    'external_code' => $product->external_code,
                    'requires_otp' => $requiresOtp,
                    'payment_method' => $paymentMethod,
                    'trx_id' => $apiData['trx_id'] ?? null,
                ]),
            ]);

            DB::commit();

            $response = [
                'success' => true,
                'message' => $result['message'],
                'transaction_id' => $transaction->id,
                'transaction_code' => $transaction->reference_number,
                'data' => [
                    'trx_id' => $apiData['trx_id'] ?? null,
                    'package_name' => $apiData['package_name'] ?? null,
                    'msisdn' => $apiData['msisdn'] ?? null,
                ],
            ];

            // Add deeplink or QRIS data if present
            if ($apiData['have_deeplink'] ?? false) {
                $response['data']['deeplink'] = $apiData['deeplink_data'] ?? [];
            }

            if ($apiData['is_qris'] ?? false) {
                $response['data']['qris'] = $apiData['qris_data'] ?? [];
            }

            return response()->json($response);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Purchase error', [
                'user_id' => $user->id,
                'product_id' => $product->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your purchase. Please try again.',
            ], 500);
        }
    }

    /**
     * Get purchase requirements for a product.
     */
    public function requirements(Product $product): JsonResponse
    {
        if ($product->api_source !== 'kmsp') {
            return response()->json([
                'success' => false,
                'message' => 'Purchase requirements only available for KMSP products.',
            ], 400);
        }

        $metadata = $product->api_metadata ?? [];
        $requiresOtp = !($metadata['no_need_login'] ?? false);

        $activeSessions = [];
        if ($requiresOtp) {
            $activeSessions = OtpSession::where('user_id', Auth::id())
                ->where('provider', 'kmsp')
                ->where('is_active', true)
                ->get()
                ->map(fn($s) => [
                    'id' => $s->id,
                    'phone' => $s->phone,
                    'masked_phone' => $s->masked_phone,
                ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'requires_otp' => $requiresOtp,
                'active_sessions' => $activeSessions,
                'available_payment_methods' => $metadata['available_payment_methods'] ?? ['BALANCE'],
                'price' => $product->selling_price,
                'price_formatted' => $product->formatted_price,
            ],
        ]);
    }
}
