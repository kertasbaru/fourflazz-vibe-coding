import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import axios from 'axios';

export default function SelectProduct({ category }) {
    const [inputValue, setInputValue] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detectedPrefix, setDetectedPrefix] = useState(null);

    // Purchase state
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseStep, setPurchaseStep] = useState('input'); // input, otp, confirm, processing, success, error
    const [otp, setOtp] = useState('');
    const [otpSessionId, setOtpSessionId] = useState(null);
    const [requiresOtp, setRequiresOtp] = useState(false);
    const [canResendIn, setCanResendIn] = useState(0);
    const [purchaseResult, setPurchaseResult] = useState(null);

    const inputLabel = category.input_type === 'phone' ? 'Nomor HP' : 'ID Pelanggan';
    const inputPlaceholder = category.input_type === 'phone' ? '08xxxxxxxxxx' : 'Masukkan ID Pelanggan';
    const minInputLength = category.input_type === 'phone' ? 10 : 5;

    // Auto-fetch products when input changes
    useEffect(() => {
        const fetchProducts = async () => {
            if (inputValue.length < minInputLength) {
                setProducts([]);
                setDetectedPrefix(null);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const response = await axios.post(route('categories.products-by-input', category.id), {
                    input_value: inputValue,
                });

                if (response.data.success) {
                    setProducts(response.data.products);
                    setDetectedPrefix(response.data.detected_prefix);

                    if (response.data.products.length === 0) {
                        setError('Tidak ada produk yang tersedia untuk input ini.');
                    }
                } else {
                    setError(response.data.message || 'Gagal memuat produk');
                    setProducts([]);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        // Debounce the search
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [inputValue, category.id, minInputLength]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (canResendIn > 0) {
            const timer = setTimeout(() => setCanResendIn(canResendIn - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [canResendIn]);

    const handleProductSelect = async (product) => {
        setSelectedProduct(product);
        setError('');
        // Go directly to confirmation, OTP will be handled when user clicks Buy
        setPurchaseStep('confirm');
    };

    const requestOtp = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/otp-sessions/request-otp', {
                phone: formatPhone(inputValue),
                provider: 'kmsp',
            });

            if (response.data.success) {
                setOtpSessionId(response.data.data.session_id);
                setCanResendIn(response.data.data.can_resend_in || 60);
            } else {
                setError(response.data.message || 'Gagal mengirim OTP');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengirim OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/otp-sessions/verify-otp', {
                session_id: otpSessionId,
                otp: otp,
            });

            if (response.data.success) {
                setPurchaseStep('confirm');
            } else {
                setError(response.data.message || 'Kode OTP salah');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Kode OTP salah');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        setError('');

        // Check if product requires OTP first
        if (selectedProduct.api_source === 'kmsp' && !otpSessionId) {
            try {
                const response = await axios.get(route('purchases.requirements', selectedProduct.id));
                if (response.data.success && response.data.data.requires_otp) {
                    setRequiresOtp(true);
                    setPurchaseStep('otp');
                    // Request OTP
                    await requestOtp();
                    return;
                }
            } catch (err) {
                setError('Gagal memeriksa persyaratan produk');
                return;
            }
        }

        // Proceed with purchase
        setPurchasing(true);
        setPurchaseStep('processing');

        try {
            const response = await axios.post('/purchases', {
                product_id: selectedProduct.id,
                phone: formatPhone(inputValue),
                otp_session_id: requiresOtp ? otpSessionId : null,
                payment_method: 'BALANCE',
            });

            if (response.data.success) {
                setPurchaseResult(response.data);
                setPurchaseStep('success');
            } else {
                setError(response.data.message || 'Pembelian gagal');
                setPurchaseStep('error');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Pembelian gagal. Silakan coba lagi.');
            setPurchaseStep('error');
        } finally {
            setPurchasing(false);
        }
    };

    const formatPhone = (value) => {
        let digits = value.replace(/\D/g, '');
        if (digits.startsWith('08')) {
            digits = '628' + digits.substring(2);
        } else if (digits.startsWith('8')) {
            digits = '62' + digits;
        }
        return digits;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID').format(price);
    };

    const resetFlow = () => {
        setInputValue('');
        setProducts([]);
        setSelectedProduct(null);
        setOtp('');
        setOtpSessionId(null);
        setRequiresOtp(false);
        setPurchaseStep('input');
        setError('');
        setPurchaseResult(null);
    };

    return (
        <DashboardLayout>
            <Head title={category.name} />

            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                {/* Breadcrumb */}
                <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <Link href={route('dashboard')} className="hover:text-primary">Beranda</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <Link href={route('categories.index')} className="hover:text-primary">Layanan</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-slate-900 dark:text-white">{category.name}</span>
                </nav>

                {/* Category Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center gap-4">
                        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[32px]">
                                {category.icon || 'category'}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{category.name}</h1>
                            {category.description && (
                                <p className="text-slate-500 dark:text-slate-400 mt-1">{category.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Input Form - Always visible in input step */}
                {purchaseStep === 'input' && (
                    <>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                Masukkan {inputLabel}
                            </h3>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    {inputLabel}
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        {category.input_type === 'phone' ? 'phone_android' : 'badge'}
                                    </span>
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value.replace(/[^0-9+]/g, ''))}
                                        placeholder={inputPlaceholder}
                                        className="w-full h-12 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 text-slate-900 dark:text-white"
                                    />
                                    {loading && (
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin">
                                            progress_activity
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Produk akan muncul otomatis saat Anda mengetik
                                </p>
                            </div>
                        </div>

                        {/* Products List - Show when available */}
                        {products.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                    Pilih Produk
                                    {detectedPrefix && (
                                        <span className="ml-2 text-sm font-medium text-primary">
                                            ({detectedPrefix})
                                        </span>
                                    )}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {products.map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => handleProductSelect(product)}
                                            className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-primary hover:bg-white dark:hover:bg-slate-700 transition-all text-left"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {product.name}
                                                    </h4>
                                                    {product.description && (
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                            {product.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-lg font-bold text-primary">
                                                        Rp {formatPrice(product.price)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && inputValue.length >= minInputLength && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                                    {error}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* OTP Verification (if needed) */}
                {purchaseStep === 'otp' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <form onSubmit={handleOtpSubmit}>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                Masukkan Kode OTP
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Kode OTP telah dikirim ke <strong>{formatPhone(inputValue)}</strong>
                            </p>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                    placeholder="Masukkan 6 digit OTP"
                                    maxLength={6}
                                    className="w-full h-14 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPurchaseStep('input')}
                                    className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="flex-1 h-12 bg-primary hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading && <span className="animate-spin material-symbols-outlined">progress_activity</span>}
                                    Verifikasi OTP
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Purchase Confirmation */}
                {purchaseStep === 'confirm' && selectedProduct && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Konfirmasi Pembelian
                        </h3>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Produk</span>
                                <span className="font-medium text-slate-900 dark:text-white">{selectedProduct.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{inputLabel}</span>
                                <span className="font-medium text-slate-900 dark:text-white">{inputValue}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Metode Pembayaran</span>
                                <span className="font-medium text-slate-900 dark:text-white">Saldo</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-600 pt-3">
                                <span className="text-slate-500">Total</span>
                                <span className="text-xl font-bold text-primary">
                                    Rp {formatPrice(selectedProduct.price)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setPurchaseStep('input')}
                                className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handlePurchase}
                                disabled={purchasing}
                                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">shopping_cart</span>
                                Beli Sekarang
                            </button>
                        </div>
                    </div>
                )}

                {/* Processing */}
                {purchaseStep === 'processing' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 text-center py-8">
                        <div className="animate-spin inline-block">
                            <span className="material-symbols-outlined text-5xl text-primary">progress_activity</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
                            Memproses Pembelian...
                        </h3>
                        <p className="text-slate-500 mt-2">
                            Mohon tunggu sebentar
                        </p>
                    </div>
                )}

                {/* Success */}
                {purchaseStep === 'success' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 text-center py-8">
                        <div className="size-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
                            Pembelian Berhasil!
                        </h3>
                        <p className="text-slate-500 mt-2">
                            Transaksi Anda sedang diproses
                        </p>

                        {purchaseResult && (
                            <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-left text-sm">
                                <p><strong>ID Transaksi:</strong> {purchaseResult.transaction_code}</p>
                                {purchaseResult.data?.trx_id && (
                                    <p><strong>ID Eksternal:</strong> {purchaseResult.data.trx_id}</p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <Link
                                href={route('transactions.index')}
                                className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                            >
                                Lihat Transaksi
                            </Link>
                            <button
                                onClick={resetFlow}
                                className="flex-1 h-12 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Beli Lagi
                            </button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {purchaseStep === 'error' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 text-center py-8">
                        <div className="size-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-4xl text-red-600">error</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
                            Pembelian Gagal
                        </h3>
                        <p className="text-red-600 dark:text-red-400 mt-2">
                            {error}
                        </p>

                        <button
                            onClick={resetFlow}
                            className="mt-6 h-12 px-8 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
