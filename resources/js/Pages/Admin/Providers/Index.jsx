import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

function ProviderCard({ provider, onFetchProducts, onCheckBalance, onSync, onPartialSync, onRefreshBalance, loading, balance }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`size-12 ${provider.enabled ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700'} rounded-xl flex items-center justify-center`}>
                        <span className={`material-symbols-outlined text-[24px] ${provider.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                            cloud_sync
                        </span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {provider.display_name}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${provider.enabled
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                {provider.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            {provider.synced_products > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    {provider.synced_products} synced
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Balance Display */}
            {balance && balance[provider.name] && (
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Balance</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-300">
                                {balance[provider.name].balance_formatted || 'N/A'}
                            </p>
                        </div>
                        <button
                            onClick={() => onRefreshBalance(provider.name)}
                            disabled={!provider.enabled || loading}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh balance"
                        >
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">refresh</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 mt-4">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onFetchProducts(provider.name)}
                        disabled={!provider.enabled || loading}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                        <span className="text-sm font-medium">Products</span>
                    </button>
                    <button
                        onClick={() => onCheckBalance(provider.name)}
                        disabled={!provider.enabled || loading}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                        <span className="text-sm font-medium">Balance</span>
                    </button>
                </div>
                <button
                    onClick={() => onSync(provider.name, 'full')}
                    disabled={!provider.enabled || loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                    <span className="text-sm font-medium">Full Sync</span>
                </button>
                <button
                    onClick={() => onPartialSync(provider.name)}
                    disabled={!provider.enabled || loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-[18px]">update</span>
                    <span className="text-sm font-medium">Partial Sync (Stock & Price)</span>
                </button>
            </div>
        </div>
    );
}

function ResultModal({ isOpen, onClose, title, data, loading, error, isSuccess }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-auto max-h-[60vh]">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="text-slate-500">Processing...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-red-500">error</span>
                                <div>
                                    <p className="font-medium text-red-700 dark:text-red-400">Error</p>
                                    <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && !error && isSuccess && data?.message && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                                <div>
                                    <p className="font-medium text-emerald-700 dark:text-emerald-400">Success</p>
                                    <p className="text-emerald-600 dark:text-emerald-300 mt-1">{data.message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && !error && data && (
                        <div>
                            {data.stats && (
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-emerald-600">{data.stats.created}</p>
                                        <p className="text-xs text-emerald-700 dark:text-emerald-400">Created</p>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-600">{data.stats.updated}</p>
                                        <p className="text-xs text-blue-700 dark:text-blue-400">Updated</p>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{data.stats.skipped}</p>
                                        <p className="text-xs text-slate-500">Skipped</p>
                                    </div>
                                </div>
                            )}

                            {data.count !== undefined && (
                                <p className="text-sm text-slate-500 mb-2">
                                    Total products: <span className="font-semibold">{data.count}</span>
                                </p>
                            )}

                            <details className="mt-4">
                                <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-700">
                                    View raw response
                                </summary>
                                <pre className="mt-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg overflow-auto text-xs text-slate-700 dark:text-slate-300">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ProvidersIndex({ providers }) {
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [modalSuccess, setModalSuccess] = useState(false);
    const [balances, setBalances] = useState({});

    const fetchProducts = async (providerName) => {
        setLoading(true);
        setModalOpen(true);
        setModalTitle(`Products from ${providerName.toUpperCase()}`);
        setModalData(null);
        setModalError(null);
        setModalSuccess(false);

        try {
            const response = await fetch(`/admin/providers/${providerName}/products`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await response.json();

            if (data.success) {
                setModalData(data);
                setModalSuccess(true);
            } else {
                setModalError(data.message || 'Failed to fetch products');
            }
        } catch (error) {
            setModalError('Network error: Unable to connect to the server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const checkBalance = async (providerName) => {
        setLoading(true);
        setModalOpen(true);
        setModalTitle(`Balance for ${providerName.toUpperCase()}`);
        setModalData(null);
        setModalError(null);
        setModalSuccess(false);

        try {
            const response = await fetch(`/admin/providers/${providerName}/balance`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await response.json();

            if (data.success) {
                setModalData(data);
                setModalSuccess(true);
                // Cache the balance
                setBalances(prev => ({
                    ...prev,
                    [providerName]: data.data
                }));
            } else {
                setModalError(data.message || 'Failed to check balance');
            }
        } catch (error) {
            setModalError('Network error: Unable to connect to the server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const refreshBalance = async (providerName) => {
        setLoading(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch(`/admin/providers/${providerName}/refresh-balance`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });
            const data = await response.json();

            if (data.success) {
                // Update cached balance
                setBalances(prev => ({
                    ...prev,
                    [providerName]: data.data
                }));
            } else {
                setModalOpen(true);
                setModalTitle('Error');
                setModalError(data.message || 'Failed to refresh balance');
            }
        } catch (error) {
            setModalOpen(true);
            setModalTitle('Error');
            setModalError('Network error: Unable to refresh balance.');
        } finally {
            setLoading(false);
        }
    };

    const syncProducts = async (providerName) => {
        setLoading(true);
        setModalOpen(true);
        setModalTitle(`Syncing products from ${providerName.toUpperCase()}`);
        setModalData(null);
        setModalError(null);
        setModalSuccess(false);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch(`/admin/providers/${providerName}/sync`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });
            const data = await response.json();

            if (data.success) {
                setModalData(data);
                setModalSuccess(true);
                // Refresh the page to update synced counts
                setTimeout(() => {
                    router.reload({ only: ['providers'] });
                }, 1500);
            } else {
                setModalError(data.message || 'Failed to sync products');
            }
        } catch (error) {
            setModalError('Network error: Unable to connect to the server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const partialSync = async (providerName) => {
        setLoading(true);
        setModalOpen(true);
        setModalTitle(`Partial sync from ${providerName.toUpperCase()}`);
        setModalData(null);
        setModalError(null);
        setModalSuccess(false);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch(`/admin/providers/${providerName}/partial-sync`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });
            const data = await response.json();

            if (data.success) {
                setModalData(data);
                setModalSuccess(true);
                // Refresh the page to update data
                setTimeout(() => {
                    router.reload({ only: ['providers'] });
                }, 1500);
            } else {
                setModalError(data.message || 'Failed to sync stock and prices');
            }
        } catch (error) {
            setModalError('Network error: Unable to connect to the server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Penyedia API" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                        API Providers
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage product API providers (KMSP, KAJE, etc.)
                    </p>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-600">info</span>
                        <div>
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                Configure your API keys in the <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env</code> file:
                            </p>
                            <pre className="mt-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/50 p-2 rounded">
                                {`KMSP_API_KEY=your_kmsp_api_key
KAJE_API_KEY=your_kaje_api_key`}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Providers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providers && providers.map((provider) => (
                        <ProviderCard
                            key={provider.name}
                            provider={provider}
                            onFetchProducts={fetchProducts}
                            onCheckBalance={checkBalance}
                            onSync={syncProducts}
                            onPartialSync={partialSync}
                            onRefreshBalance={refreshBalance}
                            loading={loading}
                            balance={balances}
                        />
                    ))}
                </div>

                {(!providers || providers.length === 0) && (
                    <div className="text-center py-12 text-slate-500">
                        No providers configured
                    </div>
                )}
            </div>

            <ResultModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalTitle}
                data={modalData}
                loading={loading}
                error={modalError}
                isSuccess={modalSuccess}
            />
        </AdminLayout>
    );
}
