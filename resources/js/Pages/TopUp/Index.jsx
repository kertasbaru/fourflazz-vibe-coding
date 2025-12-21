import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

const presetAmounts = [
    { value: 50000, label: 'Rp 50.000' },
    { value: 100000, label: 'Rp 100.000' },
    { value: 200000, label: 'Rp 200.000' },
    { value: 500000, label: 'Rp 500.000' },
    { value: 1000000, label: 'Rp 1.000.000' },
    { value: 2000000, label: 'Rp 2.000.000' },
];

export default function TopUpIndex({ topUpRequests, balance, formattedBalance, vaChannels = [], retailChannels = [] }) {
    const { flash } = usePage().props;
    const [selectedAmount, setSelectedAmount] = useState(100000);
    const [customAmount, setCustomAmount] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Payment method state
    const [paymentMethod, setPaymentMethod] = useState('qris');
    const [bankCode, setBankCode] = useState('');

    // Payment result state
    const [paymentResult, setPaymentResult] = useState(null);

    const handleAmountSelect = (amount) => {
        setSelectedAmount(amount);
        setIsCustom(false);
        setCustomAmount('');
        setError('');
    };

    const handleCustomAmountChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        setCustomAmount(value);
        setIsCustom(true);
        setError('');
        if (value) {
            setSelectedAmount(parseInt(value));
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID').format(value);
    };

    const handleTopUp = async () => {
        const amount = isCustom ? parseInt(customAmount) : selectedAmount;

        if (!amount || amount < 10000) {
            setError('Minimum top up Rp 10.000');
            return;
        }

        if ((paymentMethod === 'va' || paymentMethod === 'retail') && !bankCode) {
            setError('Harap pilih metode pembayaran');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(route('topup.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({
                    amount,
                    payment_method: paymentMethod,
                    bank_code: bankCode || null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setPaymentResult(data);
            } else {
                setError(data.message || 'Gagal membuat pembayaran. Silakan coba lagi.');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Gagal memproses top up. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const resetPayment = () => {
        setPaymentResult(null);
        setError('');
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            expired: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400',
            cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400',
        };
        const dots = {
            pending: 'bg-amber-500',
            paid: 'bg-emerald-500',
            failed: 'bg-red-500',
            expired: 'bg-slate-500',
            cancelled: 'bg-slate-500',
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                <span className={`size-1.5 rounded-full ${dots[status]}`}></span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Render payment result screen
    if (paymentResult) {
        return (
            <DashboardLayout>
                <Head title="Selesaikan Pembayaran" />
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="text-center mb-6">
                            <div className="size-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[32px]">payments</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Selesaikan Pembayaran Anda</h3>
                            <p className="text-slate-500 mt-1">Jumlah: <span className="font-bold text-primary">Rp {formatCurrency(paymentResult.amount)}</span></p>
                        </div>

                        {paymentResult.payment_method === 'qris' && paymentResult.payment_code && (
                            <div className="text-center">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Pindai kode QR ini dengan aplikasi e-wallet Anda</p>
                                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentResult.payment_code)}`}
                                        alt="QRIS Code"
                                        className="w-48 h-48"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">Didukung: GoPay, OVO, DANA, LinkAja, ShopeePay, dll.</p>
                            </div>
                        )}

                        {paymentResult.payment_method === 'va' && (
                            <div className="text-center">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Transfer ke Virtual Account</p>
                                <p className="text-sm font-medium text-slate-900 dark:text-white mb-4">{paymentResult.bank_code}</p>
                                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-slate-500 mb-1">Nomor VA</p>
                                    <p className="text-2xl font-bold font-mono text-primary tracking-wider">{paymentResult.payment_code}</p>
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(paymentResult.payment_code)}
                                    className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                                >
                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                    Salin Nomor VA
                                </button>
                            </div>
                        )}

                        {paymentResult.payment_method === 'retail' && (
                            <div className="text-center">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Bayar di</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white mb-4">{paymentResult.bank_code}</p>
                                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-slate-500 mb-1">Kode Pembayaran</p>
                                    <p className="text-2xl font-bold font-mono text-primary tracking-wider">{paymentResult.payment_code}</p>
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(paymentResult.payment_code)}
                                    className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                                >
                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                    Salin Kode Pembayaran
                                </button>
                            </div>
                        )}

                        {paymentResult.expires_at && (
                            <p className="text-center text-xs text-slate-500 mt-4">
                                Kedaluwarsa: {paymentResult.expires_at}
                            </p>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={resetPayment}
                                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                Buat Pembayaran Baru
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-700"
                            >
                                Cek Status
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Head title="Top Up Saldo" />

            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Top Up Saldo</h2>
                        <p className="text-slate-500 dark:text-slate-400">Tambahkan dana ke akun Anda</p>
                    </div>

                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">error</span>
                            {flash.error}
                        </div>
                    )}

                    {/* Current Balance Card */}
                    <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm mb-1">Saldo Saat Ini</p>
                                <h3 className="text-3xl font-bold">{formattedBalance}</h3>
                            </div>
                            <div className="size-16 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[32px]">account_balance_wallet</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Up Form */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pilih Jumlah</h3>

                        {/* Preset Amounts */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                            {presetAmounts.map((preset) => (
                                <button
                                    key={preset.value}
                                    onClick={() => handleAmountSelect(preset.value)}
                                    className={`p-4 rounded-lg border-2 text-center font-semibold transition-colors ${!isCustom && selectedAmount === preset.value
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary/50'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Amount */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Atau masukkan jumlah custom
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                                <input
                                    type="text"
                                    value={customAmount ? formatCurrency(customAmount) : ''}
                                    onChange={handleCustomAmountChange}
                                    placeholder="0"
                                    className={`w-full h-12 pl-12 pr-4 rounded-lg border-2 text-lg font-semibold transition-colors ${isCustom
                                        ? 'border-primary bg-primary/5 text-slate-900 dark:text-white'
                                        : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                                        } bg-white dark:bg-slate-800 focus:ring-0 focus:border-primary`}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Minimum Rp 10.000</p>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Metode Pembayaran
                            </label>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <button
                                    type="button"
                                    onClick={() => { setPaymentMethod('qris'); setBankCode(''); }}
                                    className={`p-4 rounded-lg border-2 text-center transition-colors ${paymentMethod === 'qris'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[24px] mb-1 text-primary">qr_code_2</span>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">QRIS</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setPaymentMethod('va'); setBankCode(''); }}
                                    className={`p-4 rounded-lg border-2 text-center transition-colors ${paymentMethod === 'va'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[24px] mb-1 text-primary">account_balance</span>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Transfer Bank</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setPaymentMethod('retail'); setBankCode(''); }}
                                    className={`p-4 rounded-lg border-2 text-center transition-colors ${paymentMethod === 'retail'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[24px] mb-1 text-primary">storefront</span>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Retail</p>
                                </button>
                            </div>

                            {/* VA Channel Selection */}
                            {paymentMethod === 'va' && vaChannels.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {vaChannels.map((channel) => (
                                        <button
                                            key={channel.code}
                                            type="button"
                                            onClick={() => setBankCode(channel.code)}
                                            className={`p-3 rounded-lg border text-left transition-colors ${bankCode === channel.code
                                                ? 'border-primary bg-primary/5'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                                }`}
                                        >
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{channel.name}</p>
                                            <p className="text-xs text-slate-500">
                                                Fee: {channel.admin_fee_type === 'FIXED'
                                                    ? `Rp ${formatCurrency(channel.admin_fee_value)}`
                                                    : `${channel.admin_fee_value}%`}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Retail Channel Selection */}
                            {paymentMethod === 'retail' && retailChannels.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {retailChannels.map((channel) => (
                                        <button
                                            key={channel.code}
                                            type="button"
                                            onClick={() => setBankCode(channel.code)}
                                            className={`p-3 rounded-lg border text-left transition-colors ${bankCode === channel.code
                                                ? 'border-primary bg-primary/5'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                                }`}
                                        >
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{channel.name}</p>
                                            <p className="text-xs text-slate-500">
                                                Fee: Rp {formatCurrency(channel.admin_fee_value)}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {paymentMethod === 'va' && vaChannels.length === 0 && (
                                <p className="text-sm text-amber-600">Kanal VA tidak tersedia. Silakan coba QRIS.</p>
                            )}
                            {paymentMethod === 'retail' && retailChannels.length === 0 && (
                                <p className="text-sm text-amber-600">Kanal Retail tidak tersedia. Silakan coba QRIS.</p>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Summary */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Jumlah yang ditambahkan</span>
                                <span className="text-2xl font-bold text-primary">
                                    Rp {formatCurrency(isCustom ? (parseInt(customAmount) || 0) : selectedAmount)}
                                </span>
                            </div>
                        </div>

                        {/* Pay Button */}
                        <button
                            onClick={handleTopUp}
                            disabled={loading}
                            className="w-full h-12 bg-primary hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">payments</span>
                                    Bayar Sekarang
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-slate-500 mt-3">
                            Pembayaran aman didukung oleh SanPay
                        </p>
                    </div>

                    {/* Top Up History */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Riwayat Top Up</h3>

                        {topUpRequests.data && topUpRequests.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Jumlah</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase">Metode</th>
                                            <th className="py-3 px-2 text-xs font-semibold text-slate-500 uppercase text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {topUpRequests.data.map((request) => (
                                            <tr key={request.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-4 px-2 text-sm text-slate-600 dark:text-slate-400">
                                                    {new Date(request.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="py-4 px-2 text-sm font-semibold text-slate-900 dark:text-white">
                                                    Rp {formatCurrency(request.amount)}
                                                </td>
                                                <td className="py-4 px-2 text-sm text-slate-600 dark:text-slate-400">
                                                    {request.payment_method?.toUpperCase() || '-'} {request.bank_code || ''}
                                                </td>
                                                <td className="py-4 px-2 text-right">
                                                    {getStatusBadge(request.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <span className="material-symbols-outlined text-[48px] mb-2">receipt_long</span>
                                <p>Belum ada riwayat top up</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
