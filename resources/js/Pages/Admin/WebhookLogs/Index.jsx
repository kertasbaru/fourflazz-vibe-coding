import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function WebhookLogsIndex({ logs, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = (key, value) => {
        router.get(route('admin.webhook-logs.index'), {
            ...filters,
            [key]: value || undefined,
        }, { preserveState: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        handleFilter('search', search);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('id-ID');
    };

    const statusStyles = {
        true: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        false: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <AdminLayout>
            <Head title="Log Webhook" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Log Webhook</h2>
                    <p className="text-slate-500">Monitoring semua request dan response webhook MacroDroid</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari IP, endpoint, type..."
                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                        </div>
                        <button type="submit" className="h-10 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
                            Cari
                        </button>
                    </form>
                    <div className="flex items-center gap-2 flex-wrap">
                        {['', 'success', 'failed'].map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    setStatus(s);
                                    handleFilter('status', s);
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium ${status === s
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                {s === '' ? 'Semua' : s === 'success' ? 'Berhasil' : 'Gagal'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Waktu</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">IP</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Request</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Response</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{log.ip_address}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[log.success]}`}>
                                                    {log.success ? 'Berhasil' : 'Gagal'}
                                                </span>
                                                <span className="text-xs text-slate-500">{log.response_status}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                                {JSON.stringify(log.request_data).substring(0, 50)}...
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                                {log.response_data ? JSON.stringify(log.response_data).substring(0, 50) + '...' : '-'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Link
                                                href={route('admin.webhook-logs.show', log.id)}
                                                className="text-primary hover:underline text-sm font-medium"
                                            >
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-slate-500">
                                            Tidak ada log webhook ditemukan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {logs.links && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {logs.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`px-3 py-1.5 rounded text-sm font-medium ${link.active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
