<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class LogController extends Controller
{
    /**
     * Display the log viewer.
     */
    public function index(Request $request): Response
    {
        $logFile = storage_path('logs/laravel.log');
        $logs = [];
        $rawContent = '';

        if (File::exists($logFile)) {
            // Get file size
            $fileSize = File::size($logFile);

            // Read last portion of the file (max 500KB to avoid memory issues)
            $maxBytes = 500 * 1024;
            $content = '';

            if ($fileSize > $maxBytes) {
                $handle = fopen($logFile, 'r');
                fseek($handle, -$maxBytes, SEEK_END);
                $content = fread($handle, $maxBytes);
                fclose($handle);
                // Remove first incomplete line
                $content = substr($content, strpos($content, "\n") + 1);
            } else {
                $content = File::get($logFile);
            }

            $rawContent = $content;

            // Parse log entries
            $pattern = '/\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^\]]*)\]\s+(\w+)\.(\w+):\s+(.*?)(?=\[\d{4}-\d{2}-\d{2}|\z)/s';
            preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

            foreach ($matches as $match) {
                $logs[] = [
                    'timestamp' => $match[1],
                    'environment' => $match[2],
                    'level' => strtolower($match[3]),
                    'message' => trim($match[4]),
                ];
            }

            // Reverse to show newest first
            $logs = array_reverse($logs);

            // Limit to last 200 entries
            $logs = array_slice($logs, 0, 200);
        }

        // Filter by level if specified
        $filterLevel = $request->get('level');
        if ($filterLevel && $filterLevel !== 'all') {
            $logs = array_filter($logs, fn($log) => $log['level'] === $filterLevel);
            $logs = array_values($logs);
        }

        // Search in messages
        $search = $request->get('search');
        if ($search) {
            $logs = array_filter(
                $logs,
                fn($log) =>
                stripos($log['message'], $search) !== false ||
                stripos($log['timestamp'], $search) !== false
            );
            $logs = array_values($logs);
        }

        return Inertia::render('Admin/Logs/Index', [
            'logs' => $logs,
            'filters' => [
                'level' => $filterLevel ?? 'all',
                'search' => $search ?? '',
            ],
            'stats' => [
                'total' => count($logs),
                'fileSize' => isset($fileSize) ? $this->formatBytes($fileSize) : '0 B',
            ],
        ]);
    }

    /**
     * Clear the log file.
     */
    public function clear(Request $request)
    {
        $logFile = storage_path('logs/laravel.log');

        if (File::exists($logFile)) {
            File::put($logFile, '');
        }

        return back()->with('success', 'Log file cleared successfully.');
    }

    /**
     * Download the log file.
     */
    public function download()
    {
        $logFile = storage_path('logs/laravel.log');

        if (!File::exists($logFile)) {
            return back()->with('error', 'Log file not found.');
        }

        return response()->download($logFile, 'laravel-' . date('Y-m-d-His') . '.log');
    }

    /**
     * Format bytes to human readable.
     */
    private function formatBytes($bytes, $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        return round($bytes / pow(1024, $pow), $precision) . ' ' . $units[$pow];
    }
}
