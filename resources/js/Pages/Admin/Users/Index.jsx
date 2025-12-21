import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminUsersIndex({ users, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.users.index'), { search }, { preserveState: true });
    };

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value);

    return (
        <AdminLayout>
            <Head title="Kelola Pengguna" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Users</h2>
                        <p className="text-slate-500">Manage platform users</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, email, or phone..."
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                        />
                    </div>
                    <button type="submit" className="h-10 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg">
                        Search
                    </button>
                </form>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    {users.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Role</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Balance</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Transactions</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {users.data.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                                                            <p className="text-xs text-slate-500">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-sm font-semibold text-primary">
                                                    Rp {formatCurrency(user.balance)}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {user.transactions_count}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-500">
                                                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('admin.users.show', user.id)}
                                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px] text-slate-600 dark:text-slate-400">visibility</span>
                                                        </Link>
                                                        <Link
                                                            href={route('admin.users.edit', user.id)}
                                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px] text-slate-600 dark:text-slate-400">edit</span>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {users.last_page > 1 && (
                                <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
                                    {users.links.map((link, index) => (
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
                            <span className="material-symbols-outlined text-[64px] text-slate-300">group</span>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 mt-4">No users found</h3>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
