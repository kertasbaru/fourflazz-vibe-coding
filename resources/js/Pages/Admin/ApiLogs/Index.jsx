import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

function StatCard({ label, value, color, icon }) {
    const colors = {
        blue: 'bg-blue-500',
        emerald: 'bg-emerald-500',
        red: 'bg-red-500',
        amber: 'bg-amber-500',
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
                <div className={`size-10 ${colors[color]} rounded-lg flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-white">{icon}</span>
                </div>
                <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

function LogRow({ log }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr
                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <td className="px-4 py-3">
                    <span className="material-symbols-outlined text-slate-400 text-lg">
                        {expanded ? 'expand_less' : 'expand_more'}
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{log.created_at}</td>
                <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.provider === 'kmsp'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                        {log.provider.toUpperCase()}
                    </span>
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${log.method === 'POST'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                            }`}>
                            {log.method}
                        </span>
                        <span className="text-sm text-slate-900 dark:text-white font-mono truncate max-w-[200px]">
                            {log.endpoint}
                        </span>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${log.success
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {log.success ? 'Success' : 'Failed'}
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {log.response_code || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {log.response_time || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {log.user}
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                    <td colSpan="8" className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Request Data</h4>
                                <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto max-h-48">
                                    {log.request_data ? JSON.stringify(log.request_data, null, 2) : 'No request data'}
                                </pre>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Response Data</h4>
                                <pre className="text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto max-h-48">
                                    {log.response_data ? JSON.stringify(log.response_data, null, 2) : 'No response data'}
                                </pre>
                            </div>
                        </div>
                        {log.error_message && (
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold text-red-500 uppercase mb-2">Error Message</h4>
                                <p className="text-sm text-red-600 dark:text-red-400">{log.error_message}</p>
                            </div>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

export default function ApiLogsIndex({ logs, stats, providers, users, filters }) {
    const [filterProvider, setFilterProvider] = useState(filters.provider || '');
    const [filterStatus, setFilterStatus] = useState(filters.status || '');
    const [filterUser, setFilterUser] = useState(filters.user || '');
    const [filterFrom, setFilterFrom] = useState(filters.from || '');
    const [filterTo, setFilterTo] = useState(filters.to || '');

    const applyFilters = () => {
        router.get(route('admin.api-logs.index'), {
            provider: filterProvider || undefined,
            status: filterStatus || undefined,
            user: filterUser || undefined,
            from: filterFrom || undefined,
            to: filterTo || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setFilterProvider('');
        setFilterStatus('');
        setFilterUser('');
        setFilterFrom('');
        setFilterTo('');
        router.get(route('admin.api-logs.index'));
    };

    return (
        <AdminLayout>
            <Head title="Log API" />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API Logs</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Monitor all external API calls to KMSP and KAJE providers
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Calls" value={stats.total} color="blue" icon="api" />
                    <StatCard label="Successful" value={stats.successful} color="emerald" icon="check_circle" />
                    <StatCard label="Failed" value={stats.failed} color="red" icon="error" />
                    <StatCard label="Today" value={stats.today} color="amber" icon="today" />
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-slate-500">filter_alt</span>
                        <h3 className="font-semibold text-slate-900 dark:text-white">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Provider</label>
                            <select
                                value={filterProvider}
                                onChange={(e) => setFilterProvider(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                            >
                                <option value="">All Providers</option>
                                {providers.map(p => (
                                    <option key={p} value={p}>{p.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                            >
                                <option value="">All Status</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">User</label>
                            <select
                                value={filterUser}
                                onChange={(e) => setFilterUser(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                            >
                                <option value="">All Users</option>
                                {users && users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                            <input
                                type="date"
                                value={filterFrom}
                                onChange={(e) => setFilterFrom(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                            <input
                                type="date"
                                value={filterTo}
                                onChange={(e) => setFilterTo(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={applyFilters}
                            className="h-9 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">search</span>
                            Apply Filters
                        </button>
                        <button
                            onClick={clearFilters}
                            className="h-9 px-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">clear</span>
                            Clear
                        </button>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    <th className="px-4 py-3 w-10"></th>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Provider</th>
                                    <th className="px-4 py-3">Endpoint</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Duration</th>
                                    <th className="px-4 py-3">User</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {logs.data.length > 0 ? (
                                    logs.data.map(log => <LogRow key={log.id} log={log} />)
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-12 text-center text-slate-500">
                                            <span className="material-symbols-outlined text-4xl mb-2">description</span>
                                            <p>No API logs found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-500">
                                Showing {logs.from} to {logs.to} of {logs.total} results
                            </p>
                            <div className="flex gap-1">
                                {logs.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1 rounded text-sm ${link.active
                                            ? 'bg-primary text-white'
                                            : link.url
                                                ? 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                                : 'text-slate-400 cursor-not-allowed'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
