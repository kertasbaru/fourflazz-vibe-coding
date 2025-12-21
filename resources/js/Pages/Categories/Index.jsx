import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

function CategoryCard({ category }) {
    return (
        <Link
            href={route('categories.show', category.id)}
            className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-white dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-600 hover:border-primary"
        >
            {category.badge_label && (
                <span
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase text-white"
                    style={{ backgroundColor: category.badge_color || '#EF4444' }}
                >
                    {category.badge_label}
                </span>
            )}
            <span className="material-symbols-outlined text-primary text-[32px]">{category.icon || 'category'}</span>
            <span className="text-xs font-semibold text-center leading-tight">{category.name}</span>
        </Link>
    );
}

export default function CategoriesIndex({ categoriesGrouped }) {
    // Convert grouped categories object to array for iteration
    const groupedArray = Object.entries(categoriesGrouped || {});

    return (
        <DashboardLayout>
            <Head title="Semua Produk & Layanan" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link
                        href={route('dashboard')}
                        className="size-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
                    </Link>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Semua Produk & Layanan</h2>
                        <p className="text-slate-500 dark:text-slate-400">Pilih layanan yang Anda butuhkan</p>
                    </div>
                </div>

                {/* Categories grouped by section */}
                {groupedArray.length > 0 ? (
                    <div className="flex flex-col gap-8">
                        {groupedArray.map(([groupName, categories]) => (
                            <div key={groupName} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                    {groupName || 'Lainnya'}
                                </h3>
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {categories.map((category) => (
                                        <CategoryCard key={category.id} category={category} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
                        <span className="material-symbols-outlined text-[64px] text-slate-300 dark:text-slate-600 mb-4">category</span>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Tidak ada kategori</h3>
                        <p className="text-slate-500 dark:text-slate-400">Belum ada kategori layanan tersedia</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
