import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useNotification } from '../../context/NotificationContext';

const ArticleManagementPage = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const { notify, confirm } = useNotification();

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image: '',
        is_published: false,
        category_id: ''
    });

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setArticles(data || []);
        } catch (error) {
            console.error('Error fetching articles:', error);
            notify('Failed to load articles', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (article = null) => {
        if (article) {
            setEditingArticle(article);
            setFormData({
                title: article.title,
                slug: article.slug,
                excerpt: article.excerpt || '',
                content: article.content || '',
                featured_image: article.featured_image || '',
                is_published: article.is_published,
                category_id: article.category_id || ''
            });
        } else {
            setEditingArticle(null);
            setFormData({
                title: '',
                slug: '',
                excerpt: '',
                content: '',
                featured_image: '',
                is_published: false,
                category_id: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingArticle) {
                const { error } = await supabase
                    .from('articles')
                    .update(formData)
                    .eq('id', editingArticle.id);
                if (error) throw error;
                notify('Article updated', 'success');
            } else {
                const { error } = await supabase
                    .from('articles')
                    .insert([formData]);
                if (error) throw error;
                notify('Article published', 'success');
            }
            setShowModal(false);
            fetchArticles();
        } catch (error) {
            console.error('Error saving article:', error);
            notify(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (article) => {
        const confirmed = await confirm({
            title: 'Discard Article',
            message: `Are you sure you want to permanently delete "${article.title}"? This will archive it into the void.`,
            confirmLabel: 'Delete Forever',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', article.id);
            if (error) throw error;
            notify('Article deleted', 'success');
            fetchArticles();
        } catch (error) {
            console.error('Error deleting article:', error);
            notify(error.message, 'error');
        }
    };

    const togglePublish = async (article) => {
        try {
            const { error } = await supabase
                .from('articles')
                .update({ is_published: !article.is_published })
                .eq('id', article.id);
            if (error) throw error;
            fetchArticles();
        } catch (error) {
            notify('Failed to update status', 'error');
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
                                Editorial
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ Content Management</span>
                        </div>
                        <h1 className="text-white text-3xl md:text-5xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Brand <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Archive</span>
                        </h1>
                        <p className="text-gray-400 text-sm md:text-base font-medium mt-2 max-w-xl">
                            Curate stories and editorial content for your community.
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="admin-button-primary h-12 px-6 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:-translate-y-0.5 transition-all border border-white/10 w-full md:w-auto"
                    >
                        <span className="material-symbols-outlined">edit_note</span>
                        Compose Story
                    </button>
                </div>

                {/* Articles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 flex flex-col items-center gap-4">
                            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Opening Archive...</p>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="col-span-full py-20 text-center opacity-30">
                            <span className="material-symbols-outlined text-6xl mb-4">article</span>
                            <p className="text-white font-black text-lg uppercase tracking-widest">No Stories Found</p>
                        </div>
                    ) : (
                        articles.map((article) => (
                            <div key={article.id} className="glossy-panel group flex flex-col rounded-[2.5rem] border border-white/5 bg-black/20 overflow-hidden transition-all duration-500 hover:border-white/10 hover:-translate-y-1 shadow-2xl">
                                <div className="h-56 relative overflow-hidden">
                                    {article.featured_image ? (
                                        <img src={article.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-4xl text-gray-700">image</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 z-10">
                                        <button
                                            onClick={() => togglePublish(article)}
                                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-xl transition-all ${article.is_published
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-500'
                                                }`}
                                        >
                                            {article.is_published ? 'Published' : 'Draft'}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-xl font-black text-white mb-3 tracking-tight line-clamp-2 leading-tight group-hover:text-primary-light transition-colors">{article.title}</h3>
                                    <p className="text-gray-500 text-xs leading-relaxed mb-6 line-clamp-3">
                                        {article.excerpt || 'No excerpt available for this editorial piece.'}
                                    </p>
                                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Modified</span>
                                            <span className="text-[10px] font-bold text-gray-400">{new Date(article.updated_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleOpenModal(article)}
                                                className="size-11 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5 flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(article)}
                                                className="size-11 rounded-2xl bg-red-500/5 hover:bg-red-500/20 text-gray-600 hover:text-red-500 transition-all border border-white/5 flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Composer Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => !isSaving && setShowModal(false)}></div>
                        <div className="glossy-panel relative w-full max-w-5xl rounded-[3rem] border border-white/10 bg-black/50 p-8 md:p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-zoom-in flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                                    {editingArticle ? 'Refine Story' : 'Draft New Story'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all flex items-center justify-center border border-white/5"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-4 scrollbar-hide space-y-8 pb-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Editorial Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="glossy-input w-full h-14 rounded-2xl bg-white/5 border-white/5 px-6 text-lg text-white font-black outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-gray-700"
                                                placeholder="Story Title..."
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Universal Slug</label>
                                            <input
                                                type="text"
                                                required
                                                className="glossy-input w-full h-12 rounded-xl bg-white/5 border-white/5 px-6 text-xs text-primary-light font-bold outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                                placeholder="story-slug"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Featured Cover URL</label>
                                            <input
                                                type="text"
                                                className="glossy-input w-full h-12 rounded-xl bg-white/5 border-white/5 px-6 text-xs text-white font-medium outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                                placeholder="https://images.unsplash.com/..."
                                                value={formData.featured_image}
                                                onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Brief Excerpt</label>
                                            <textarea
                                                className="glossy-input w-full h-44 rounded-3xl bg-white/5 border-white/5 p-6 text-sm text-gray-300 font-medium outline-none focus:ring-1 focus:ring-primary/40 transition-all resize-none leading-relaxed"
                                                placeholder="A short clinical summary of the story..."
                                                value={formData.excerpt}
                                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Chronicle Content (Full Story)</label>
                                    <textarea
                                        required
                                        className="glossy-input w-full h-80 rounded-[2rem] bg-white/5 border-white/5 p-8 text-base text-gray-200 font-medium outline-none focus:ring-1 focus:ring-primary/40 transition-all resize-none leading-relaxed"
                                        placeholder="Begin your narrative here..."
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="flex items-center gap-4 bg-white/5 p-6 rounded-3xl border border-white/5">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`size-10 rounded-xl border-2 transition-all flex items-center justify-center ${formData.is_published ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'border-white/10 bg-white/5'}`}>
                                            {formData.is_published && <span className="material-symbols-outlined text-white text-lg">check</span>}
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.is_published}
                                                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white text-[10px] font-black uppercase tracking-widest">Public Visibility</span>
                                            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-tight">Toggle to publish immediately upon saving.</span>
                                        </div>
                                    </label>
                                </div>
                            </form>

                            <div className="pt-8 border-t border-white/5 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="h-16 px-10 rounded-2xl bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="admin-button-primary flex-1 h-16 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl disabled:opacity-50"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Synchronizing...' : 'Commit to Archive'}
                                </button>
                            </div>
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

export default ArticleManagementPage;
