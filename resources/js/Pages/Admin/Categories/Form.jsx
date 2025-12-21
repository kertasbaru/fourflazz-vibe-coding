import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

const iconOptions = [
    'phone_android', 'signal_cellular_alt', 'bolt', 'account_balance_wallet',
    'sports_esports', 'health_and_safety', 'wifi', 'tv', 'local_gas_station',
    'water_drop', 'school', 'flight', 'train', 'directions_bus',
];

export default function AdminCategoryForm({ category }) {
    const isEditing = !!category;

    const { data, setData, post, put, processing, errors } = useForm({
        name: category?.name || '',
        icon: category?.icon || 'category',
        description: category?.description || '',
        is_active: category?.is_active ?? true,
        sort_order: category?.sort_order || 0,
        input_type: category?.input_type || '',
        category_group: category?.category_group || '',
        badge_label: category?.badge_label || '',
        badge_color: category?.badge_color || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('admin.categories.update', category.id));
        } else {
            post(route('admin.categories.store'));
        }
    };

    return (
        <AdminLayout>
            <Head title={isEditing ? 'Edit Kategori' : 'Buat Kategori'} />

            <div className="max-w-2xl mx-auto">
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Link href={route('admin.categories.index')} className="hover:text-primary">Categories</Link>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    <span className="text-slate-900 dark:text-white">{isEditing ? 'Edit' : 'Create'}</span>
                </nav>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isEditing ? 'Edit Category' : 'Create New Category'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Category Name *
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g., Pulsa, Paket Data"
                                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Icon
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                                {iconOptions.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setData('icon', icon)}
                                        className={`p-3 rounded-lg border-2 flex items-center justify-center transition-colors ${data.icon === icon
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined">{icon}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                                placeholder="Brief description of this category"
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Input Type
                            </label>
                            <select
                                value={data.input_type}
                                onChange={(e) => setData('input_type', e.target.value)}
                                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            >
                                <option value="">None</option>
                                <option value="phone">Phone Number</option>
                                <option value="customer_id">Customer ID</option>
                                <option value="email">Email</option>
                                <option value="text">Text</option>
                            </select>
                            {errors.input_type && <p className="text-red-500 text-sm mt-1">{errors.input_type}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Category Group
                            </label>
                            <input
                                type="text"
                                value={data.category_group}
                                onChange={(e) => setData('category_group', e.target.value)}
                                placeholder="e.g., Pulsa & Data, Financial, Games"
                                className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                            {errors.category_group && <p className="text-red-500 text-sm mt-1">{errors.category_group}</p>}
                            <p className="text-xs text-slate-500 mt-1">Used to group related categories together</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Badge Label
                                </label>
                                <input
                                    type="text"
                                    value={data.badge_label}
                                    onChange={(e) => setData('badge_label', e.target.value)}
                                    placeholder="e.g., New, Popular"
                                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                />
                                {errors.badge_label && <p className="text-red-500 text-sm mt-1">{errors.badge_label}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Badge Color
                                </label>
                                <input
                                    type="text"
                                    value={data.badge_color}
                                    onChange={(e) => setData('badge_color', e.target.value)}
                                    placeholder="e.g., blue, green, red"
                                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                />
                                {errors.badge_color && <p className="text-red-500 text-sm mt-1">{errors.badge_color}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Sort Order
                            </label>
                            <input
                                type="number"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                className="w-32 h-10 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Active (visible to customers)
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Link
                                href={route('admin.categories.index')}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : (isEditing ? 'Update Category' : 'Create Category')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
