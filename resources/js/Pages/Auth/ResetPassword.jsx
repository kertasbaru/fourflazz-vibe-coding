import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function ResetPassword({ token, email }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Buat Kata Sandi Baru"
            subtitle="Pilih kata sandi yang kuat untuk mengamankan akun Fourflazz Anda."
        >
            <Head title="Reset Kata Sandi" />

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                        Alamat Email
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                        </div>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-slate-100 dark:bg-[#131b26] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
                            autoComplete="email"
                            readOnly
                        />
                    </div>
                    {errors.email && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                        Kata Sandi Baru
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="block w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-[#131b26] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Masukkan kata sandi baru"
                            autoComplete="new-password"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                        Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                        </div>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="block w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-[#131b26] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Konfirmasi kata sandi baru"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {showConfirmPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                    {errors.password_confirmation && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.password_confirmation}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? 'Mereset...' : 'Reset Kata Sandi'}
                </button>
            </form>
        </AuthLayout>
    );
}
