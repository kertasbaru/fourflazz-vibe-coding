import { Head, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';

export default function SettingsIndex({ settings }) {
    const [margin, setMargin] = useState(settings.product_margin || 10);
    const [minTopUp, setMinTopUp] = useState(settings.min_topup_amount || 10000);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // QR Code upload states
    const [qrImage, setQrImage] = useState(settings.qr_topup_image);
    const [qrUploading, setQrUploading] = useState(false);
    const [qrMessage, setQrMessage] = useState({ type: '', text: '' });
    const qrFileInputRef = useRef(null);

    // QRIS mode states
    const [qrisMode, setQrisMode] = useState(settings.qris_mode || 'static');
    const [qrisData, setQrisData] = useState(settings.qris_data || {});
    const [qrisString, setQrisString] = useState('');
    const [qrisLabels, setQrisLabels] = useState(settings.qris_labels || null); // Load saved labels
    const [qrisLoading, setQrisLoading] = useState(false);
    const [qrisMessage, setQrisMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.post(route('admin.settings.update'), {
                product_margin: parseFloat(margin),
                min_topup_amount: parseFloat(minTopUp),
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update settings';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleQrUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setQrMessage({ type: 'error', text: 'File harus berupa gambar' });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setQrMessage({ type: 'error', text: 'Ukuran file maksimal 2MB' });
            return;
        }

        setQrUploading(true);
        setQrMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('qr_image', file);

        try {
            const response = await axios.post(route('admin.settings.upload-qr'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setQrImage(response.data.path);
                setQrMessage({ type: 'success', text: response.data.message });
                if (qrFileInputRef.current) qrFileInputRef.current.value = '';
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Gagal mengupload QR Code';
            setQrMessage({ type: 'error', text: errorMessage });
        } finally {
            setQrUploading(false);
        }
    };

    const handleQrDelete = async () => {
        if (!confirm('Apakah Anda yakin ingin menghapus QR Code custom dan kembali ke QR default?')) return;

        setQrUploading(true);
        setQrMessage({ type: '', text: '' });

        try {
            const response = await axios.delete(route('admin.settings.delete-qr'));

            if (response.data.success) {
                setQrImage(null);
                setQrMessage({ type: 'success', text: response.data.message });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Gagal menghapus QR Code';
            setQrMessage({ type: 'error', text: errorMessage });
        } finally {
            setQrUploading(false);
        }
    };

    const handleQrisModeChange = async (mode) => {
        setQrisLoading(true);
        setQrisMessage({ type: '', text: '' });

        try {
            const response = await axios.post(route('admin.settings.update-qris-mode'), {
                mode: mode,
            });

            if (response.data.success) {
                setQrisMode(mode);
                setQrisMessage({ type: 'success', text: response.data.message });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Gagal mengubah mode QRIS';
            setQrisMessage({ type: 'error', text: errorMessage });
        } finally {
            setQrisLoading(false);
        }
    };

    const handleParseQris = async () => {
        if (!qrisString.trim()) {
            setQrisMessage({ type: 'error', text: 'Silakan masukkan QRIS string' });
            return;
        }

        setQrisLoading(true);
        setQrisMessage({ type: '', text: '' });

        try {
            const response = await axios.post(route('admin.settings.parse-qris'), {
                qris_string: qrisString,
            });

            if (response.data.success) {
                setQrisData(response.data.data);
                setQrisLabels(response.data.labels);
                setQrisMessage({ type: 'success', text: response.data.message });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Gagal parsing QRIS string';
            setQrisMessage({ type: 'error', text: errorMessage });
        } finally {
            setQrisLoading(false);
        }
    };

    const handleSaveQrisData = async () => {
        if (!qrisData || Object.keys(qrisData).length === 0) {
            setQrisMessage({ type: 'error', text: 'Tidak ada data QRIS untuk disimpan' });
            return;
        }

        setQrisLoading(true);
        setQrisMessage({ type: '', text: '' });

        try {
            const response = await axios.post(route('admin.settings.update-qris-data'), {
                qris_data: qrisData,
            });

            if (response.data.success) {
                setQrisMessage({ type: 'success', text: response.data.message });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Gagal menyimpan data QRIS';
            setQrisMessage({ type: 'error', text: errorMessage });
        } finally {
            setQrisLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Pengaturan" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Pengaturan</h2>
                    <p className="text-slate-500">Konfigurasi pengaturan aplikasi</p>
                </div>

                {/* Product Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Pengaturan Produk</h3>

                        {message.text && (
                            <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                                }`}>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">
                                        {message.type === 'success' ? 'check_circle' : 'error'}
                                    </span>
                                    <span className="text-sm font-medium">{message.text}</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Margin Produk (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={margin}
                                        onChange={(e) => setMargin(e.target.value)}
                                        step="0.1"
                                        min="0"
                                        max="1000"
                                        className="w-full md:w-64 h-12 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Margin ini akan diterapkan saat sinkronisasi produk dari provider API (KMSP, KAJE, dll).
                                        <br />
                                        Contoh: Jika margin 10%, produk dengan harga Rp 10.000 akan memiliki harga jual Rp 11.000.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Minimum Top-Up (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        value={minTopUp}
                                        onChange={(e) => setMinTopUp(e.target.value)}
                                        step="1"
                                        min="1"
                                        max="100000000"
                                        className="w-full md:w-64 h-12 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Nilai minimum untuk top-up via QRIS. Mendukung hingga Rp 1.
                                        <br />
                                        Catatan: Kode unik akan ditambahkan ke saldo user (termasuk dalam balance).
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="h-12 px-6 bg-primary hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {loading && <span className="animate-spin material-symbols-outlined">progress_activity</span>}
                                        Simpan Pengaturan
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* QR Code Settings */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">QR Code Top-Up</h3>

                        {qrMessage.text && (
                            <div className={`mb-6 p-4 rounded-lg border ${qrMessage.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                                }`}>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">
                                        {qrMessage.type === 'success' ? 'check_circle' : 'error'}
                                    </span>
                                    <span className="text-sm font-medium">{qrMessage.text}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Current QR Code Preview */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    QR Code Aktif
                                </label>
                                <div className="w-64 h-64 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                                    {qrImage ? (
                                        <img src={qrImage} alt="QR Code Top-Up" className="w-full h-full object-contain p-4" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-2">qr_code_2</span>
                                            <p className="text-sm text-slate-500">Menggunakan QR default</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upload New QR Code */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Upload QR Code Baru
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        ref={qrFileInputRef}
                                        type="file"
                                        onChange={handleQrUpload}
                                        accept="image/jpeg,image/jpg,image/png"
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-lg file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-primary/10 file:text-primary
                                            hover:file:bg-primary/20
                                            cursor-pointer"
                                        disabled={qrUploading}
                                    />
                                    {qrImage && (
                                        <button
                                            type="button"
                                            onClick={handleQrDelete}
                                            disabled={qrUploading}
                                            className="h-10 px-4 bg-red-50 text-red-600 hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed font-medium rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                            Hapus
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Format: JPG, PNG. Maksimal 2MB. QR code ini akan ditampilkan ke user saat melakukan top-up.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QRIS Configuration */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Konfigurasi QRIS</h3>

                        {qrisMessage.text && (
                            <div className={`mb-6 p-4 rounded-lg border ${qrisMessage.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                                }`}>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">
                                        {qrisMessage.type === 'success' ? 'check_circle' : 'error'}
                                    </span>
                                    <span className="text-sm font-medium">{qrisMessage.text}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Mode Selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    Mode QRIS
                                </label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleQrisModeChange('static')}
                                        disabled={qrisLoading}
                                        className={`flex-1 h-12 px-4 rounded-lg border font-medium transition-colors ${qrisMode === 'static'
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        Static (Upload)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleQrisModeChange('dynamic')}
                                        disabled={qrisLoading}
                                        className={`flex-1 h-12 px-4 rounded-lg border font-medium transition-colors ${qrisMode === 'dynamic'
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        Dynamic (Form)
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Static: Upload gambar QR. Dynamic: Parse dan isi data QRIS dari string.
                                </p>
                            </div>

                            {/* Static Mode UI */}
                            {qrisMode === 'static' && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Mode static menggunakan fitur upload QR Code di atas. Silakan scroll ke atas untuk mengupload gambar QR Code.
                                    </p>
                                </div>
                            )}

                            {/* Dynamic Mode UI */}
                            {qrisMode === 'dynamic' && (
                                <div className="space-y-6">
                                    {/* QRIS String Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            QRIS String
                                        </label>
                                        <textarea
                                            value={qrisString}
                                            onChange={(e) => setQrisString(e.target.value)}
                                            placeholder="Paste QRIS string di sini (contoh: 00020101021126670016COM.NOBUBANK.WWW...)"
                                            className="w-full h-24 px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white resize-none font-mono"
                                            disabled={qrisLoading}
                                        />
                                        <div className="flex gap-3 mt-3">
                                            <button
                                                type="button"
                                                onClick={handleParseQris}
                                                disabled={qrisLoading || !qrisString.trim()}
                                                className="h-10 px-6 bg-primary hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                {qrisLoading && <span className="animate-spin material-symbols-outlined">progress_activity</span>}
                                                Parse QRIS
                                            </button>
                                        </div>
                                    </div>

                                    {/* Parsed Data Display */}
                                    {qrisLabels && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-slate-900 dark:text-white">Data QRIS Terparsing</h4>
                                                <button
                                                    type="button"
                                                    onClick={handleSaveQrisData}
                                                    disabled={qrisLoading}
                                                    className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                                >
                                                    {qrisLoading && <span className="animate-spin material-symbols-outlined">progress_activity</span>}
                                                    Simpan Data
                                                </button>
                                            </div>

                                            {Object.entries(qrisLabels).map(([sectionKey, section]) => (
                                                <div key={sectionKey} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <h5 className="font-medium text-slate-900 dark:text-white mb-3">{section.label}</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {Object.entries(section.fields).map(([fieldKey, field]) => (
                                                            <div key={fieldKey}>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">{field.label}</p>
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                                                                    {field.value}
                                                                    {field.description && (
                                                                        <span className="text-xs text-slate-500 ml-2">({field.description})</span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Note */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-600">info</span>
                        <div>
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>Catatan:</strong> Mengubah margin hanya akan mempengaruhi produk yang baru disinkronisasi. Produk yang sudah ada akan tetap menggunakan harga jual saat ini kecuali Anda melakukan sinkronisasi ulang.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
