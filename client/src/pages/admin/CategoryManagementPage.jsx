import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useNotification } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';

const CategoryManagementPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', slug: '', description: '', image_url: '' });
    const { notify, confirm } = useNotification();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');
            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            notify('Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                image_url: category.image_url || ''
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', slug: '', description: '', image_url: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update(formData)
                    .eq('id', editingCategory.id);
                if (error) throw error;
                notify('Category updated successfully', 'success');
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([formData]);
                if (error) throw error;
                notify('Category created successfully', 'success');
            }
            setShowModal(false);
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            notify(error.message, 'error');
        }
    };

    const handleDelete = async (category) => {
        const confirmed = await confirm({
            title: 'Delete Category',
            message: `Are you sure you want to delete "${category.name}"? This will not delete products in this category, but they will become uncategorized.`,
            confirmLabel: 'Delete',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', category.id);
            if (error) throw error;
            notify('Category deleted', 'success');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            notify(error.message, 'error');
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6 md:gap-8 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm">
                                Taxonomy
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ Categories</span>
                        </div>
                        <h1 className="text-white text-3xl md:text-5xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Category <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Architecture</span>
                        </h1>
                        <p className="text-gray-400 text-sm md:text-base font-medium mt-2 max-w-xl">
                            Organize your collection with precision. Define the structural hierarchy of your store.
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="admin-button-primary h-12 px-6 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:-translate-y-0.5 transition-all border border-white/10 w-full md:w-auto"
                    >
                        <span className="material-symbols-outlined">add</span>
                        New Category
                    </button>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 flex flex-col items-center gap-4">
                            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Building Taxonomy...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="col-span-full py-20 text-center opacity-30">
                            <span className="material-symbols-outlined text-6xl mb-4">category</span>
                            <p className="text-white font-black text-lg uppercase tracking-widest">No Categories Defined</p>
                        </div>
                    ) : (
                        categories.map((category) => (
                            <div key={category.id} className="glossy-panel group relative overflow-hidden rounded-[2rem] border border-white/5 bg-black/20 p-8 transition-all duration-500 hover:border-white/10 hover:bg-black/30 hover:-translate-y-1">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700">
                                    <span className="material-symbols-outlined text-8xl">category</span>
                                </div>
                                <div className="relative z-10">
                                    <div className="size-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-white mb-6 group-hover:scale-110 duration-500 shadow-2xl overflow-hidden">
                                        {category.image_url ? (
                                            <img src={category.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined opacity-40">image</span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-primary-light transition-colors">{category.name}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Slug:</span>
                                        <span className="text-[10px] font-bold text-primary-light uppercase bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">/{category.slug}</span>
                                    </div>
                                    <p className="text-gray-400 text-xs leading-relaxed mb-8 line-clamp-2">
                                        {category.description || 'No description provided for this structural element.'}
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleOpenModal(category)}
                                            className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all border border-white/5 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category)}
                                            className="size-11 rounded-xl bg-red-500/5 hover:bg-red-500/20 text-gray-600 hover:text-red-500 transition-all border border-white/5 flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
                        <div className="glossy-panel relative w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-black/95 p-10 shadow-2xl animate-zoom-in">
                            <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tight">
                                {editingCategory ? 'Edit Category' : 'New Strategic Segment'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Segment Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="glossy-input w-full h-12 rounded-xl bg-black/40 border-white/5 px-5 text-sm text-white font-bold outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                        placeholder="e.g. Masterpiece Collection"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Universal Slug</label>
                                    <input
                                        type="text"
                                        required
                                        className="glossy-input w-full h-12 rounded-xl bg-black/40 border-white/5 px-5 text-sm text-white font-bold outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                        placeholder="masterpiece-collection"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Description</label>
                                    <textarea
                                        className="glossy-input w-full h-32 rounded-xl bg-black/40 border-white/5 p-5 text-sm text-white font-medium outline-none focus:ring-1 focus:ring-primary/40 transition-all resize-none"
                                        placeholder="Define the purpose of this segment..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="h-12 rounded-xl bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="admin-button-primary h-12 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl"
                                    >
                                        {editingCategory ? 'Update Segment' : 'Confirm Launch'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes zoomIn { from { scale: 0.95; opacity: 0; } to { scale: 1; opacity: 1; } }
            `}</style>
        </AdminLayout>
    );
};

export default CategoryManagementPage;
