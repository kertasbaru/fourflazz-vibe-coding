import { Head, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function TopUpIndex({ topUpRequests, balance, formattedBalance, minTopUp = 10000 }) {
    const { flash } = usePage().props;

    // Generate preset amounts based on minimum
    const allPresetAmounts = [
        { value: 1, label: 'Rp 1' },
        { value: 10000, label: 'Rp 10.000' },
        { value: 50000, label: 'Rp 50.000' },
        { value: 100000, label: 'Rp 100.000' },
        { value: 200000, label: 'Rp 200.000' },
        { value: 500000, label: 'Rp 500.000' },
        { value: 1000000, label: 'Rp 1.000.000' },
        { value: 2000000, label: 'Rp 2.000.000' },
    ];

    // Filter to only show amounts >= minTopUp, take max 6 options
    const presetAmounts = allPresetAmounts.filter(preset => preset.value >= minTopUp).slice(0, 6);

    const [selectedAmount, setSelectedAmount] = useState(presetAmounts.length > 0 ? presetAmounts[0].value : minTopUp);
    const [customAmount, setCustomAmount] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Payment result state to show QR
    const [qrResult, setQrResult] = useState(null);

    // Upload Proof State
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef(null);

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

        if (!amount || amount < minTopUp) {
            setError(`Jumlah minimum top-up adalah Rp ${minTopUp.toLocaleString('id-ID')}`);
            return;
        }

        setLoading(true);
        setError('');
        setUploadSuccess(false);
        setUploadFile(null);

        try {
            const response = await fetch(route('topup.create'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();

            if (data.success) {
                setQrResult(data.data);
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB
                setError('Ukuran file maksimal 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                setError('File harus berupa gambar');
                return;
            }
            setUploadFile(file);
            setError('');
        }
    };

    const handleUploadProof = async () => {
        if (!uploadFile || !qrResult) return;

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('payment_proof', uploadFile);

        try {
            const response = await fetch(route('topup.upload-proof', qrResult.id), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setUploadSuccess(true);
                setUploadFile(null); // Clear file input
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                setError(data.message || 'Gagal upload bukti pembayaran');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Gagal upload bukti pembayaran');
        } finally {
            setUploading(false);
        }
    };

    const handleCheckStatus = () => {
        setLoading(true);
        window.location.reload();
    };

    const resetPayment = () => {
        setQrResult(null);
        setError('');
        setUploadSuccess(false);
        setUploadFile(null);
    };

    const handleContinuePayment = (request) => {
        if (request.status !== 'pending') return;

        setQrResult({
            id: request.id,
            amount: request.amount,
            unique_code: request.unique_code,
            total_amount: request.total_amount,
            formatted_total: new Intl.NumberFormat('id-ID').format(request.total_amount),
            qr_code: '/images/qr-topup.png'
        });

        if (request.payment_proof) {
            setUploadSuccess(true);
        } else {
            setUploadSuccess(false);
            setUploadFile(null);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'success':
            case 'paid':
                return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Berhasil</span>;
            case 'pending':
                return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Menunggu</span>;
            case 'failed':
                return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Gagal</span>;
            default:
                return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800">{status}</span>;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <DashboardLayout>
            <Head title="Top Up Saldo" />

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header Card */}
                <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <h2 className="text-2xl md:text-3xl font-bold mb-1">Top Up Saldo</h2>
                    <p className="text-blue-100 mb-6">Metode Transfer Otomatis</p>

                    <div>
                        <p className="text-blue-100 text-sm mb-1">Saldo Saat Ini</p>
                        <h3 className="text-3xl font-bold">{formattedBalance}</h3>
                    </div>
                </div>

                {qrResult ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center animate-fade-in">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Lakukan Pembayaran</h3>
                            <p className="text-slate-500 dark:text-slate-400">Scan QRIS di bawah ini</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 inline-block mb-6 shadow-sm">
                            <img
                                src={qrResult.qr_code}
                                alt="QR Topup"
                                className="w-48 h-48 object-contain"
                            />
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 mb-6 text-left shadow-inner">
                            <p className="text-sm text-amber-800 dark:text-amber-200 mb-4 text-center font-bold bg-amber-100 dark:bg-amber-800/50 py-2 rounded-lg">
                                ⚠️ TRANSFER TEPAT HINGGA 3 DIGIT TERAKHIR
                            </p>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-amber-200/50 dark:border-amber-700/50">
                                    <span className="text-slate-600 dark:text-slate-400">Nominal Top Up</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">Rp {formatCurrency(qrResult.amount)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-amber-200/50 dark:border-amber-700/50">
                                    <span className="text-slate-600 dark:text-slate-400">Kode Unik</span>
                                    <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-lg">+{qrResult.unique_code}</span>
                                </div>
                                <div className="pt-2">
                                    <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">Total Transfer (Wajib Sama Persis)</span>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-bold text-primary">Rp {qrResult.formatted_total}</span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(qrResult.total_amount);
                                                alert('Total transfer disalin!');
                                            }}
                                            className="text-slate-400 hover:text-primary transition-colors"
                                            title="Salin Total"
                                        >
                                            <span className="material-symbols-outlined">content_copy</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-red-500 font-bold mt-1 text-right">*Jangan dibulatkan!</p>
                                </div>
                            </div>
                        </div>

                        {/* Upload Proof Section */}
                        {uploadSuccess ? (
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3 text-green-700 dark:text-green-400">
                                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                                    <div className="text-left">
                                        <p className="font-bold">Bukti terkirim!</p>
                                        <p className="text-sm">Silakan tunggu verifikasi admin atau update otomatis.</p>
                                    </div>
                                    <button
                                        onClick={() => setUploadSuccess(false)}
                                        className="ml-auto text-xs underline hover:text-green-800"
                                    >
                                        Upload Ulang
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-900/20 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-left">Upload Bukti Transfer (Opsional)</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-primary/10 file:text-primary
                                            hover:file:bg-primary/20
                                            cursor-pointer"
                                    />
                                    {uploadFile && (
                                        <button
                                            onClick={handleUploadProof}
                                            disabled={uploading}
                                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            {uploading ? '...' : 'Upload'}
                                        </button>
                                    )}
                                </div>
                                {error && error.includes('file') && (
                                    <p className="text-red-500 text-xs mt-2 text-left">{error}</p>
                                )}
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={handleCheckStatus}
                                disabled={loading}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                            >
                                {loading && <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>}
                                {loading ? 'Memeriksa...' : 'Saya Sudah Transfer'}
                            </button>
                            <button
                                onClick={resetPayment}
                                className="w-full py-3 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Batal / Buat Top Up Baru
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>

                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 relative z-10">
                            Pilih Nominal Top Up
                        </label>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 relative z-10">
                            {presetAmounts.map((preset) => (
                                <button
                                    key={preset.value}
                                    onClick={() => handleAmountSelect(preset.value)}
                                    className={`py-3 px-4 rounded-xl border transition-all ${selectedAmount === preset.value && !isCustom
                                        ? 'border-primary bg-primary/5 text-primary font-bold ring-2 ring-primary/20 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 text-slate-600 dark:text-slate-300 hover:shadow-sm'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="mb-8 relative z-10">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Atau masukkan jumlah manual
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-primary transition-colors">Rp</span>
                                <input
                                    type="text"
                                    value={isCustom ? customAmount : (presetAmounts.find(p => p.value === selectedAmount) ? '' : selectedAmount)}
                                    onChange={handleCustomAmountChange}
                                    placeholder={`Min. ${minTopUp.toLocaleString('id-ID')}`}
                                    className={`w-full pl-12 pr-4 py-4 border rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm ${isCustom && selectedAmount >= 10000
                                        ? 'border-primary ring-2 ring-primary/20'
                                        : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">info</span>
                                Minimum top up Rp {minTopUp.toLocaleString('id-ID')}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-shake">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleTopUp}
                            disabled={loading || !selectedAmount || selectedAmount < minTopUp}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {loading ? (
                                    <>
                                        <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        Lanjut Pembayaran
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                )}

                {/* History */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mt-8">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-500">history</span>
                            Riwayat Top Up
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Detail</th>
                                    <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {topUpRequests.data.length > 0 ? (
                                    topUpRequests.data.map((request) => (
                                        <tr
                                            key={request.id}
                                            className={`text-sm transition-colors ${request.status === 'pending' ? 'hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer' : ''}`}
                                            onClick={() => handleContinuePayment(request)}
                                        >
                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {formatDate(request.created_at)}
                                            </td>
                                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                Rp {formatCurrency(request.total_amount || request.amount)}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                                {request.unique_code ? (
                                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">
                                                        Code: {request.unique_code}
                                                    </span>
                                                ) : '-'}
                                                {request.payment_proof && (
                                                    <span className="ml-2 text-green-600 font-bold text-xs">[Bukti OK]</span>
                                                )}
                                                {request.status === 'pending' && !request.payment_proof && (
                                                    <span className="ml-2 text-primary font-bold text-xs">[Bayar]</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {getStatusBadge(request.status)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-slate-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                                                <p>Belum ada riwayat top up</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
