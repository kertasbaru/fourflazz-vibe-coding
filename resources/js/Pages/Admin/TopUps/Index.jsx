import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

function ImageModal({ isOpen, onClose, src }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
            <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:text-gray-300">
                    <span className="material-symbols-outlined text-3xl">close</span>
                </button>
                <img src={src} alt="Bukti Transfer" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
            </div>
        </div>
    );
}

export default function AdminTopUpsIndex({ topups, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [previewImage, setPreviewImage] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const handleFilter = (key, value) => {
        router.get(route('admin.topups.index'), {
            ...filters,
            [key]: value || undefined,
        }, { preserveState: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        handleFilter('search', search);
    };

    const handleUpdateStatus = async (id, newStatus) => {
        const action = newStatus === 'paid' ? 'menyetujui' : 'menolak';
        if (!confirm(`Apakah Anda yakin ingin ${action} permintaan top up ini?`)) return;

        setProcessingId(id);
        try {
            await router.post(route('admin.topups.update-status', id), { status: newStatus });
        } finally {
            setProcessingId(null);
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value);

    const statusStyles = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        expired: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    };

    const statusLabel = {
        pending: 'Menunggu',
        paid: 'Berhasil',
        failed: 'Gagal',
        expired: 'Kadaluarsa',
        cancelled: 'Dibatalkan'
    };

    return (
        <AdminLayout>
            <Head title="Permintaan Top Up" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Permintaan Top Up</h2>
                    <p className="text-slate-500">Kelola permintaan top up pengguna dan verifikasi pembayaran</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari ID Order atau pengguna..."
                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                        </div>
                        <button type="submit" className="h-10 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
                            Cari
                        </button>
                    </form>
                    <div className="flex items-center gap-2 flex-wrap">
                        {['', 'pending', 'paid', 'failed'].map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    setStatus(s);
                                    handleFilter('status', s);
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium ${status === s
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                {s ? statusLabel[s] : 'Semua'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">ID Order</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Pengguna</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Total Transfer</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Kode Unik</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Bukti</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {topups.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="py-4 px-4 text-sm text-slate-500">
                                            {new Date(item.created_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-sm font-mono text-primary">{item.order_id}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{item.user?.name}</div>
                                            <div className="text-xs text-slate-500">{item.user?.email}</div>
                                        </td>
                                        <td className="py-4 px-4 text-sm font-bold text-slate-900 dark:text-white">
                                            Rp {formatCurrency(item.total_amount)}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
                                                +{item.unique_code}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            {item.payment_proof ? (
                                                <button
                                                    onClick={() => setPreviewImage(`/storage/${item.payment_proof}`)}
                                                    className="flex items-center gap-1 text-primary hover:underline text-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg">image</span>
                                                    Lihat
                                                </button>
                                            ) : (
                                                <span className="text-slate-400 text-xs text-center block">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[item.status] || 'bg-slate-100 text-slate-600'}`}>
                                                {statusLabel[item.status] || item.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            {item.status !== 'paid' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, 'paid')}
                                                        disabled={processingId === item.id}
                                                        className="p-1 px-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors"
                                                        title="Terima / Setujui"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">check</span>
                                                        Terima
                                                    </button>
                                                    {item.status !== 'failed' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(item.id, 'failed')}
                                                            disabled={processingId === item.id}
                                                            className="p-1 px-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors"
                                                            title="Tolak"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">close</span>
                                                            Tolak
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {topups.data.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="py-12 text-center text-slate-500">
                                            Tidak ada permintaan top up ditemukan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {topups.links && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        {topups.links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={`px-3 py-1.5 rounded text-sm font-medium ${link.active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ImageModal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                src={previewImage}
            />
        </AdminLayout>
    );
}
