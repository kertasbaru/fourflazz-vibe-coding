import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminCategoriesIndex({ categories, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.categories.index'), { search }, { preserveState: true });
    };

    const handleDelete = (category) => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(route('admin.categories.destroy', category.id));
        }
    };

    return (
        <AdminLayout>
            <Head title="Kelola Kategori" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Categories</h2>
                        <p className="text-slate-500">Manage product categories</p>
                    </div>
                    <Link
                        href={route('admin.categories.create')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Add Category
                    </Link>
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                        />
                    </div>
                    <button type="submit" className="h-10 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg">
                        Search
                    </button>
                </form>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    {categories.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Products</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                        <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {categories.data.map((category) => (
                                        <tr key={category.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-primary">
                                                            {category.icon || 'category'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{category.name}</p>
                                                        <p className="text-xs text-slate-500">{category.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                {category.products_count} products
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${category.is_active
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                    }`}>
                                                    {category.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={route('admin.categories.edit', category.id)}
                                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px] text-slate-600 dark:text-slate-400">edit</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(category)}
                                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px] text-red-600">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-[64px] text-slate-300 dark:text-slate-600">category</span>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 mt-4">No categories yet</h3>
                            <Link href={route('admin.categories.create')} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg">
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Add Your First Category
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
