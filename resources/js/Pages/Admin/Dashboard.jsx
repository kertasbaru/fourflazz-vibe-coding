import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

function StatsCard({ icon, iconBg, title, value, subtitle }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`size-12 ${iconBg} rounded-xl flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[24px]">{icon}</span>
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
                    {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard({ stats, recentTransactions, chartData }) {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID').format(value);
    };

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400">Overview of your platform</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        icon="group"
                        iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                        title="Total Users"
                        value={stats.totalUsers}
                        subtitle={`+${stats.newUsersThisMonth} this month`}
                    />
                    <StatsCard
                        icon="inventory_2"
                        iconBg="bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                        title="Products"
                        value={stats.totalProducts}
                        subtitle={`${stats.activeProducts} active`}
                    />
                    <StatsCard
                        icon="receipt_long"
                        iconBg="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                        title="Transactions"
                        value={stats.totalTransactions}
                        subtitle={`${stats.successfulTransactions} successful`}
                    />
                    <StatsCard
                        icon="payments"
                        iconBg="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                        title="Total Revenue"
                        value={`Rp ${formatCurrency(stats.totalRevenue)}`}
                        subtitle={`Rp ${formatCurrency(stats.todayRevenue)} today`}
                    />
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatsCard
                        icon="category"
                        iconBg="bg-pink-50 dark:bg-pink-900/20 text-pink-600"
                        title="Categories"
                        value={stats.totalCategories}
                    />
                    <StatsCard
                        icon="account_balance_wallet"
                        iconBg="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                        title="Total Top-ups"
                        value={`Rp ${formatCurrency(stats.totalTopUps)}`}
                    />
                    <StatsCard
                        icon="pending"
                        iconBg="bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                        title="Pending Top-ups"
                        value={stats.pendingTopUps}
                    />
                </div>

                {/* Chart */}
                {chartData && chartData.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Last 7 Days</h3>
                        <div className="flex items-end gap-4 h-48">
                            {chartData.map((day, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-primary/20 rounded-t-lg relative"
                                        style={{ height: `${Math.max(10, (day.transactions / Math.max(...chartData.map(d => d.transactions))) * 100)}%` }}
                                    >
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg"
                                            style={{ height: '100%' }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500">{day.date}</span>
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{day.transactions}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Transactions</h3>
                    {recentTransactions && recentTransactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">User</th>
                                        <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Product</th>
                                        <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                                        <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                        <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {recentTransactions.map((transaction) => (
                                        <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="py-3 px-2">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {transaction.user?.name || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-sm text-slate-600 dark:text-slate-400">
                                                {transaction.product?.name || 'Unknown'}
                                            </td>
                                            <td className="py-3 px-2 text-sm font-semibold text-slate-900 dark:text-white">
                                                Rp {formatCurrency(transaction.amount)}
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${transaction.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    transaction.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-sm text-slate-500">
                                                {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center py-8 text-slate-500">No transactions yet</p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
