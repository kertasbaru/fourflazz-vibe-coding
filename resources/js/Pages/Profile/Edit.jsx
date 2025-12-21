import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Profile form
    const profileForm = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    // Password form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Delete form
    const deleteForm = useForm({
        password: '',
    });

    const updateProfile = (e) => {
        e.preventDefault();
        profileForm.patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    const updatePassword = (e) => {
        e.preventDefault();
        passwordForm.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const deleteAccount = (e) => {
        e.preventDefault();
        deleteForm.delete(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => setShowDeleteModal(false),
        });
    };

    return (
        <DashboardLayout>
            <Head title="Pengaturan Profil" />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Pengaturan Profil</h2>
                    <p className="text-slate-500 dark:text-slate-400">Kelola pengaturan dan preferensi akun Anda</p>
                </div>

                <div className="space-y-6">
                    {/* Profile Information */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-4">
                                <div className="size-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Informasi Profil</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Perbarui informasi profil dan alamat email akun Anda.</p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={updateProfile} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama</label>
                                <input
                                    type="text"
                                    value={profileForm.data.name}
                                    onChange={(e) => profileForm.setData('name', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                {profileForm.errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{profileForm.errors.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={(e) => profileForm.setData('email', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                {profileForm.errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{profileForm.errors.email}</p>
                                )}
                            </div>
                            {mustVerifyEmail && auth.user.email_verified_at === null && (
                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                                    <p className="text-sm">
                                        Alamat email Anda belum diverifikasi.
                                        <button className="underline ml-1" onClick={() => route('verification.send')}>
                                            Klik di sini untuk mengirim ulang email verifikasi.
                                        </button>
                                    </p>
                                    {status === 'verification-link-sent' && (
                                        <p className="mt-2 text-sm text-emerald-600">Tautan verifikasi baru telah dikirim ke alamat email Anda.</p>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="px-6 py-2.5 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {profileForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Update Password */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perbarui Kata Sandi</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Pastikan akun Anda menggunakan kata sandi yang panjang dan acak agar tetap aman.</p>
                        </div>
                        <form onSubmit={updatePassword} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kata Sandi Saat Ini</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="mt-1 text-sm text-red-600">{passwordForm.errors.current_password}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kata Sandi Baru</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                {passwordForm.errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{passwordForm.errors.password}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Konfirmasi Kata Sandi</label>
                                <input
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="mt-1 text-sm text-red-600">{passwordForm.errors.password_confirmation}</p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="px-6 py-2.5 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {passwordForm.processing ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Delete Account */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Hapus Akun</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
                                Setelah akun Anda dihapus, semua sumber daya dan datanya akan dihapus secara permanen.
                                Sebelum menghapus akun Anda, harap unduh data atau informasi apa pun yang ingin Anda simpan.
                            </p>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Hapus Akun
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Apakah Anda yakin?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Tindakan ini tidak dapat dibatalkan. Harap masukkan kata sandi Anda untuk konfirmasi.
                        </p>
                        <form onSubmit={deleteAccount}>
                            <input
                                type="password"
                                placeholder="Masukkan kata sandi Anda"
                                value={deleteForm.data.password}
                                onChange={(e) => deleteForm.setData('password', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary mb-4"
                            />
                            {deleteForm.errors.password && (
                                <p className="mb-4 text-sm text-red-600">{deleteForm.errors.password}</p>
                            )}
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteForm.processing}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {deleteForm.processing ? 'Menghapus...' : 'Hapus Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
