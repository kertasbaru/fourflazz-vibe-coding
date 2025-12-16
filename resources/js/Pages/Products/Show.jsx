import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function ProductShow({ product, relatedProducts }) {
    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        phone_target: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowModal(true);
    };

    const confirmPurchase = () => {
        post(route('products.purchase', product.id), {
            onSuccess: () => setShowModal(false),
        });
    };

    return (
        <DashboardLayout>
            <Head title={product.name} />

            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Link href={route('products.index')} className="hover:text-primary">Products</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <Link
                        href={route('products.index', { category: product.category?.slug })}
                        className="hover:text-primary"
                    >
                        {product.category?.name}
                    </Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-slate-900 dark:text-white">{product.name}</span>
                </nav>

                {/* Product Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        <div className="flex items-start gap-6">
                            <div className="size-16 md:size-20 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-[32px] md:text-[40px]">
                                    {product.category?.icon || 'inventory_2'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-2">
                                            {product.category?.name}
                                        </span>
                                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                            {product.name}
                                        </h1>
                                        {product.provider && (
                                            <p className="text-slate-500 mt-1">{product.provider}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-primary">
                                            Rp {new Intl.NumberFormat('id-ID').format(product.selling_price)}
                                        </p>
                                    </div>
                                </div>

                                {product.description && (
                                    <p className="text-slate-600 dark:text-slate-400 mt-4">
                                        {product.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Purchase Form */}
                    <div className="border-t border-slate-200 dark:border-slate-700 p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Purchase This Product
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Phone Number / Target ID
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        phone_android
                                    </span>
                                    <input
                                        type="text"
                                        value={data.phone_target}
                                        onChange={(e) => setData('phone_target', e.target.value)}
                                        placeholder="e.g., 081234567890"
                                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 text-slate-900 dark:text-white"
                                    />
                                </div>
                                {errors.phone_target && (
                                    <p className="text-red-500 text-sm mt-1">{errors.phone_target}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={processing || !data.phone_target}
                                className="w-full h-12 bg-primary hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">shopping_cart</span>
                                Buy Now
                            </button>
                        </form>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Related Products</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {relatedProducts.map((relatedProduct) => (
                                <Link
                                    key={relatedProduct.id}
                                    href={route('products.show', relatedProduct.id)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors flex items-center gap-4"
                                >
                                    <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary">
                                            {relatedProduct.category?.icon || 'inventory_2'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                            {relatedProduct.name}
                                        </h4>
                                        <p className="text-xs text-slate-500">{relatedProduct.provider}</p>
                                    </div>
                                    <p className="text-sm font-bold text-primary">
                                        Rp {new Intl.NumberFormat('id-ID').format(relatedProduct.selling_price)}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Confirm Purchase</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Product</span>
                                <span className="font-medium text-slate-900 dark:text-white">{product.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Target Number</span>
                                <span className="font-medium text-slate-900 dark:text-white">{data.phone_target}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
                                <span className="text-slate-500">Total</span>
                                <span className="text-lg font-bold text-primary">
                                    Rp {new Intl.NumberFormat('id-ID').format(product.selling_price)}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 h-10 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPurchase}
                                disabled={processing}
                                className="flex-1 h-10 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
