<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WebhookLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WebhookLogController extends Controller
{
    public function index(Request $request)
    {
        $query = WebhookLog::query()->latest();

        // Filter by type
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        // Filter by success/fail
        if ($request->has('status')) {
            if ($request->status === 'success') {
                $query->where('success', true);
            } elseif ($request->status === 'failed') {
                $query->where('success', false);
            }
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('endpoint', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
            });
        }

        $logs = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/WebhookLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['type', 'status', 'search']),
        ]);
    }

    public function show(WebhookLog $log)
    {
        return Inertia::render('Admin/WebhookLogs/Show', [
            'log' => $log,
        ]);
    }
}
