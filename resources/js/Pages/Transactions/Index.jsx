import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function TransactionsIndex({ transactions, stats, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = (key, value) => {
        router.get(route('transactions.index'), {
            ...filters,
            [key]: value || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        handleFilter('search', search);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID').format(value);
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        };
        const dots = {
            pending: 'bg-amber-500',
            processing: 'bg-blue-500',
            success: 'bg-emerald-500',
            failed: 'bg-red-500',
            refunded: 'bg-purple-500',
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                <span className={`size-1.5 rounded-full ${dots[status]}`}></span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <DashboardLayout>
            <Head title="Transaksi" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Transaksi</h2>
                        <p className="text-slate-500 dark:text-slate-400">Lihat riwayat transaksi Anda</p>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari berdasarkan ref atau HP..."
                                className="w-full md:w-64 h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 text-slate-900 dark:text-white"
                            />
                        </div>
                        <button
                            type="submit"
                            className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            Cari
                        </button>
                    </form>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Berhasil</p>
                        <p className="text-2xl font-bold text-emerald-600">{stats.success}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Menunggu</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Gagal</p>
                        <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 font-medium">Status:</span>
                    {['', 'pending', 'processing', 'success', 'failed'].map((s) => (
                        <button
                            key={s}
                            onClick={() => {
                                setStatus(s);
                                handleFilter('status', s);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${status === s
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Semua'}
                        </button>
                    ))}
                </div>

                {/* Transactions Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    {transactions.data && transactions.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Referensi</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Produk</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Tujuan</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Jumlah</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {transactions.data.map((transaction) => (
                                            <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-4 px-4">
                                                    <span className="text-sm font-mono text-primary">{transaction.reference_number}</span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-primary text-[16px]">
                                                                {transaction.product?.category?.icon || 'receipt'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {transaction.product?.name || 'Tidak Diketahui'}
                                                            </p>
                                                            <p className="text-xs text-slate-500">{transaction.product?.provider}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {transaction.phone_target}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                                    Rp {formatCurrency(transaction.amount)}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-500">
                                                    {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    {getStatusBadge(transaction.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {transactions.last_page > 1 && (
                                <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
                                    {transactions.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${link.active
                                                ? 'bg-primary text-white'
                                                : link.url
                                                    ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-[64px] text-slate-300 dark:text-slate-600 mb-4">receipt_long</span>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Transaksi tidak ditemukan</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-4">
                                {filters.search || filters.status ? 'Coba sesuaikan filter Anda' : 'Mulai dengan membeli produk'}
                            </p>
                            <Link
                                href={route('products.index')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                                Jelajahi Produk
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
