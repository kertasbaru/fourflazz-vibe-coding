import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';

export default function SettingsIndex({ settings }) {
    const [margin, setMargin] = useState(settings.product_margin || 10);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.post(route('admin.settings.update'), {
                product_margin: parseFloat(margin),
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update settings';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Settings" />

            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Settings</h2>
                    <p className="text-slate-500">Configure application settings</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Product Settings</h3>

                        {message.text && (
                            <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                                }`}>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">
                                        {message.type === 'success' ? 'check_circle' : 'error'}
                                    </span>
                                    <span className="text-sm font-medium">{message.text}</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Product Margin (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={margin}
                                        onChange={(e) => setMargin(e.target.value)}
                                        step="0.1"
                                        min="0"
                                        max="1000"
                                        className="w-full md:w-64 h-12 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        This margin will be applied when syncing products from API providers (KMSP, KAJE, etc).
                                        <br />
                                        Example: If margin is 10%, a product with price Rp 10,000 will have selling price Rp 11,000.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="h-12 px-6 bg-primary hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {loading && <span className="animate-spin material-symbols-outlined">progress_activity</span>}
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-600">info</span>
                        <div>
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>Note:</strong> Changing the margin will only affect newly synced products. Existing products will keep their current selling price unless you re-sync them.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
