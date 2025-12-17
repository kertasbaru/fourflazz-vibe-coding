import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import axios from 'axios';

export default function ProductShow({ product, relatedProducts }) {
    const { auth } = usePage().props;

    const [phone, setPhone] = useState('');
    const [step, setStep] = useState('phone'); // phone, otp, confirm, processing, success, error
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // OTP related state
    const [requiresOtp, setRequiresOtp] = useState(false);
    const [otpSessionId, setOtpSessionId] = useState(null);
    const [authId, setAuthId] = useState(null);
    const [otp, setOtp] = useState('');
    const [canResendIn, setCanResendIn] = useState(0);

    // Payment related state
    const [paymentMethod, setPaymentMethod] = useState('BALANCE');
    const [availablePaymentMethods, setAvailablePaymentMethods] = useState(['BALANCE']);
    const [transactionData, setTransactionData] = useState(null);

    // Format phone to 628xxx
    const formatPhone = (value) => {
        let digits = value.replace(/\D/g, '');
        if (digits.startsWith('08')) {
            digits = '628' + digits.substring(2);
        } else if (digits.startsWith('8')) {
            digits = '62' + digits;
        }
        return digits;
    };

    // Check if product requires OTP and available payment methods
    const checkRequirements = async () => {
        if (!product.api_source || product.api_source !== 'kmsp') {
            setRequiresOtp(false);
            return;
        }

        try {
            const response = await fetch(`/purchases/${product.id}/requirements`, {
                headers: { 'Accept': 'application/json' },
            });
            const data = await response.json();

            if (data.success) {
                setRequiresOtp(data.data.requires_otp);
                setAvailablePaymentMethods(data.data.available_payment_methods || ['BALANCE']);

                // Check if user already has an active session for this phone
                if (data.data.active_sessions?.length > 0) {
                    // Use existing session
                    const existingSession = data.data.active_sessions[0];
                    setOtpSessionId(existingSession.id);
                }
            }
        } catch (e) {
            console.error('Failed to check requirements', e);
        }
    };

    useEffect(() => {
        checkRequirements();
    }, [product.id]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (canResendIn > 0) {
            const timer = setTimeout(() => setCanResendIn(canResendIn - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [canResendIn]);

    // Step 1: Handle phone submission - check if OTP is required
    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const formattedPhone = formatPhone(phone);
        if (formattedPhone.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        if (!requiresOtp) {
            // No OTP required, go directly to confirmation
            setStep('confirm');
            return;
        }

        // Request OTP for phone
        setLoading(true);
        try {
            const response = await axios.post('/otp-sessions/request-otp', {
                phone: formattedPhone,
                provider: 'kmsp',
            });

            const data = response.data;

            if (data.success) {
                setOtpSessionId(data.data.session_id);
                setCanResendIn(data.data.can_resend_in || 60);
                setStep('otp');
            } else {
                setError(data.message || 'Failed to request OTP');
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Network error. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Handle OTP verification
    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/otp-sessions/verify-otp', {
                session_id: otpSessionId,
                otp: otp,
            });

            const data = response.data;

            if (data.success) {
                setStep('confirm');
            } else {
                setError(data.message || 'Invalid OTP');
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Network error. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Confirm and process purchase
    const handlePurchase = async () => {
        setError('');
        setLoading(true);
        setStep('processing');

        try {
            const response = await axios.post('/purchases', {
                product_id: product.id,
                phone: formatPhone(phone),
                otp_session_id: requiresOtp ? otpSessionId : null,
                payment_method: paymentMethod,
            });

            const data = response.data;

            if (data.success) {
                setTransactionData(data);
                setSuccessMessage(data.message);
                setStep('success');
            } else {
                setError(data.message || 'Purchase failed');
                setStep('error');
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Purchase failed. Please try again.';
            setError(message);
            setStep('error');
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setStep('phone');
        setPhone('');
        setOtp('');
        setError('');
        setSuccessMessage('');
        setTransactionData(null);
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
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                <div className="size-16 md:size-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-[32px] md:text-[40px]">
                                        {product.category?.icon || 'inventory_2'}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-4">
                                    {/* Badges */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                            {product.category?.name}
                                        </span>
                                        {requiresOtp && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                Requires OTP
                                            </span>
                                        )}
                                    </div>

                                    {/* Title & Provider */}
                                    <div>
                                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white leading-tight break-words">
                                            {product.name}
                                        </h1>
                                        {product.provider && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Provider</span>
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{product.provider}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {product.description && (
                                        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 whitespace-pre-line bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                                            {product.description}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Price Section - Desktop & Mobile optimized */}
                            <div className="flex-shrink-0 md:text-right border-t md:border-t-0 border-slate-100 dark:border-slate-700 pt-4 md:pt-0 mt-2 md:mt-0">
                                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Price</p>
                                        <p className="text-3xl font-bold text-primary">
                                            Rp {new Intl.NumberFormat('id-ID').format(product.selling_price)}
                                        </p>
                                    </div>
                                    <div className="hidden md:block h-px w-full bg-slate-100 dark:bg-slate-800 my-2"></div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Your Balance</p>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Rp {new Intl.NumberFormat('id-ID').format(auth.user.balance || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchase Flow */}
                    <div className="border-t border-slate-200 dark:border-slate-700 p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50">

                        {/* Step: Phone Input */}
                        {step === 'phone' && (
                            <form onSubmit={handlePhoneSubmit}>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                    Enter Phone Number
                                </h3>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Target Phone Number {requiresOtp && '(XL/AXIS)'}
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            phone_android
                                        </span>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="08xxxxxxxxxx"
                                            className="w-full h-12 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !phone}
                                    className="w-full h-12 bg-primary hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading && <span className="animate-spin material-symbols-outlined">progress_activity</span>}
                                    {requiresOtp ? 'Request OTP' : 'Continue'}
                                </button>
                            </form>
                        )}

                        {/* Step: OTP Input */}
                        {step === 'otp' && (
                            <form onSubmit={handleOtpSubmit}>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    Enter OTP Code
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">
                                    OTP code has been sent to <strong>{formatPhone(phone)}</strong>
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
                                        placeholder="Enter 6-digit OTP"
                                        maxLength={6}
                                        className="w-full h-14 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep('phone')}
                                        className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || otp.length !== 6}
                                        className="flex-1 h-12 bg-primary hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading && <span className="animate-spin material-symbols-outlined">progress_activity</span>}
                                        Verify OTP
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Step: Confirmation */}
                        {step === 'confirm' && (
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                    Confirm Purchase
                                </h3>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Product</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{product.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Target Number</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{formatPhone(phone)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Payment Method</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{paymentMethod}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
                                        <span className="text-slate-500">Total</span>
                                        <span className="text-xl font-bold text-primary">
                                            Rp {new Intl.NumberFormat('id-ID').format(product.selling_price)}
                                        </span>
                                    </div>
                                </div>

                                {auth.user.balance < product.selling_price && paymentMethod === 'BALANCE' && (
                                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                                        <span className="material-symbols-outlined text-lg align-middle mr-1">warning</span>
                                        Insufficient balance. Please <Link href="/topup" className="underline">top up</Link> first.
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep('phone')}
                                        className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePurchase}
                                        disabled={loading || (paymentMethod === 'BALANCE' && auth.user.balance < product.selling_price)}
                                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">shopping_cart</span>
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step: Processing */}
                        {step === 'processing' && (
                            <div className="text-center py-8">
                                <div className="animate-spin inline-block">
                                    <span className="material-symbols-outlined text-5xl text-primary">progress_activity</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
                                    Processing Purchase...
                                </h3>
                                <p className="text-slate-500 mt-2">
                                    Please wait while we process your transaction
                                </p>
                            </div>
                        )}

                        {/* Step: Success */}
                        {step === 'success' && (
                            <div className="text-center py-8">
                                <div className="size-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                                    <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
                                    Purchase Successful!
                                </h3>
                                <p className="text-slate-500 mt-2">
                                    {successMessage}
                                </p>

                                {transactionData && (
                                    <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-left">
                                        <p className="text-sm"><strong>Transaction ID:</strong> {transactionData.transaction_code}</p>
                                        {transactionData.data?.trx_id && (
                                            <p className="text-sm"><strong>External ID:</strong> {transactionData.data.trx_id}</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <Link
                                        href={route('transactions.index')}
                                        className="flex-1 h-12 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                                    >
                                        View Transactions
                                    </Link>
                                    <button
                                        onClick={resetForm}
                                        className="flex-1 h-12 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        Buy Again
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step: Error */}
                        {step === 'error' && (
                            <div className="text-center py-8">
                                <div className="size-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                                    <span className="material-symbols-outlined text-4xl text-red-600">error</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
                                    Purchase Failed
                                </h3>
                                <p className="text-red-600 dark:text-red-400 mt-2">
                                    {error}
                                </p>
                                <p className="text-slate-500 text-sm mt-2">
                                    Your balance has been refunded if it was deducted.
                                </p>

                                <button
                                    onClick={resetForm}
                                    className="mt-6 h-12 px-8 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
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
        </DashboardLayout>
    );
}
