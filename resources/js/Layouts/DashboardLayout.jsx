import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

export default function DashboardLayout({ children }) {
    const { auth, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        // Check for saved dark mode preference
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode === 'true') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'false');
        }
    };

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const navigation = [
        { name: 'Dashboard', href: route('dashboard'), icon: 'dashboard', current: route().current('dashboard') },
        { name: 'Products', href: route('products.index'), icon: 'inventory_2', current: route().current('products.*') },
        { name: 'Transactions', href: route('transactions.index'), icon: 'receipt_long', current: route().current('transactions.*') },
        { name: 'OTP Sessions', href: route('otp-sessions.index'), icon: 'verified_user', current: route().current('otp-sessions.*') },
        { name: 'Top Up', href: route('topup.index'), icon: 'account_balance_wallet', current: route().current('topup.*') },
    ];

    const adminNavigation = auth.user?.role === 'admin' ? [
        { name: 'Admin Panel', href: route('admin.dashboard'), icon: 'admin_panel_settings', current: route().current('admin.*') },
    ] : [];

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display min-h-screen">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full p-4">
                    {/* Branding */}
                    <div className="flex flex-col gap-1 mb-8 px-2">
                        <div className="flex items-center gap-2">
                            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                                <span className="material-symbols-outlined text-[20px]">bolt</span>
                            </div>
                            <h1 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">Fourflazz</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-normal pl-10">Digital Products</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-1 flex-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${item.current
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[22px] ${item.current ? 'filled' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className="text-sm font-medium">{item.name}</span>
                            </Link>
                        ))}

                        {adminNavigation.length > 0 && (
                            <>
                                <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
                                {adminNavigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${item.current
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-[22px] ${item.current ? 'filled' : ''}`}>
                                            {item.icon}
                                        </span>
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </Link>
                                ))}
                            </>
                        )}
                    </nav>

                    {/* Bottom Actions */}
                    <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
                        <button
                            onClick={toggleDarkMode}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full"
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                {darkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                            <span className="text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>
                        <Link
                            href={route('profile.edit')}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${route().current('profile.*')
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[22px]">settings</span>
                            <span className="text-sm font-medium">Settings</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                        >
                            <span className="material-symbols-outlined text-[22px]">logout</span>
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                        <div className="flex items-center gap-3 mt-4 px-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="size-10 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white text-sm font-semibold">
                                {auth.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{auth.user?.name}</span>
                                <span className="text-xs text-slate-500">{auth.user?.email}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 min-h-screen flex flex-col">
                {/* Top Nav */}
                <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            className="md:hidden text-slate-500"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        {/* Search */}
                        <div className="hidden md:flex items-center max-w-md w-full relative">
                            <span className="material-symbols-outlined absolute left-3 text-slate-400">search</span>
                            <input
                                className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary placeholder:text-slate-400 text-slate-900 dark:text-white transition-shadow"
                                placeholder="Search products..."
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Balance Display */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <span className="material-symbols-outlined text-[18px] text-primary">account_balance_wallet</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {auth.user?.formatted_balance || 'Rp 0'}
                            </span>
                        </div>
                        <button className="size-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <Link
                            href={route('topup.index')}
                            className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-200 dark:shadow-none flex items-center gap-2 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span className="hidden sm:inline">Top Up</span>
                        </Link>
                    </div>
                </header>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mx-4 md:mx-6 mt-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-4 md:mx-6 mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center gap-3">
                        <span className="material-symbols-outlined">error</span>
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Page Content */}
                <div className="flex-1 p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
