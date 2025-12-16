import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminTransactionsIndex({ transactions, stats, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

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
            <Head title="All Transactions" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Transactions</h2>
                    <p className="text-slate-500">View all platform transactions</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Success</p>
                        <p className="text-2xl font-bold text-emerald-600">{stats.success}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Pending</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Failed</p>
                        <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 md:col-span-1 col-span-2">
                        <p className="text-sm text-slate-500">Total Revenue</p>
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
                    <div className="flex items-center gap-2">
                        {['', 'pending', 'processing', 'success', 'failed'].map((s) => (
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
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Profit</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
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
                                                    <p className="text-xs text-slate-500">{tx.user?.email}</p>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {tx.product?.name}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {tx.phone_target}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                                    Rp {formatCurrency(tx.amount)}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-semibold text-emerald-600">
                                                    +Rp {formatCurrency(tx.profit)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[tx.status]}`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-500">
                                                    {new Date(tx.created_at).toLocaleDateString('id-ID')}
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
        </AdminLayout>
    );
}
