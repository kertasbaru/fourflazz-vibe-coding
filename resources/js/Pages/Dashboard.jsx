import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

function StatsCard({ icon, iconBg, title, value, change, changeType = 'positive' }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 group hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start">
                <div className={`p-3 ${iconBg} rounded-lg`}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                {change && (
                    <span className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full ${changeType === 'positive'
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                        }`}>
                        {change}
                        <span className="material-symbols-outlined text-[14px]">
                            {changeType === 'positive' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                    </span>
                )}
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
            </div>
        </div>
    );
}

function ProductCard({ product }) {
    return (
        <Link
            href={route('products.show', product.id)}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">{product.category?.icon || 'inventory_2'}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{product.name}</h4>
                    <p className="text-xs text-slate-500">{product.provider}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-primary">
                        Rp {new Intl.NumberFormat('id-ID').format(product.price)}
                    </p>
                </div>
            </div>
        </Link>
    );
}

function TransactionRow({ transaction }) {
    const statusColors = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };

    const statusDots = {
        pending: 'bg-amber-500',
        processing: 'bg-blue-500',
        success: 'bg-emerald-500',
        failed: 'bg-red-500',
        refunded: 'bg-purple-500',
    };

    return (
        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td className="py-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[16px]">
                            {transaction.product?.category?.icon || 'receipt'}
                        </span>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white block">
                            {transaction.product?.name || 'Produk Tidak Diketahui'}
                        </span>
                        <span className="text-xs text-slate-500">{transaction.phone_target}</span>
                    </div>
                </div>
            </td>
            <td className="py-4 px-2 text-sm text-slate-500">
                {new Date(transaction.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })}
            </td>
            <td className="py-4 px-2 text-sm font-medium text-slate-900 dark:text-white">
                Rp {new Intl.NumberFormat('id-ID').format(transaction.amount)}
            </td>
            <td className="py-4 px-2 text-right">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[transaction.status]}`}>
                    <span className={`size-1.5 rounded-full ${statusDots[transaction.status]}`}></span>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </span>
            </td>
        </tr>
    );
}

export default function Dashboard({ stats, recentTransactions, categories, popularProducts }) {
    const today = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <DashboardLayout>
            <Head title="Dasbor" />

            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Page Heading */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                            Selamat datang kembali! 👋
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Berikut yang terjadi dengan akun Anda hari ini.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        <span>{today}</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatsCard
                        icon="account_balance_wallet"
                        iconBg="bg-blue-50 dark:bg-blue-900/20 text-primary"
                        title="Saldo Anda"
                        value={stats.formattedBalance}
                    />
                    <StatsCard
                        icon="receipt_long"
                        iconBg="bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                        title="Total Transaksi"
                        value={stats.totalTransactions}
                    />
                    <StatsCard
                        icon="check_circle"
                        iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                        title="Transaksi Berhasil"
                        value={stats.successfulTransactions}
                    />
                </div>

                {/* Quick Categories */}
                {categories && categories.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Layanan</h3>
                            <Link
                                href={route('categories.index')}
                                className="text-sm font-semibold text-primary hover:text-blue-700 flex items-center gap-1"
                            >
                                Lihat Semua
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </Link>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-4 gap-3">
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={route('categories.show', category.id)}
                                    className="relative flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                                >
                                    {category.badge_label && (
                                        <span
                                            className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase text-white"
                                            style={{ backgroundColor: category.badge_color || '#EF4444' }}
                                        >
                                            {category.badge_label}
                                        </span>
                                    )}
                                    <span className="material-symbols-outlined text-primary text-[28px]">{category.icon || 'category'}</span>
                                    <span className="text-xs font-semibold text-center">{category.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Popular Products & Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Transactions */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transaksi Terbaru</h3>
                            <Link
                                href={route('transactions.index')}
                                className="text-sm font-semibold text-primary hover:text-blue-700"
                            >
                                Lihat Semua
                            </Link>
                        </div>
                        {recentTransactions && recentTransactions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-700">
                                            <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Produk</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Jumlah</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {recentTransactions.map((transaction) => (
                                            <TransactionRow key={transaction.id} transaction={transaction} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <span className="material-symbols-outlined text-[48px] mb-2">receipt_long</span>
                                <p>Belum ada transaksi</p>
                                <Link
                                    href={route('products.index')}
                                    className="text-primary font-medium hover:underline mt-2 inline-block"
                                >
                                    Jelajahi Produk
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Popular Products & Top Up Card */}
                    <div className="flex flex-col gap-6">
                        {/* Top Up Card */}
                        <div className="bg-primary rounded-xl p-6 text-white shadow-lg shadow-blue-500/30 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 size-24 bg-white/10 rounded-full blur-xl"></div>
                            <h3 className="text-lg font-bold mb-1 relative z-10">Top Up Saldo</h3>
                            <p className="text-blue-100 text-sm mb-6 relative z-10">
                                Tambah saldo ke akun Anda untuk membeli produk digital.
                            </p>
                            <Link
                                href={route('topup.index')}
                                className="w-full py-2.5 bg-white text-primary text-sm font-bold rounded-lg hover:bg-blue-50 transition-colors relative z-10 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Top Up Sekarang
                            </Link>
                        </div>

                        {/* Popular Products */}
                        {popularProducts && popularProducts.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Produk Populer</h3>
                                <div className="flex flex-col gap-3">
                                    {popularProducts.slice(0, 4).map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
