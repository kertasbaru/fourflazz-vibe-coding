import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Konfirmasi Kata Sandi"
            subtitle="Ini area aman. Harap konfirmasi kata sandi Anda untuk melanjutkan."
        >
            <Head title="Konfirmasi Kata Sandi" />

            {/* Security Icon */}
            <div className="flex justify-center mb-6">
                <div className="size-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-amber-600">security</span>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                        Kata Sandi
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
                            placeholder="Masukkan kata sandi Anda"
                            autoComplete="current-password"
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

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? (
                        <>
                            <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                            Mengkonfirmasi...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-lg">verified_user</span>
                            Konfirmasi Kata Sandi
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
}
