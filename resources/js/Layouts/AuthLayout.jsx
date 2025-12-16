import { Link } from '@inertiajs/react';

export default function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display antialiased text-slate-900 dark:text-white">
            {/* Navbar */}
            <header className="w-full bg-white dark:bg-[#1a2332] border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary">
                                <span className="material-symbols-outlined text-2xl">bolt</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Fourflazz</span>
                        </Link>
                        {/* Right Side Actions */}
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-400">
                                New here? <Link href={route('register')} className="text-primary hover:text-primary-dark font-semibold">Sign up</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-6xl bg-white dark:bg-[#1a2332] rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                    {/* Left Side: Visual / Branding */}
                    <div className="relative w-full md:w-1/2 bg-primary flex flex-col justify-between p-8 md:p-12 text-white">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary via-[#2d6ef0] to-[#0e45b5]"></div>

                        {/* Content over gradient */}
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-3xl">bolt</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                                    All Your Digital Products in One Place
                                </h1>
                                <p className="text-blue-100 text-lg max-w-sm">
                                    Buy phone credit, data packages, electricity tokens, and more. Fast, secure, and available 24/7.
                                </p>
                            </div>

                            {/* Features */}
                            <div className="space-y-4 mt-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[18px]">bolt</span>
                                    </div>
                                    <span className="text-sm text-blue-100">Instant delivery within seconds</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                                    </div>
                                    <span className="text-sm text-blue-100">Secure payment with Midtrans</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[18px]">support_agent</span>
                                    </div>
                                    <span className="text-sm text-blue-100">24/7 customer support</span>
                                </div>
                            </div>

                            {/* Product Icons */}
                            <div className="flex items-center gap-3 mt-8">
                                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center" title="Credit">
                                    <span className="material-symbols-outlined text-[20px]">phone_android</span>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center" title="Data">
                                    <span className="material-symbols-outlined text-[20px]">signal_cellular_alt</span>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center" title="PLN">
                                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center" title="E-Wallet">
                                    <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center" title="Games">
                                    <span className="material-symbols-outlined text-[20px]">sports_esports</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full">
                            <div className="text-center md:text-left mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
                                <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
                            </div>

                            {children}
                        </div>
                    </div>
                </div>

                {/* Footer for copyright */}
                <div className="fixed bottom-4 text-center w-full pointer-events-none hidden md:block">
                    <p className="text-xs text-slate-400 dark:text-slate-600">© {new Date().getFullYear()} Fourflazz. All rights reserved.</p>
                </div>
            </main>
        </div>
    );
}
