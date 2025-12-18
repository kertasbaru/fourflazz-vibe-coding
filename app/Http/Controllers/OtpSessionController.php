<?php

namespace App\Http\Controllers;

use App\Models\OtpSession;
use App\Services\KmspService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class OtpSessionController extends Controller
{
    protected KmspService $kmspService;

    public function __construct(KmspService $kmspService)
    {
        $this->kmspService = $kmspService;
    }

    /**
     * Display list of user's OTP sessions.
     */
    public function index(): Response
    {
        $sessions = OtpSession::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($session) {
                return [
                    'id' => $session->id,
                    'provider' => $session->provider,
                    'phone' => $session->phone,
                    'masked_phone' => $session->masked_phone,
                    'is_active' => $session->is_active,
                    'is_expired' => $session->isExpired(),
                    'can_extend' => $session->canExtend(),
                    'expires_at' => $session->expires_at?->toIso8601String(),
                    'last_extended_at' => $session->last_extended_at?->toIso8601String(),
                    'created_at' => $session->created_at->toIso8601String(),
                ];
            });

        return Inertia::render('OtpSessions/Index', [
            'sessions' => $sessions,
            'isAdmin' => Auth::user()->is_admin ?? false,
        ]);
    }

    /**
     * Request OTP for a phone number.
     */
    public function requestOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string|regex:/^628[0-9]{8,12}$/',
            'provider' => 'required|in:kmsp,kaje',
        ]);

        $phone = $request->input('phone');
        $provider = $request->input('provider');

        // Only KMSP is supported for now
        if ($provider !== 'kmsp') {
            return response()->json([
                'success' => false,
                'message' => 'OTP login is only supported for KMSP provider at this time.',
            ], 400);
        }

        // Check if there's an existing pending OTP request
        $existingSession = OtpSession::where('user_id', Auth::id())
            ->where('provider', $provider)
            ->where('phone', $phone)
            ->where('is_active', false)
            ->whereNotNull('auth_id')
            ->where('otp_requested_at', '>', now()->subMinutes(5))
            ->first();

        if ($existingSession) {
            return response()->json([
                'success' => false,
                'message' => 'OTP already requested for this number. Please wait before requesting again.',
                'can_resend_in' => 60 - now()->diffInSeconds($existingSession->otp_requested_at),
            ], 400);
        }

        // Request OTP
        $result = $this->kmspService->requestOtp($phone);

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        // Create or update session record
        $session = OtpSession::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'provider' => $provider,
                'phone' => $phone,
                'is_active' => false,
            ],
            [
                'auth_id' => $result['data']['auth_id'],
                'otp_requested_at' => now(),
                'access_token' => null,
                'session_id' => null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'session_id' => $session->id,
                'can_resend_in' => $result['data']['can_resend_in'] ?? 60,
            ],
        ]);
    }

    /**
     * Verify OTP and complete login.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => 'required|integer',
            'otp' => 'required|string|size:6',
        ]);

        $session = OtpSession::where('id', $request->input('session_id'))
            ->where('user_id', Auth::id())
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found.',
            ], 404);
        }

        if (!$session->auth_id) {
            return response()->json([
                'success' => false,
                'message' => 'No OTP request found. Please request OTP first.',
            ], 400);
        }

        // Verify OTP
        $result = $this->kmspService->loginOtp(
            $session->phone,
            $session->auth_id,
            $request->input('otp')
        );

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        // Update session with access token
        $session->update([
            'session_id' => $result['data']['session_id'],
            'access_token' => $result['data']['token'],
            'is_active' => true,
            'auth_id' => null, // Clear auth_id after successful login
            'last_extended_at' => now(),
            'expires_at' => now()->addDays(7), // Sessions typically last about a week
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful! Session is now active.',
            'data' => [
                'session_id' => $session->id,
            ],
        ]);
    }

    /**
     * Extend an active session.
     */
    public function extend(Request $request, OtpSession $session): JsonResponse
    {
        // Check ownership
        if ($session->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found.',
            ], 404);
        }

        if (!$session->canExtend()) {
            return response()->json([
                'success' => false,
                'message' => 'This session cannot be extended. Please login again with OTP.',
            ], 400);
        }

        // Extend session
        $result = $this->kmspService->extendSession(
            $session->phone,
            $session->session_id,
            $session->access_token
        );

        if (!$result['success']) {
            // Mark session as inactive if extension fails
            $session->update(['is_active' => false]);

            return response()->json([
                'success' => false,
                'message' => $result['message'] . ' Session has been deactivated.',
            ], 400);
        }

        // Update session with new token
        $session->update([
            'session_id' => $result['data']['session_id'],
            'access_token' => $result['data']['token'],
            'last_extended_at' => now(),
            'expires_at' => now()->addDays(7),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Session extended successfully!',
        ]);
    }

    /**
     * Sync sessions from KMSP API.
     */
    public function sync(Request $request): JsonResponse
    {
        $result = $this->kmspService->getAccessTokens();

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        $apiSessions = $result['data'] ?? [];
        $synced = 0;

        foreach ($apiSessions as $apiSession) {
            $existingSession = OtpSession::where('user_id', Auth::id())
                ->where('provider', 'kmsp')
                ->where('phone', $apiSession['msisdn'])
                ->where('session_id', (string) $apiSession['session_id'])
                ->first();

            if (!$existingSession) {
                // Create new session from API data
                OtpSession::create([
                    'user_id' => Auth::id(),
                    'provider' => 'kmsp',
                    'phone' => $apiSession['msisdn'],
                    'session_id' => (string) $apiSession['session_id'],
                    'access_token' => $apiSession['token'],
                    'is_active' => true,
                    'last_extended_at' => now(),
                    'expires_at' => now()->addDays(7),
                ]);
                $synced++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Synced {$synced} session(s) from KMSP.",
            'total_api_sessions' => count($apiSessions),
        ]);
    }

    /**
     * Delete a session.
     */
    public function destroy(OtpSession $session): JsonResponse
    {
        if ($session->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found.',
            ], 404);
        }

        $session->delete();

        return response()->json([
            'success' => true,
            'message' => 'Session removed successfully.',
        ]);
    }
}
