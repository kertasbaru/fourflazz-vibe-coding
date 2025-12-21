import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function WebhookLogsShow({ log }) {
    const formatDate = (date) => {
        return new Date(date).toLocaleString('id-ID');
    };

    return (
        <AdminLayout>
            <Head title="Detail Log Webhook" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('admin.webhook-logs.index')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Detail Log Webhook</h2>
                        <p className="text-slate-500">ID: {log.id}</p>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Tipe</p>
                            <p className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">{log.type}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Status</p>
                            <p className={`font-medium text-sm px-2 py-1 rounded inline-block ${log.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {log.success ? 'Berhasil' : 'Gagal'} ({log.response_status})
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">IP Address</p>
                            <p className="font-mono text-sm">{log.ip_address}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Waktu</p>
                            <p className="text-sm">{formatDate(log.created_at)}</p>
                        </div>
                    </div>
                </div>

                {/* Request Data */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">input</span>
                            Request Data
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">Endpoint</p>
                                <p className="font-mono text-sm bg-slate-100 dark:bg-slate-900 p-3 rounded">{log.method} /{log.endpoint}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">User Agent</p>
                                <p className="font-mono text-sm bg-slate-100 dark:bg-slate-900 p-3 rounded break-all">{log.user_agent || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">Request Body</p>
                                <pre className="font-mono text-xs bg-slate-100 dark:bg-slate-900 p-4 rounded overflow-x-auto">
                                    {JSON.stringify(log.request_data, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">Headers</p>
                                <pre className="font-mono text-xs bg-slate-100 dark:bg-slate-900 p-4 rounded overflow-x-auto max-h-64 overflow-y-auto">
                                    {JSON.stringify(log.headers, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Response Data */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-600">output</span>
                            Response Data
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {log.error_message && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">Error Message</p>
                                    <p className="text-sm text-red-600 dark:text-red-300">{log.error_message}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-2">Response Body</p>
                                <pre className="font-mono text-xs bg-slate-100 dark:bg-slate-900 p-4 rounded overflow-x-auto">
                                    {log.response_data ? JSON.stringify(log.response_data, null, 2) : 'No response data'}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
