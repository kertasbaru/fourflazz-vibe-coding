import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function AdminLayout({ children }) {
    const { auth, flash } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
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

    const navigation = [
        { name: 'Dasbor', href: route('admin.dashboard'), icon: 'dashboard', current: route().current('admin.dashboard') },
        { name: 'Produk', href: route('admin.products.index'), icon: 'inventory_2', current: route().current('admin.products.*') },
        { name: 'Kategori', href: route('admin.categories.index'), icon: 'category', current: route().current('admin.categories.*') },
        { name: 'Pengguna', href: route('admin.users.index'), icon: 'group', current: route().current('admin.users.*') },
        { name: 'Transaksi', href: route('admin.transactions.index'), icon: 'receipt_long', current: route().current('admin.transactions.*') },
        { name: 'Request Top Up', href: route('admin.topups.index'), icon: 'account_balance_wallet', current: route().current('admin.topups.*') },
        { name: 'Penyedia API', href: route('admin.providers.index'), icon: 'cloud_sync', current: route().current('admin.providers.*') },
        { name: 'Log API', href: route('admin.api-logs.index'), icon: 'history', current: route().current('admin.api-logs.*') },
        { name: 'Log Webhook', href: route('admin.webhook-logs.index'), icon: 'webhook', current: route().current('admin.webhook-logs.*') },
        { name: 'Log Sistem', href: route('admin.logs.index'), icon: 'terminal', current: route().current('admin.logs.*') },
        { name: 'Pengaturan', href: route('admin.settings.index'), icon: 'settings', current: route().current('admin.settings.*') },
    ];

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display min-h-screen">
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
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-normal pl-10">Admin Panel</p>
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

                        <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                        <Link
                            href={route('dashboard')}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                            <span className="text-sm font-medium">Kembali ke Aplikasi</span>
                        </Link>
                    </nav>

                    {/* Bottom */}
                    <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4">
                        <button
                            onClick={toggleDarkMode}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full"
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                {darkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                            <span className="text-sm font-medium">{darkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
                        </button>
                        <div className="flex items-center gap-3 mt-4 px-3">
                            <div className="size-8 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white text-sm font-semibold">
                                {auth.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{auth.user?.name}</span>
                                <span className="text-xs text-slate-500">Administrator</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 min-h-screen flex flex-col">
                <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
                    <button
                        className="md:hidden text-slate-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">
                        <button className="size-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                    </div>
                </header>

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

                <div className="flex-1 p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
