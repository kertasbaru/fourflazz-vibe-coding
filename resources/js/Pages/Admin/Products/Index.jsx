import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useRef } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

// Confirmation Modal Component
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', isDangerous = false }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inertial z-50 overflow-y-auto" aria-labelledby="modal - title" role="dialog" aria-modal="true">
            < div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0" >
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="px-6 pt-5 pb-4">
                        <div className="flex items-start gap-4">
                            <div className={`size-12 rounded-full ${isDangerous ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-100 dark:bg-blue-900/20'} flex items-center justify-center flex-shrink-0`}>
                                <span className={`material-symbols-outlined ${isDangerous ? 'text-red-600' : 'text-blue-600'}`}>
                                    {isDangerous ? 'warning' : 'info'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-blue-700'}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div >
        </div >
    );
}

// Margin Update Modal
function MarginModal({ isOpen, onClose, onConfirm, selectedCount }) {
    const [marginType, setMarginType] = useState('percentage');
    const [marginValue, setMarginValue] = useState('');

    const handleSubmit = () => {
        if (!marginValue || marginValue <= 0) {
            alert('Please enter a valid margin value');
            return;
        }
        onConfirm(marginType, parseFloat(marginValue));
        setMarginValue('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="px-6 pt-5 pb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Update Margin for {selectedCount} Product(s)
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Margin Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setMarginType('percentage')}
                                        className={`px-4 py-3 rounded-lg border-2 transition-all ${marginType === 'percentage'
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">percent</span>
                                        <span className="block text-sm font-medium mt-1">Percentage</span>
                                    </button>
                                    <button
                                        onClick={() => setMarginType('fixed')}
                                        className={`px-4 py-3 rounded-lg border-2 transition-all ${marginType === 'fixed'
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">attach_money</span>
                                        <span className="block text-sm font-medium mt-1">Fixed Amount</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    {marginType === 'percentage' ? 'Percentage (%)' : 'Amount (Rp)'}
                                </label>
                                <input
                                    type="number"
                                    value={marginValue}
                                    onChange={(e) => setMarginValue(e.target.value)}
                                    placeholder={marginType === 'percentage' ? 'e.g., 10' : 'e.g., 5000'}
                                    min="0"
                                    step={marginType === 'percentage' ? '0.1' : '100'}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    {marginType === 'percentage'
                                        ? 'New selling price = base price × (1 + percentage/100)'
                                        : 'New selling price = base price + fixed amount'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-700 rounded-lg"
                        >
                            Update Margin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Category Update Modal
function CategoryModal({ isOpen, onClose, onConfirm, categories, selectedCount }) {
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleSubmit = () => {
        if (!selectedCategory) {
            alert('Please select a category');
            return;
        }
        onConfirm(selectedCategory);
        setSelectedCategory('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="px-6 pt-5 pb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Update Category for {selectedCount} Product(s)
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            >
                                <option value="">Choose a category...</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-700 rounded-lg"
                        >
                            Update Category
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Import Modal
function ImportModal({ isOpen, onClose }) {
    const fileInput = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleSubmit = async (file) => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(route('admin.products.import'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: formData,
            });

            if (response.ok) {
                router.reload();
                onClose();
            } else {
                const data = await response.json();
                alert(data.message || 'Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Import failed. Please check the file format.');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) handleSubmit(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleSubmit(file);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="px-6 pt-5 pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Import Products
                            </h3>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver
                                    ? 'border-primary bg-primary/10'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">upload_file</span>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Drag and drop a CSV file here, or click to browse
                            </p>
                            <input
                                ref={fileInput}
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInput.current?.click()}
                                disabled={uploading}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {uploading ? 'Uploading...' : 'Choose File'}
                            </button>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                <strong>Tip:</strong> Use <code>product_code</code> to update existing products.
                                <br />
                                <a
                                    href={route('admin.products.template')}
                                    className="underline hover:no-underline"
                                >
                                    Download template CSV
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminProductsIndex({ products, categories, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [filterCategory, setFilterCategory] = useState(filters.category || '');
    const [filterStatus, setFilterStatus] = useState(filters.status || '');
    const [filterApiSource, setFilterApiSource] = useState(filters.api_source || '');
    const [filterNeedOtp, setFilterNeedOtp] = useState(filters.need_otp || '');

    // Bulk selection
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // Modals
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [marginModalOpen, setMarginModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(route('admin.products.index'), {
            search,
            category: filterCategory,
            status: filterStatus,
            api_source: filterApiSource,
            need_otp: filterNeedOtp,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setFilterCategory('');
        setFilterStatus('');
        setFilterApiSource('');
        setFilterNeedOtp('');
        router.get(route('admin.products.index'));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(products.data.map(p => p.id));
            setSelectAll(true);
        } else {
            setSelectedProducts([]);
            setSelectAll(false);
        }
    };

    const handleSelectProduct = (productId) => {
        if (selectedProducts.includes(productId)) {
            setSelectedProducts(selectedProducts.filter(id => id !== productId));
        } else {
            setSelectedProducts([...selectedProducts, productId]);
        }
    };

    const handleBulkInactive = async () => {
        if (selectedProducts.length === 0) return;

        setLoading(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(route('admin.products.bulk-inactive'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ product_ids: selectedProducts }),
            });

            const data = await response.json();
            if (data.success) {
                router.reload({ only: ['products'] });
                setSelectedProducts([]);
                setSelectAll(false);
            }
        } catch (error) {
            console.error('Bulk inactive error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        setLoading(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(route('admin.products.bulk-delete'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({ product_ids: selectedProducts }),
            });

            const data = await response.json();
            if (data.success) {
                router.reload({ only: ['products'] });
                setSelectedProducts([]);
                setSelectAll(false);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
        } finally {
            setLoading(false);
            setDeleteModalOpen(false);
        }
    };

    const handleBulkMargin = async (marginType, marginValue) => {
        setLoading(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(route('admin.products.bulk-margin'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    product_ids: selectedProducts,
                    margin_type: marginType,
                    margin_value: marginValue,
                }),
            });

            const data = await response.json();
            if (data.success) {
                router.reload({ only: ['products'] });
                setSelectedProducts([]);
                setSelectAll(false);
            }
        } catch (error) {
            console.error('Bulk margin error:', error);
        } finally {
            setLoading(false);
            setMarginModalOpen(false);
        }
    };

    const handleBulkCategory = async (categoryId) => {
        setLoading(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch(route('admin.products.bulk-category'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    product_ids: selectedProducts,
                    category_id: categoryId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                router.reload({ only: ['products'] });
                setSelectedProducts([]);
                setSelectAll(false);
            }
        } catch (error) {
            console.error('Bulk category error:', error);
        } finally {
            setLoading(false);
            setCategoryModalOpen(false);
        }
    };

    const formatCurrency = (value) => new Intl.NumberFormat('id-ID').format(value);

    const activeFilterCount = [filterCategory, filterStatus, filterApiSource, filterNeedOtp].filter(f => f).length;

    return (
        <AdminLayout>
            <Head title="Manage Products" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Products</h2>
                        <p className="text-slate-500">Manage your digital products</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={route('admin.products.export', { category: filters.category, status: filters.status, api_source: filters.api_source })}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Export
                        </a>
                        <button
                            onClick={() => setImportModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">upload</span>
                            Import
                        </button>
                        <Link
                            href={route('admin.products.create')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Add Product
                        </Link>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedProducts.length > 0 && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-primary">
                                {selectedProducts.length} product(s) selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkInactive}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px] mr-1">visibility_off</span>
                                Inactive
                            </button>
                            <button
                                onClick={() => setMarginModalOpen(true)}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px] mr-1">percent</span>
                                Update Margin
                            </button>
                            <button
                                onClick={() => setCategoryModalOpen(true)}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px] mr-1">folder</span>
                                Update Category
                            </button>
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                disabled={loading}
                                className="px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[16px] mr-1">delete</span>
                                Delete
                            </button>
                        </div>
                    </div>
                )}

                {/* Search & Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <form onSubmit={handleSearch} className="flex flex-col gap-4">
                        {/* Search Bar */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                />
                            </div>
                        </div>

                        {/* Filters Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">API Source</label>
                                <select
                                    value={filterApiSource}
                                    onChange={(e) => setFilterApiSource(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                >
                                    <option value="">All Sources</option>
                                    <option value="kmsp">KMSP</option>
                                    <option value="kaje">KAJE</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Need OTP</label>
                                <select
                                    value={filterNeedOtp}
                                    onChange={(e) => setFilterNeedOtp(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                >
                                    <option value="">All</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>

                            <div className="flex items-end gap-2">
                                <button
                                    type="submit"
                                    className="h-9 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                >
                                    Apply
                                </button>
                                {activeFilterCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="h-9 px-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200"
                                    >
                                        Clear ({activeFilterCount})
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Products Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    {products.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="py-4 px-4 w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAll}
                                                    onChange={handleSelectAll}
                                                    className="size-4 rounded border-slate-300"
                                                />
                                            </th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Product</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Category</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">API Source</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Price</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Selling Price</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {products.data.map((product) => (
                                            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-4 px-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.includes(product.id)}
                                                        onChange={() => handleSelectProduct(product.id)}
                                                        className="size-4 rounded border-slate-300"
                                                    />
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-primary">
                                                                {product.category?.icon || 'inventory_2'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{product.name}</p>
                                                            <p className="text-xs text-slate-500">{product.provider}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {product.category?.name}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {product.api_source ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                            {product.api_source}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400">
                                                            MANUAL
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                    Rp {formatCurrency(product.price)}
                                                </td>
                                                <td className="py-4 px-4 text-sm font-medium text-slate-900 dark:text-white">
                                                    Rp {formatCurrency(product.selling_price)}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {product.is_active ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('admin.products.edit', product.id)}
                                                            className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {products.last_page > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-sm text-slate-500">
                                        Showing {products.from} to {products.to} of {products.total} results
                                    </p>
                                    <div className="flex gap-1">
                                        {products.links.map((link, i) => (
                                            <Link
                                                key={i}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 rounded text-sm ${link.active
                                                    ? 'bg-primary text-white'
                                                    : link.url
                                                        ? 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                                        : 'text-slate-400 cursor-not-allowed'
                                                    }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-12 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2 block">inventory_2</span>
                            <p className="text-slate-500">No products found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                title="Delete Products"
                message={`Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`}
                confirmText="Delete"
                isDangerous={true}
            />

            <MarginModal
                isOpen={marginModalOpen}
                onClose={() => setMarginModalOpen(false)}
                onConfirm={handleBulkMargin}
                selectedCount={selectedProducts.length}
            />

            <CategoryModal
                isOpen={categoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                onConfirm={handleBulkCategory}
                categories={categories}
                selectedCount={selectedProducts.length}
            />

            <ImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
            />
        </AdminLayout>
    );
}
