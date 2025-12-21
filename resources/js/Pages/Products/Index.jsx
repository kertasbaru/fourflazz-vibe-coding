import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

function ProductCard({ product }) {
    const firstBrand = product.brands?.[0] || '';

    return (
        <Link
            href={route('products.show', product.id)}
            className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-md transition-all group"
        >
            <div className="flex items-start gap-4">
                <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                        {product.category?.icon || 'inventory_2'}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {product.name}
                    </h4>
                    {firstBrand && (
                        <p className="text-xs text-slate-500 mt-0.5">{firstBrand}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                        <p className="text-lg font-bold text-primary">
                            Rp {new Intl.NumberFormat('id-ID').format(product.price)}
                        </p>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function ProductsIndex({ products, categories, brands, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [selectedBrand, setSelectedBrand] = useState(filters.brand || '');

    const handleFilter = (key, value) => {
        router.get(route('products.index'), {
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

    return (
        <DashboardLayout>
            <Head title="Produk" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Produk</h2>
                        <p className="text-slate-500 dark:text-slate-400">Jelajahi dan beli produk digital</p>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari produk..."
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

                {/* Categories */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => {
                            setSelectedCategory('');
                            handleFilter('category', '');
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory
                            ? 'bg-primary text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        Semua Produk
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => {
                                setSelectedCategory(category.slug);
                                handleFilter('category', category.slug);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${selectedCategory === category.slug
                                ? 'bg-primary text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{category.icon || 'category'}</span>
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Brand Filter */}
                {brands && brands.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-slate-500 font-medium">Brand:</span>
                        <button
                            onClick={() => {
                                setSelectedBrand('');
                                handleFilter('brand', '');
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!selectedBrand
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            Semua
                        </button>
                        {brands.map((brand) => (
                            <button
                                key={brand}
                                onClick={() => {
                                    setSelectedBrand(brand);
                                    handleFilter('brand', brand);
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedBrand === brand
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {brand}
                            </button>
                        ))}
                    </div>
                )}

                {/* Products Grid */}
                {products.data && products.data.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.data.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {products.last_page > 1 && (
                            <div className="flex items-center justify-center gap-1 sm:gap-2 mt-6 flex-wrap">
                                {/* Previous Button */}
                                <Link
                                    href={products.prev_page_url || '#'}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${products.prev_page_url
                                        ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed pointer-events-none'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                    <span className="hidden sm:inline">Sebelumnya</span>
                                </Link>

                                {/* Page Numbers - Hidden on mobile, shown on sm+ */}
                                <div className="hidden sm:flex items-center gap-1">
                                    {products.links.slice(1, -1).map((link, index) => {
                                        const pageNum = index + 1;
                                        const totalPages = products.last_page;
                                        const currentPage = products.current_page;

                                        // Show first, last, current, and adjacent pages
                                        const showPage = pageNum === 1 ||
                                            pageNum === totalPages ||
                                            Math.abs(pageNum - currentPage) <= 1;

                                        // Show ellipsis
                                        const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 4;
                                        const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 3;

                                        if (showEllipsisBefore || showEllipsisAfter) {
                                            return <span key={index} className="px-2 text-slate-400">...</span>;
                                        }

                                        if (!showPage && pageNum !== 2 && pageNum !== totalPages - 1) {
                                            return null;
                                        }

                                        return (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center ${link.active
                                                    ? 'bg-primary text-white'
                                                    : link.url
                                                        ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Page indicator for mobile */}
                                <span className="sm:hidden px-3 py-2 text-sm text-slate-600 dark:text-slate-400">
                                    {products.current_page} / {products.last_page}
                                </span>

                                {/* Next Button */}
                                <Link
                                    href={products.next_page_url || '#'}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${products.next_page_url
                                        ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed pointer-events-none'
                                        }`}
                                >
                                    <span className="hidden sm:inline">Berikutnya</span>
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                </Link>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-[64px] text-slate-300 dark:text-slate-600 mb-4">inventory_2</span>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Produk tidak ditemukan</h3>
                        <p className="text-slate-500 dark:text-slate-400">Coba sesuaikan filter atau pencarian Anda</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
