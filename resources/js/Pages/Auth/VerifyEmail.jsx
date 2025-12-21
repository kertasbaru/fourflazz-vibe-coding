import { Head, Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <AuthLayout
            title="Verifikasi Email Anda"
            subtitle="Kami telah mengirim tautan verifikasi ke alamat email Anda."
        >
            <Head title="Verifikasi Email" />

            {/* Email Icon */}
            <div className="flex justify-center mb-6">
                <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-primary">mark_email_unread</span>
                </div>
            </div>

            <div className="text-center mb-6">
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Terima kasih telah mendaftar! Sebelum memulai, verifikasi alamat email Anda
                    dengan mengklik tautan yang baru saja kami kirim.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    Tautan verifikasi baru telah dikirim ke alamat email Anda.
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? (
                        <>
                            <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                            Mengirim...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg">send</span>
                            Kirim Ulang Email Verifikasi
                        </>
                    )}
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-[#1a2332] text-slate-500 dark:text-slate-400">atau</span>
                    </div>
                </div>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Keluar
                </Link>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Tidak menerima email? Periksa folder spam Anda atau{' '}
                <button
                    onClick={submit}
                    disabled={processing}
                    className="font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                    kirim ulang
                </button>
            </p>
        </AuthLayout>
    );
}
