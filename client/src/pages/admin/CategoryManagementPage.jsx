import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';

const CategoryManagementPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { notify, confirm } = useNotification();
    const [showModal, setShowModal] = useState(false);

    // Category form state
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        parent_id: '0',
        status: 'Active',
        image_url: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            setFormData({
                name: selectedCategory.name || '',
                slug: selectedCategory.slug || '',
                description: selectedCategory.description || '',
                parent_id: selectedCategory.parent_id || '0',
                status: selectedCategory.status || 'Active',
                image_url: selectedCategory.image_url || ''
            });
        } else {
            // Only reset if we are opening the modal for a new category
            if (showModal && !selectedCategory) {
                setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    parent_id: '0',
                    status: 'Active',
                    image_url: ''
                });
            }
        }
    }, [selectedCategory, showModal]);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            // First get items count for each category from products table
            const { data: productStats, error: statsError } = await supabase
                .from('products')
                .select('category, sub_category');

            if (statsError) throw statsError;

            const countsMap = {};
            productStats.forEach(p => {
                const cat = p.category?.toLowerCase();
                const sub = p.sub_category?.toLowerCase();
                if (cat) countsMap[cat] = (countsMap[cat] || 0) + 1;
                if (sub) countsMap[sub] = (countsMap[sub] || 0) + 1;
            });

            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;

            const formattedCategories = data.map(cat => ({
                ...cat,
                items: countsMap[cat.slug?.toLowerCase()] || 0,
                isSubcategory: !!cat.parent_id
            }));

            setCategories(formattedCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            notify('Failed to fetch categories', 'error');
        } finally {
            setIsLoading(false);
        }
    };



    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'name' ? { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') } : {})
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const categoryData = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                parent_id: formData.parent_id === '0' ? null : formData.parent_id,
                status: formData.status
            };

            if (selectedCategory) {
                // Update
                const { error } = await supabase
                    .from('categories')
                    .update(categoryData)
                    .eq('id', selectedCategory.id);

                if (error) throw error;

                // Update products associated with this category if name or slug changed
                if (selectedCategory.name !== formData.name || selectedCategory.slug !== formData.slug) {
                    await supabase
                        .from('products')
                        .update({ category: formData.slug })
                        .eq('category', selectedCategory.slug);

                    await supabase
                        .from('products')
                        .update({ sub_category: formData.slug })
                        .eq('sub_category', selectedCategory.slug);
                }

                notify('Category updated successfully');
            } else {
                // Create
                const { error } = await supabase
                    .from('categories')
                    .insert([categoryData]);

                if (error) throw error;
                notify('Category created successfully');
            }

            fetchCategories();
            setSelectedCategory(null);
            setShowModal(false);
        } catch (error) {
            console.error('Error saving category:', error);
            notify(error.message || 'Error saving category', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (categoryId, categoryName) => {
        const confirmed = await confirm({
            title: 'Delete Category',
            message: `Are you sure you want to permanently delete the "${categoryName}" category? This action cannot be reversed.`,
            confirmLabel: 'Permanently Delete',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

            if (error) throw error;
            notify('Category deleted successfully');
            fetchCategories();
            if (selectedCategory?.id === categoryId) {
                setSelectedCategory(null);
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            notify(error.message || 'Error deleting category', 'error');
        }
    };

    const toggleStatus = async (category) => {
        const newStatus = category.status === 'Active' ? 'Hidden' : 'Active';
        try {
            const { error } = await supabase
                .from('categories')
                .update({ status: newStatus })
                .eq('id', category.id);

            if (error) throw error;
            fetchCategories();
            notify(`Category visibility updated to ${newStatus}`);
        } catch (error) {
            console.error('Error toggling status:', error);
            notify('Failed to update status', 'error');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            Active: 'bg-green-500/10 text-green-400 ring-green-500/20',
            Scheduled: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
            Hidden: 'bg-red-500/10 text-red-400 ring-red-500/20'
        };

        return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${statusConfig[status]}`}>
                {status}
            </span>
        );
    };

    // Render helper
    const renderCategoryRow = (category, isChild = false) => (
        <tr
            key={category.id}
            className={`group hover:bg-white/[0.03] transition-all duration-300 ${isChild ? 'bg-white/[0.01]' : ''} ${selectedCategory?.id === category.id ? 'bg-primary/5' : ''}`}
        >
            <td className="py-5 px-4 text-center">
                <input className="rounded border-gray-600 bg-transparent text-primary focus:ring-primary focus:ring-offset-gray-900" type="checkbox" />
            </td>
            <td className="py-5 px-4">
                <div className={`flex items-center gap-4 ${isChild ? 'pl-12 border-l-2 border-primary/20 ml-2' : ''}`}>
                    <div className={`${isChild ? 'h-10 w-10' : 'h-12 w-12'} rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                        {category.image_url ? (
                            <img alt={category.name} className="h-full w-full object-cover" src={category.image_url} />
                        ) : (
                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">{category.icon || 'folder'}</span>
                        )}
                    </div>
                    <div>
                        <div className={`${isChild ? 'font-bold text-sm' : 'font-black text-base'} text-white group-hover:text-primary-light transition-colors tracking-tight`}>{category.name}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{isChild ? 'Subcategory' : 'Main Category'}</div>
                    </div>
                </div>
            </td>
            <td className={`py-5 px-4 text-gray-500 font-mono text-xs ${isChild ? 'pl-10' : ''}`}>/{category.slug}</td>
            <td className="py-5 px-4 text-center text-white font-black text-base tracking-tighter">{category.items}</td>
            <td className="py-5 px-4 text-center">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(category);
                    }}
                    className="cursor-pointer"
                >
                    {getStatusBadge(category.status)}
                </button>
            </td>
            <td className="py-5 px-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                    <button
                        className="p-2.5 rounded-xl hover:bg-white/10 text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(category);
                            setShowModal(true);
                        }}
                    >
                        <span className="material-symbols-outlined text-[18px]">edit_square</span>
                    </button>
                    <button
                        className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/10"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(category.id, category.name);
                        }}
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    );

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4 relative z-10">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm">
                                Store Structure
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ Catalog Structure</span>
                        </div>
                        <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em] drop-shadow-2xl">
                            Category <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Management</span>
                        </h1>
                        <p className="text-gray-400 text-base font-medium leading-relaxed max-w-2xl">
                            Organize your store structure, create new collections, and manage product categories.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button className="group flex items-center justify-center overflow-hidden rounded-xl h-12 bg-white/5 hover:bg-white/10 text-white gap-2 text-sm font-bold tracking-wide px-6 transition-all border border-white/10 hover:border-white/20">
                            <span className="material-symbols-outlined text-[20px]">filter_list</span>
                            <span>Filters</span>
                        </button>
                        <button
                            onClick={() => {
                                setSelectedCategory(null);
                                setShowModal(true);
                            }}
                            className="group flex items-center justify-center overflow-hidden rounded-xl h-12 bg-gradient-to-r from-[#59000a] to-[#7a000e] hover:to-[#8a0010] text-white gap-2 text-sm font-black uppercase tracking-widest px-6 transition-all shadow-[0_10px_20px_-5px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_25px_-5px_rgba(89,0,10,0.3)] hover:-translate-y-0.5 transform active:scale-95 border border-white/10"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span>New Category</span>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-12 flex flex-col">
                        <div className="glossy-panel rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden flex flex-col h-full min-h-[600px] border border-white/5 bg-black/20 shadow-2xl">
                            {/* Search and Stats */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="relative w-full max-w-md group">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">search</span>
                                    </span>
                                    <input
                                        className="glossy-input w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border border-white/5 bg-black/40 focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-gray-600 text-white"
                                        placeholder="Search categories..."
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest whitespace-nowrap ml-4">
                                    Total: <span className="text-white">{categories.length}</span> Categories
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto overflow-y-hidden">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="text-[10px] text-gray-600 font-black uppercase tracking-[0.25em] border-b border-white/5 bg-white/[0.01]">
                                            <th className="py-4 px-4 w-12 text-center">
                                                <input className="rounded border-gray-600 bg-transparent text-primary focus:ring-primary focus:ring-offset-gray-900" type="checkbox" />
                                            </th>
                                            <th className="py-4 px-4">Category</th>
                                            <th className="py-4 px-4">Slug</th>
                                            <th className="py-4 px-4 text-center">Items</th>
                                            <th className="py-4 px-4 text-center">Status</th>
                                            <th className="py-4 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03] text-sm">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="6" className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-gray-500">
                                                        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                                                        <span className="font-bold tracking-widest text-[10px] uppercase">Fetching Categories...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : categories.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                                        <span className="material-symbols-outlined text-4xl opacity-20">folder_open</span>
                                                        <span className="font-medium tracking-wide">No category nodes detected.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            // Hierarchical or Search Rendering
                                            searchQuery ? (
                                                categories
                                                    .filter(cat =>
                                                        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
                                                    )
                                                    .map(category => renderCategoryRow(category, category.isSubcategory))
                                            ) : (
                                                categories.filter(c => !c.parent_id).map(parent => (
                                                    <React.Fragment key={parent.id}>
                                                        {renderCategoryRow(parent, false)}
                                                        {categories.filter(c => c.parent_id === parent.id).map(child => renderCategoryRow(child, true))}
                                                    </React.Fragment>
                                                ))
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                                <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Page 01 // 03</div>
                                <div className="flex gap-3">
                                    <button className="size-10 rounded-2xl bg-white/5 text-gray-700 cursor-not-allowed border border-white/5 flex items-center justify-center" disabled>
                                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                    </button>
                                    <button className="size-10 rounded-2xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all shadow-xl">
                                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
                    <div className="glossy-panel relative w-full max-w-4xl rounded-[2.5rem] border border-white/10 bg-black/40 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                    {selectedCategory ? 'Edit Category' : 'Add New Category'}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form className="flex flex-col lg:flex-row gap-8" onSubmit={handleSave}>
                                {/* Left Column: Inputs */}
                                <div className="flex-1 flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Category Name</label>
                                        <input
                                            name="name"
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 placeholder:text-gray-700 h-12 px-5 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 text-white font-bold"
                                            placeholder="e.g. Summer Collection"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">URL Slug</label>
                                        <div className="flex group">
                                            <span className="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-white/5 bg-white/5 text-gray-600 text-sm font-bold">/</span>
                                            <input
                                                name="slug"
                                                className="glossy-input w-full rounded-r-2xl rounded-l-none bg-black/40 border-white/5 border-l-0 placeholder:text-gray-700 h-12 px-4 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 text-white font-mono"
                                                placeholder="mens-apparel"
                                                type="text"
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Parent Category</label>
                                        <div className="relative group">
                                            <select
                                                name="parent_id"
                                                className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 h-12 px-5 text-sm transition-all outline-none appearance-none cursor-pointer text-gray-400 font-bold focus:text-white"
                                                value={formData.parent_id}
                                                onChange={handleInputChange}
                                            >
                                                <option className="bg-black" value="0">Root Level (Master)</option>
                                                {categories.filter(c => !c.parent_id && c.id !== selectedCategory?.id).map(parent => (
                                                    <option key={parent.id} className="bg-black" value={parent.id}>{parent.name} Department</option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-600 group-hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">unfold_more</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Description</label>
                                        <textarea
                                            name="description"
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 min-h-[120px] placeholder:text-gray-700 p-5 text-sm transition-all outline-none resize-none text-gray-300 font-medium leading-relaxed scrollbar-hide"
                                            placeholder="Brief description for search engines..."
                                            value={formData.description}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Status & visual placeholder */}
                                <div className="flex-1 flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Status</label>
                                        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                                            {['Active', 'Hidden'].map((statusOption) => (
                                                <button
                                                    key={statusOption}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, status: statusOption }))}
                                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.status === statusOption ? 'bg-white/10 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
                                                >
                                                    {statusOption}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Asset Preview Placeholder */}
                                    <div className="flex-1 rounded-2xl bg-black/40 border border-white/5 p-4 flex flex-col items-center justify-center gap-4 min-h-[200px] relative group overflow-hidden">
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                        ) : (
                                            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                                                <span className="material-symbols-outlined text-3xl">image</span>
                                            </div>
                                        )}
                                        <div className="relative z-10 text-center">
                                            <p className="text-xs font-bold text-gray-400">Category Cover Asset</p>
                                            <p className="text-[10px] text-gray-600 mt-1">Updates available via Store Settings</p>
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[10px] uppercase font-bold text-white tracking-widest">Asset Management Locked</span>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            <div className="pt-8 flex gap-3 border-t border-white/5 mt-8">
                                <button
                                    type="button"
                                    className="flex-1 cursor-pointer items-center justify-center rounded-2xl h-14 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all border border-white/5"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 cursor-pointer items-center justify-center rounded-2xl h-14 bg-white hover:bg-primary-light text-black hover:text-white text-xs font-black uppercase tracking-widest transition-all shadow-2xl border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Processing...' : (selectedCategory ? 'Save Changes' : 'Create Category')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </AdminLayout>
    );
};

export default CategoryManagementPage;
