import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminUserShow({ user, recentTransactions, recentTopUps }) {
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const { data, setData, post, processing } = useForm({
        amount: '',
        type: 'add',
        notes: '',
    });

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value);

    const handleBalanceAdjust = (e) => {
        e.preventDefault();
        post(route('admin.users.adjust-balance', user.id), {
            onSuccess: () => {
                setShowBalanceModal(false);
                setData({ amount: '', type: 'add', notes: '' });
            }
        });
    };

    return (
        <AdminLayout>
            <Head title={`User: ${user.name}`} />

            <div className="max-w-5xl mx-auto flex flex-col gap-6">
                <nav className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href={route('admin.users.index')} className="hover:text-primary">Users</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-slate-900 dark:text-white">{user.name}</span>
                </nav>

                {/* User Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="size-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                            <p className="text-slate-500">{user.email}</p>
                            {user.phone && <p className="text-slate-500">{user.phone}</p>}
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                    }`}>
                                    {user.role}
                                </span>
                                <span className="text-xs text-slate-400">
                                    Joined {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <p className="text-sm text-slate-500">Balance</p>
                            <p className="text-3xl font-bold text-primary">Rp {formatCurrency(user.balance)}</p>
                            <button
                                onClick={() => setShowBalanceModal(true)}
                                className="px-4 py-2 bg-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                            >
                                Adjust Balance
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Transactions */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Transactions</h3>
                        {recentTransactions && recentTransactions.length > 0 ? (
                            <div className="space-y-3">
                                {recentTransactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.product?.name}</p>
                                            <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString('id-ID')}</p>
                                        </div>
                                        <p className="text-sm font-semibold">Rp {formatCurrency(tx.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center py-4 text-slate-500">No transactions</p>
                        )}
                    </div>

                    {/* Recent Top-ups */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Top-ups</h3>
                        {recentTopUps && recentTopUps.length > 0 ? (
                            <div className="space-y-3">
                                {recentTopUps.map((topup) => (
                                    <div key={topup.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">Rp {formatCurrency(topup.amount)}</p>
                                            <p className="text-xs text-slate-500">{new Date(topup.created_at).toLocaleDateString('id-ID')}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${topup.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                topup.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {topup.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center py-4 text-slate-500">No top-ups</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Balance Adjustment Modal */}
            {showBalanceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowBalanceModal(false)} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Adjust Balance</h3>
                        <form onSubmit={handleBalanceAdjust} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setData('type', 'add')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${data.type === 'add'
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('type', 'deduct')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium ${data.type === 'deduct'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        Deduct
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount</label>
                                <input
                                    type="number"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    placeholder="0"
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowBalanceModal(false)}
                                    className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !data.amount}
                                    className="flex-1 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
