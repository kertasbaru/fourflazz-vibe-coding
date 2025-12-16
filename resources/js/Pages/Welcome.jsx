import { Head, Link } from '@inertiajs/react';

export default function Welcome({ canLogin, canRegister }) {
    return (
        <>
            <Head title="Welcome to Fourflazz - Digital Products Platform" />

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
                {/* Navigation */}
                <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-10 bg-primary rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">bolt</span>
                        </div>
                        <span className="text-xl font-bold">Fourflazz</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {canLogin && (
                            <Link
                                href={route('login')}
                                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                            >
                                Login
                            </Link>
                        )}
                        {canRegister && (
                            <Link
                                href={route('register')}
                                className="text-sm font-medium px-4 py-2 bg-primary hover:bg-blue-600 rounded-lg transition-colors"
                            >
                                Get Started
                            </Link>
                        )}
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="container mx-auto px-4 pt-20 pb-32">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-8 backdrop-blur-sm">
                            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                            <span>Trusted by thousands of users</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            All Your Digital
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> Products </span>
                            in One Place
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                            Buy phone credit, data packages, electricity tokens, e-wallets, and game vouchers instantly. Fast, secure, and reliable.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href={route('register')}
                                className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                <span>Start Now</span>
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </Link>
                            <Link
                                href={route('login')}
                                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl transition-all"
                            >
                                I Have an Account
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="bg-white/5 backdrop-blur-lg py-20">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-4">Available Products</h2>
                        <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
                            Everything you need, available 24/7 with instant delivery
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                                { icon: 'phone_android', name: 'Phone Credit', color: 'from-rose-500 to-pink-500' },
                                { icon: 'signal_cellular_alt', name: 'Data Packages', color: 'from-blue-500 to-cyan-500' },
                                { icon: 'bolt', name: 'PLN Tokens', color: 'from-amber-500 to-orange-500' },
                                { icon: 'account_balance_wallet', name: 'E-Wallets', color: 'from-emerald-500 to-teal-500' },
                                { icon: 'sports_esports', name: 'Game Vouchers', color: 'from-purple-500 to-violet-500' },
                                { icon: 'health_and_safety', name: 'BPJS', color: 'from-red-500 to-rose-500' },
                            ].map((item, index) => (
                                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/20 transition-all group cursor-pointer">
                                    <div className={`size-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <span className="material-symbols-outlined text-white text-[28px]">{item.icon}</span>
                                    </div>
                                    <h3 className="font-semibold">{item.name}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center p-6">
                                <div className="size-16 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-[32px]">bolt</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3">Instant Delivery</h3>
                                <p className="text-slate-400">Your purchases are processed instantly, 24 hours a day, 7 days a week.</p>
                            </div>
                            <div className="text-center p-6">
                                <div className="size-16 mx-auto mb-6 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-400 text-[32px]">verified_user</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3">Secure Payments</h3>
                                <p className="text-slate-400">All transactions are secured with industry-standard encryption and trusted payment gateways.</p>
                            </div>
                            <div className="text-center p-6">
                                <div className="size-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-purple-400 text-[32px]">support_agent</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3">24/7 Support</h3>
                                <p className="text-slate-400">Our support team is always ready to help you with any issues or questions.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-r from-primary to-blue-600">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
                        <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                            Join thousands of users who trust Fourflazz for their digital product needs.
                        </p>
                        <Link
                            href={route('register')}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-semibold rounded-xl hover:bg-blue-50 transition-colors"
                        >
                            <span>Create Free Account</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 border-t border-white/10">
                    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[18px]">bolt</span>
                            </div>
                            <span className="font-bold">Fourflazz</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            © {new Date().getFullYear()} Fourflazz. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
