import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminProductForm({ categories, product }) {
    const isEditing = !!product;

    const { data, setData, post, put, processing, errors } = useForm({
        category_id: product?.category_id || '',
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || '',
        selling_price: product?.selling_price || '',
        api_source: product?.api_source || '',
        product_code: product?.product_code || '',
        type: product?.type || 'prepaid',
        stock: product?.stock ?? -1,
        is_active: product?.is_active ?? true,
        sort_order: product?.sort_order || 0,
        brands: product?.brands?.join(', ') || '',
        prefixes: product?.prefixes?.join(', ') || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('admin.products.update', product.id));
        } else {
            post(route('admin.products.store'));
        }
    };

    return (
        <AdminLayout>
            <Head title={isEditing ? 'Edit Product' : 'Create Product'} />

            <div className="max-w-2xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Link href={route('admin.products.index')} className="hover:text-primary">Products</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-slate-900 dark:text-white">{isEditing ? 'Edit' : 'Create'}</span>
                </nav>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isEditing ? 'Edit Product' : 'Create New Product'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Category *
                            </label>
                            <select
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)}
                                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g., Telkomsel 10.000"
                                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        {/* API Source (Provider) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                API Source
                            </label>
                            <select
                                value={data.api_source}
                                onChange={(e) => setData('api_source', e.target.value)}
                                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            >
                                <option value="">Manual (No API)</option>
                                <option value="kmsp">KMSP</option>
                                <option value="kaje">KAJE</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Select the API provider for this product</p>
                        </div>

                        {/* Brands */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Brands
                            </label>
                            <input
                                type="text"
                                value={data.brands}
                                onChange={(e) => setData('brands', e.target.value)}
                                placeholder="e.g., Telkomsel, Indosat, XL"
                                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">Comma-separated list of supported brands</p>
                            {data.brands && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {data.brands.split(',').map((brand, i) => brand.trim() && (
                                        <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                                            {brand.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Prefixes */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Phone Prefixes
                            </label>
                            <input
                                type="text"
                                value={data.prefixes}
                                onChange={(e) => setData('prefixes', e.target.value)}
                                placeholder="e.g., 0811, 0812, 0813"
                                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">Comma-separated phone prefixes for automatic matching</p>
                            {data.prefixes && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {data.prefixes.split(',').map((prefix, i) => prefix.trim() && (
                                        <span key={i} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded font-mono">
                                            {prefix.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Price & Selling Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Cost Price *
                                </label>
                                <input
                                    type="number"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    placeholder="0"
                                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                />
                                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Selling Price *
                                </label>
                                <input
                                    type="number"
                                    value={data.selling_price}
                                    onChange={(e) => setData('selling_price', e.target.value)}
                                    placeholder="0"
                                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                />
                                {errors.selling_price && <p className="text-red-500 text-sm mt-1">{errors.selling_price}</p>}
                            </div>
                        </div>

                        {/* Product Code & Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Product Code
                                </label>
                                <input
                                    type="text"
                                    value={data.product_code}
                                    onChange={(e) => setData('product_code', e.target.value)}
                                    placeholder="SKU"
                                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Type *
                                </label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                >
                                    <option value="prepaid">Prepaid</option>
                                    <option value="postpaid">Postpaid</option>
                                </select>
                            </div>
                        </div>

                        {/* Stock */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Stock
                            </label>
                            <input
                                type="number"
                                value={data.stock}
                                onChange={(e) => setData('stock', parseInt(e.target.value))}
                                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">Use -1 for unlimited stock</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Active (visible to customers)
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Link
                                href={route('admin.products.index')}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
