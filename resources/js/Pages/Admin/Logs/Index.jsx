import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

function LogEntry({ log }) {
    const [expanded, setExpanded] = useState(false);

    const levelColors = {
        emergency: 'bg-red-600 text-white',
        alert: 'bg-red-500 text-white',
        critical: 'bg-red-500 text-white',
        error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        notice: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        info: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        debug: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    };

    const levelIcons = {
        emergency: 'emergency',
        alert: 'notifications_active',
        critical: 'crisis_alert',
        error: 'error',
        warning: 'warning',
        notice: 'info',
        info: 'info',
        debug: 'bug_report',
    };

    // Truncate message for preview
    const previewMessage = log.message.length > 150
        ? log.message.substring(0, 150) + '...'
        : log.message;

    return (
        <div
            className={`border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${expanded ? 'bg-slate-50 dark:bg-slate-800/50' : ''
                }`}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="px-4 py-3 flex items-start gap-3">
                <span className="material-symbols-outlined text-slate-400 text-lg mt-0.5">
                    {expanded ? 'expand_less' : 'expand_more'}
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${levelColors[log.level] || levelColors.debug}`}>
                            <span className="material-symbols-outlined text-sm">{levelIcons[log.level] || 'info'}</span>
                            {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500">{log.timestamp}</span>
                    </div>
                    <p className={`text-sm text-slate-700 dark:text-slate-300 ${expanded ? '' : 'truncate'}`}>
                        {expanded ? '' : previewMessage}
                    </p>
                </div>
            </div>
            {expanded && (
                <div className="px-12 pb-4">
                    <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-96">
                        {log.message}
                    </pre>
                </div>
            )}
        </div>
    );
}

export default function LogsIndex({ logs, filters, stats }) {
    const [filterLevel, setFilterLevel] = useState(filters.level || 'all');
    const [search, setSearch] = useState(filters.search || '');
    const [clearing, setClearing] = useState(false);

    const applyFilters = () => {
        router.get(route('admin.logs.index'), {
            level: filterLevel !== 'all' ? filterLevel : undefined,
            search: search || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setFilterLevel('all');
        setSearch('');
        router.get(route('admin.logs.index'));
    };

    const handleClearLogs = () => {
        if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) return;

        setClearing(true);
        router.post(route('admin.logs.clear'), {}, {
            onFinish: () => setClearing(false),
        });
    };

    const handleDownload = () => {
        window.location.href = route('admin.logs.download');
    };

    return (
        <AdminLayout>
            <Head title="Log Sistem" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Logs</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            View application logs including emails

                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">File size: {stats.fileSize}</span>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">download</span>
                            Download
                        </button>
                        <button
                            onClick={handleClearLogs}
                            disabled={clearing}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                            {clearing ? 'Clearing...' : 'Clear Logs'}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                placeholder="Search in logs..."
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Level</label>
                            <select
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                            >
                                <option value="all">All Levels</option>
                                <option value="emergency">Emergency</option>
                                <option value="alert">Alert</option>
                                <option value="critical">Critical</option>
                                <option value="error">Error</option>
                                <option value="warning">Warning</option>
                                <option value="notice">Notice</option>
                                <option value="info">Info</option>
                                <option value="debug">Debug</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={applyFilters}
                                className="h-9 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">search</span>
                                Search
                            </button>
                            <button
                                onClick={clearFilters}
                                className="h-9 px-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logs List */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Showing {logs.length} log entries
                        </span>
                        <button
                            onClick={() => router.reload()}
                            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                        >
                            <span className="material-symbols-outlined text-lg">refresh</span>
                            Refresh
                        </button>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                        {logs.length > 0 ? (
                            logs.map((log, index) => (
                                <LogEntry key={index} log={log} />
                            ))
                        ) : (
                            <div className="px-4 py-12 text-center text-slate-500">
                                <span className="material-symbols-outlined text-4xl mb-2">description</span>
                                <p>No log entries found</p>
                                <p className="text-sm">Logs will appear here when generated by the application</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-blue-600">info</span>
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                            <p className="font-medium mb-1">Email Logging</p>
                            <p>When <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">MAIL_MAILER=log</code> is set, all emails are written to this log instead of being sent. Search for "Mail" to find email content.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
