import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';

function CheckStatusResultModal({ isOpen, onClose, result, error }) {
    if (!isOpen) return null;

    const isSuccess = result?.success;
    const data = result?.data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm m-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={`px-6 py-4 ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white text-2xl">
                            {isSuccess ? 'check_circle' : 'error'}
                        </span>
                        <h3 className="text-lg font-bold text-white">
                            {isSuccess ? 'Status Check Result' : 'Check Failed'}
                        </h3>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {isSuccess ? (
                        <>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-slate-500">Status</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${data?.current_status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                        data?.current_status === 'failed' ? 'bg-red-100 text-red-700' :
                                            data?.current_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                        }`}>
                                        {data?.current_status}
                                    </span>
                                </div>
                                {data?.status_changed && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Changed From</span>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{data?.previous_status}</span>
                                    </div>
                                )}
                                {data?.serial_number && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-500">Serial Number</span>
                                        <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{data?.serial_number}</span>
                                    </div>
                                )}
                                {data?.refunded && (
                                    <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                            <span className="material-symbols-outlined text-lg">undo</span>
                                            <span className="text-sm font-medium">Balance Refunded: {data?.refund_amount_formatted}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-slate-500">{result?.message}</p>
                        </>
                    ) : (
                        <p className="text-sm text-red-600 dark:text-red-400">{error || result?.message || 'Failed to check status'}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatusUpdateModal({ isOpen, onClose, transaction, onSuccess }) {
    const [status, setStatus] = useState(transaction?.status || 'pending');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(route('admin.transactions.update-status', transaction.id), {
                status,
                notes,
            });
            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md m-4 p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Update Transaction Status</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                        >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                            placeholder="Reason for status change..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminTransactionsIndex({ transactions, stats, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [selectedTx, setSelectedTx] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(null);
    const [checkResult, setCheckResult] = useState({ isOpen: false, result: null, error: null });


    const handleFilter = (key, value) => {
        router.get(route('admin.transactions.index'), {
            ...filters,
            [key]: value || undefined,
        }, { preserveState: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        handleFilter('search', search);
    };

    const handleCheckStatus = async (tx) => {
        setCheckingStatus(tx.id);
        try {
            const response = await axios.post(route('admin.transactions.check-status', tx.id));
            setCheckResult({ isOpen: true, result: response.data, error: null });
            if (response.data.data?.status_changed) {
                router.reload({ only: ['transactions', 'stats'] });
            }
        } catch (error) {
            setCheckResult({
                isOpen: true,
                result: null,
                error: error.response?.data?.message || 'Failed to check status'
            });
        } finally {
            setCheckingStatus(null);
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value);

    const statusStyles = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };

    return (
        <AdminLayout>
            <Head title="Semua Transaksi" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Transactions</h2>
                    <p className="text-slate-500">View and manage platform transactions</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Success</p>
                        <p className="text-2xl font-bold text-emerald-600">{stats.success}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Processing</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.processing || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Pending</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Failed</p>
                        <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Revenue</p>
                        <p className="text-xl font-bold text-primary">Rp {formatCurrency(stats.totalRevenue)}</p>
                    </div>
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
                                placeholder="Search by reference, user, or phone..."
                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                        </div>
                        <button type="submit" className="h-10 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">
                            Search
                        </button>
                    </form>
                    <div className="flex items-center gap-2 flex-wrap">
                        {['', 'pending', 'processing', 'success', 'failed', 'refunded'].map((s) => (
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
                                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    {transactions.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Reference</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Product</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Target</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {transactions.data.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-4 px-4">
                                                    <span className="text-sm font-mono text-primary">{tx.reference_number}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.user?.name}</p>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
                                                    {tx.product?.name}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {tx.phone_target}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                                    Rp {formatCurrency(tx.amount)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[tx.status]}`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-500">
                                                    {new Date(tx.created_at).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1">
                                                        {tx.status === 'processing' && (
                                                            <button
                                                                onClick={() => handleCheckStatus(tx)}
                                                                disabled={checkingStatus === tx.id}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                                title="Check API Status"
                                                            >
                                                                <span className={`material-symbols-outlined text-lg ${checkingStatus === tx.id ? 'animate-spin' : ''}`}>
                                                                    {checkingStatus === tx.id ? 'progress_activity' : 'refresh'}
                                                                </span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => { setSelectedTx(tx); setModalOpen(true); }}
                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                                            title="Update Status"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {transactions.last_page > 1 && (
                                <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
                                    {transactions.links.map((link, index) => (
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
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-[64px] text-slate-300">receipt_long</span>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 mt-4">No transactions found</h3>
                        </div>
                    )}
                </div>
            </div>

            <StatusUpdateModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setSelectedTx(null); }}
                transaction={selectedTx}
                onSuccess={() => router.reload({ only: ['transactions', 'stats'] })}
            />

            <CheckStatusResultModal
                isOpen={checkResult.isOpen}
                onClose={() => setCheckResult({ isOpen: false, result: null, error: null })}
                result={checkResult.result}
                error={checkResult.error}
            />
        </AdminLayout>
    );
}
