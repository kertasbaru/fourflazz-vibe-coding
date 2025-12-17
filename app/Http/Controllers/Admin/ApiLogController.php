<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApiLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApiLogController extends Controller
{
    /**
     * Display list of API logs.
     */
    public function index(Request $request): Response
    {
        $query = ApiLog::query()->with('user:id,name')->latest();

        // Filter by provider
        if ($request->filled('provider')) {
            $query->where('provider', $request->provider);
        }

        // Filter by success status
        if ($request->filled('status')) {
            $query->where('success', $request->status === 'success');
        }

        // Filter by date range
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $logs = $query->paginate(50)->through(function ($log) {
            return [
                'id' => $log->id,
                'provider' => $log->provider,
                'endpoint' => $log->endpoint,
                'method' => $log->method,
                'request_data' => $log->masked_request_data,
                'response_data' => $log->response_data,
                'response_code' => $log->response_code,
                'success' => $log->success,
                'error_message' => $log->error_message,
                'response_time' => $log->response_time ? round($log->response_time * 1000) . 'ms' : null,
                'user' => $log->user ? $log->user->name : 'System',
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
            ];
        });

        // Get stats
        $stats = [
            'total' => ApiLog::count(),
            'successful' => ApiLog::where('success', true)->count(),
            'failed' => ApiLog::where('success', false)->count(),
            'today' => ApiLog::whereDate('created_at', today())->count(),
        ];

        // Get providers for filter
        $providers = ApiLog::distinct('provider')->pluck('provider');

        return Inertia::render('Admin/ApiLogs/Index', [
            'logs' => $logs,
            'stats' => $stats,
            'providers' => $providers,
            'filters' => $request->only(['provider', 'status', 'from', 'to']),
        ]);
    }

    /**
     * Show details of a specific log.
     */
    public function show(ApiLog $log): Response
    {
        return Inertia::render('Admin/ApiLogs/Show', [
            'log' => [
                'id' => $log->id,
                'provider' => $log->provider,
                'endpoint' => $log->endpoint,
                'method' => $log->method,
                'request_data' => $log->masked_request_data,
                'response_data' => $log->response_data,
                'response_code' => $log->response_code,
                'success' => $log->success,
                'error_message' => $log->error_message,
                'response_time' => $log->response_time,
                'user' => $log->user,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }
}
