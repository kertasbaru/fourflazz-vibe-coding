import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminProductsIndex({ products, categories, filters }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('admin.products.index'), { search }, { preserveState: true });
    };

    const handleDelete = (product) => {
        if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
            router.delete(route('admin.products.destroy', product.id));
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value);

    return (
        <AdminLayout>
            <Head title="Manage Products" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Products</h2>
                        <p className="text-slate-500">Manage your digital products</p>
                    </div>
                    <Link
                        href={route('admin.products.create')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Add Product
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search products..."
                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                        </div>
                        <button type="submit" className="h-10 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
                            Search
                        </button>
                    </form>
                </div>

                {/* Products Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    {products.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Product</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Price</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Selling Price</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {products.data.map((product) => (
                                            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-primary">
                                                                {product.category?.icon || 'inventory_2'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{product.name}</p>
                                                            <p className="text-xs text-slate-500">{product.provider}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {product.category?.name}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                    Rp {formatCurrency(product.price)}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-semibold text-primary">
                                                    Rp {formatCurrency(product.selling_price)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.is_active
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                        }`}>
                                                        {product.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('admin.products.edit', product.id)}
                                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px] text-slate-600 dark:text-slate-400">edit</span>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(product)}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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

                            {products.last_page > 1 && (
                                <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
                                    {products.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-1.5 rounded text-sm font-medium ${link.active ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <span className="material-symbols-outlined text-[64px] text-slate-300 dark:text-slate-600 mb-4">inventory_2</span>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No products yet</h3>
                            <Link
                                href={route('admin.products.create')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                Add Your First Product
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
