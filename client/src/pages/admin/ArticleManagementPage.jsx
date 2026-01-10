import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const ArticleManagementPage = () => {
    const { user } = useAuth();
    const { notify } = useNotification();

    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [articleForm, setArticleForm] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image_url: '',
        category_id: '',
        is_published: false
    });

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        slug: '',
        description: ''
    });

    const [featuredImageFile, setFeaturedImageFile] = useState(null);
    const [featuredImagePreview, setFeaturedImagePreview] = useState(null);

    useEffect(() => {
        fetchArticles();
        fetchCategories();
    }, []);

    const fetchArticles = async () => {
        setLoadingArticles(true);
        try {
            const { data, error } = await supabase
                .from('articles')
                .select(`
                    *,
                    article_categories(name),
                    profiles:author_id(full_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setArticles(data || []);
        } catch (error) {
            console.error('Error fetching articles:', error);
            notify('Failed to load articles', 'error');
        } finally {
            setLoadingArticles(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('article_categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleAddArticle = () => {
        setArticleForm({
            title: '',
            slug: '',
            excerpt: '',
            content: '',
            featured_image_url: '',
            category_id: '',
            is_published: false
        });
        setFeaturedImageFile(null);
        setFeaturedImagePreview(null);
        setEditingArticle(null);
        setShowArticleModal(true);
    };

    const handleEditArticle = (article) => {
        setArticleForm({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt || '',
            content: article.content,
            featured_image_url: article.featured_image_url || '',
            category_id: article.category_id || '',
            is_published: article.is_published
        });
        setFeaturedImagePreview(article.featured_image_url || null);
        setFeaturedImageFile(null);
        setEditingArticle(article);
        setShowArticleModal(true);
    };

    const handleDeleteArticle = async (id) => {
        if (!window.confirm('Are you sure you want to delete this article?')) return;

        try {
            const { error } = await supabase.from('articles').delete().eq('id', id);
            if (error) throw error;

            setArticles(prev => prev.filter(a => a.id !== id));
            notify('Article deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting article:', error);
            notify('Failed to delete article', 'error');
        }
    };

    const handleTogglePublish = async (article) => {
        try {
            const { error } = await supabase
                .from('articles')
                .update({ is_published: !article.is_published })
                .eq('id', article.id);

            if (error) throw error;

            setArticles(prev => prev.map(a =>
                a.id === article.id ? { ...a, is_published: !a.is_published } : a
            ));

            notify(`Article ${!article.is_published ? 'published' : 'unpublished'}`, 'success');
        } catch (error) {
            console.error('Error toggling publish:', error);
            notify('Failed to update article', 'error');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFeaturedImageFile(file);
            setFeaturedImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSaveArticle = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            let imageUrl = articleForm.featured_image_url;

            // Upload image if new file selected
            if (featuredImageFile) {
                const fileName = `article-${Date.now()}-${featuredImageFile.name.replace(/\s/g, '-')}`;
                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, featuredImageFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);
                imageUrl = urlData.publicUrl;
            }

            // Handle image removal
            if (articleForm.removeImage) {
                imageUrl = '';
            }

            // Generate slug if empty
            let slug = articleForm.slug;
            if (!slug && articleForm.title) {
                slug = articleForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            const payload = {
                title: articleForm.title,
                slug: slug,
                excerpt: articleForm.excerpt,
                content: articleForm.content,
                featured_image_url: imageUrl,
                category_id: articleForm.category_id || null,
                is_published: articleForm.is_published,
                author_id: user.id
            };

            if (editingArticle) {
                const { data, error } = await supabase
                    .from('articles')
                    .update(payload)
                    .eq('id', editingArticle.id)
                    .select(`
                        *,
                        article_categories(name),
                        profiles:author_id(full_name)
                    `)
                    .single();

                if (error) throw error;
                setArticles(prev => prev.map(a => a.id === editingArticle.id ? data : a));
                notify('Article updated successfully', 'success');
            } else {
                const { data, error } = await supabase
                    .from('articles')
                    .insert(payload)
                    .select(`
                        *,
                        article_categories(name),
                        profiles:author_id(full_name)
                    `)
                    .single();

                if (error) throw error;
                setArticles(prev => [data, ...prev]);
                notify('Article created successfully', 'success');
            }

            setShowArticleModal(false);
        } catch (error) {
            console.error('Error saving article:', error);
            notify(error.message || 'Failed to save article', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Category Management
    const handleAddCategory = () => {
        setCategoryForm({ name: '', slug: '', description: '' });
        setEditingCategory(null);
        setShowCategoryModal(true);
    };

    const handleEditCategory = (category) => {
        setCategoryForm({
            name: category.name,
            slug: category.slug,
            description: category.description || ''
        });
        setEditingCategory(category);
        setShowCategoryModal(true);
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Are you sure? Articles in this category will have no category.')) return;

        try {
            const { error } = await supabase.from('article_categories').delete().eq('id', id);
            if (error) throw error;

            setCategories(prev => prev.filter(c => c.id !== id));
            notify('Category deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting category:', error);
            notify('Failed to delete category', 'error');
        }
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Generate slug if empty
            let slug = categoryForm.slug;
            if (!slug && categoryForm.name) {
                slug = categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            const payload = {
                name: categoryForm.name,
                slug: slug,
                description: categoryForm.description
            };

            if (editingCategory) {
                const { data, error } = await supabase
                    .from('article_categories')
                    .update(payload)
                    .eq('id', editingCategory.id)
                    .select()
                    .single();

                if (error) throw error;
                setCategories(prev => prev.map(c => c.id === editingCategory.id ? data : c));
                notify('Category updated successfully', 'success');
            } else {
                const { data, error } = await supabase
                    .from('article_categories')
                    .insert(payload)
                    .select()
                    .single();

                if (error) throw error;
                setCategories(prev => [...prev, data]);
                notify('Category created successfully', 'success');
            }

            setShowCategoryModal(false);
        } catch (error) {
            console.error('Error saving category:', error);
            notify(error.message || 'Failed to save category', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm">
                                Content Hub
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ Articles & Insights</span>
                        </div>
                        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Article <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Management</span>
                        </h1>
                        <p className="text-gray-400 text-base font-medium mt-2 max-w-xl">
                            Create and manage blog articles, knowledge base content, and community insights.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleAddCategory}
                            className="bg-white/5 hover:bg-white/10 h-12 px-6 rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white border border-white/10 transition-all"
                        >
                            <span className="material-symbols-outlined text-[16px] mr-2">folder</span>
                            Categories
                        </button>
                        <button
                            onClick={handleAddArticle}
                            className="admin-button-primary h-12 px-8 rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all border border-white/10 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[16px] mr-2">add_circle</span>
                            New Article
                        </button>
                    </div>
                </div>

                {/* Categories Section */}
                <div className="glossy-panel rounded-[2.5rem] p-8 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                    <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest">Categories</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {categories.map((category) => (
                            <div key={category.id} className="glossy-panel p-4 rounded-2xl border border-white/5 bg-black/40 hover:bg-white/5 transition-all group">
                                <h3 className="text-white font-bold text-sm mb-1">{category.name}</h3>
                                <p className="text-gray-500 text-xs font-mono mb-3">/{category.slug}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditCategory(category)}
                                        className="text-blue-400 hover:text-blue-300 text-xs"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="text-red-500 hover:text-red-400 text-xs"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Articles List */}
                <div className="glossy-panel rounded-[2.5rem] p-8 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                    <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest">Articles</h2>

                    {loadingArticles ? (
                        <div className="flex justify-center py-20">
                            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <p>No articles found. Create your first article to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {articles.map((article) => (
                                <div
                                    key={article.id}
                                    className="glossy-panel p-6 rounded-2xl border border-white/5 bg-black/40 hover:bg-white/[0.02] transition-all flex items-center justify-between gap-6"
                                >
                                    <div className="flex items-center gap-6 flex-1">
                                        {/* Featured Image */}
                                        {article.featured_image_url && (
                                            <img
                                                src={article.featured_image_url}
                                                alt={article.title}
                                                className="w-20 h-20 object-cover rounded-xl"
                                            />
                                        )}

                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-white font-bold text-lg">{article.title}</h3>
                                                {article.is_published ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 uppercase font-black tracking-widest">Published</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 uppercase font-black tracking-widest">Draft</span>
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-xs font-mono mb-2">/community/{article.slug}</p>
                                            {article.excerpt && (
                                                <p className="text-gray-400 text-sm line-clamp-1">{article.excerpt}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                {article.article_categories && (
                                                    <span>📁 {article.article_categories.name}</span>
                                                )}
                                                {article.profiles?.full_name && (
                                                    <span>✍️ {article.profiles.full_name}</span>
                                                )}
                                                <span>👁️ {article.views || 0} views</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleTogglePublish(article)}
                                            className={`p-2 rounded-xl transition-colors ${article.is_published
                                                ? 'text-green-400 hover:bg-green-500/20'
                                                : 'text-gray-500 hover:bg-white/10'
                                                }`}
                                            title={article.is_published ? 'Unpublish' : 'Publish'}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {article.is_published ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </button>
                                        <Link
                                            to={`/community/${article.slug}`}
                                            target="_blank"
                                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors"
                                            title="View"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                        </Link>
                                        <button
                                            onClick={() => handleEditArticle(article)}
                                            className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-xl transition-colors"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteArticle(article.id)}
                                            className="p-2 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Article Modal */}
            {showArticleModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
                    <div className="glossy-panel rounded-3xl p-8 max-w-4xl w-full my-8 border border-white/10 bg-black/90">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                {editingArticle ? 'Edit Article' : 'Create New Article'}
                            </h2>
                            <button
                                onClick={() => setShowArticleModal(false)}
                                className="size-10 rounded-xl hover:bg-white/10 flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-gray-400">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSaveArticle} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">
                                        Title *
                                    </label>
                                    <input
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-4"
                                        required
                                        value={articleForm.title}
                                        onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">
                                        Slug (URL)
                                    </label>
                                    <input
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-4 font-mono"
                                        placeholder="auto-generated"
                                        value={articleForm.slug}
                                        onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">
                                    Excerpt
                                </label>
                                <textarea
                                    className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-medium p-4 min-h-[100px]"
                                    placeholder="Short summary of the article..."
                                    value={articleForm.excerpt}
                                    onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">
                                    Content * (HTML Supported)
                                </label>
                                <textarea
                                    className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-medium p-4 min-h-[300px]"
                                    required
                                    value={articleForm.content}
                                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">
                                        Category
                                    </label>
                                    <select
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-4"
                                        value={articleForm.category_id}
                                        onChange={(e) => setArticleForm({ ...articleForm, category_id: e.target.value })}
                                    >
                                        <option value="">None</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">
                                        Featured Image
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className="cursor-pointer px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2 w-fit">
                                            <span className="material-symbols-outlined text-[16px]">upload_file</span>
                                            Upload
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                        {featuredImagePreview && (
                                            <div className="flex items-center gap-2">
                                                <img src={featuredImagePreview} alt="Preview" className="h-10 w-10 object-cover rounded-lg border border-white/10" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFeaturedImagePreview(null);
                                                        setFeaturedImageFile(null);
                                                        setArticleForm({ ...articleForm, removeImage: true });
                                                    }}
                                                    className="size-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 px-1">
                                <input
                                    type="checkbox"
                                    id="is_published"
                                    checked={articleForm.is_published}
                                    onChange={(e) => setArticleForm({ ...articleForm, is_published: e.target.checked })}
                                    className="accent-primary w-4 h-4 rounded"
                                />
                                <label htmlFor="is_published" className="text-gray-400 text-xs font-bold cursor-pointer">
                                    Publish Article (Make visible to public)
                                </label>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowArticleModal(false)}
                                    className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="h-12 admin-button-primary text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl px-8 flex items-center gap-2"
                                >
                                    {isSaving && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                                    {editingArticle ? 'Update Article' : 'Create Article'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="glossy-panel rounded-3xl p-8 max-w-2xl w-full border border-white/10 bg-black/90">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                {editingCategory ? 'Edit Category' : 'Create New Category'}
                            </h2>
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="size-10 rounded-xl hover:bg-white/10 flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-gray-400">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSaveCategory} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">
                                        Name *
                                    </label>
                                    <input
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-4"
                                        required
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">
                                        Slug (URL)
                                    </label>
                                    <input
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-4 font-mono"
                                        placeholder="auto-generated"
                                        value={categoryForm.slug}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">
                                    Description
                                </label>
                                <textarea
                                    className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-medium p-4 min-h-[100px]"
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryModal(false)}
                                    className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="h-12 admin-button-primary text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl px-8 flex items-center gap-2"
                                >
                                    {isSaving && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                                    {editingCategory ? 'Update Category' : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default ArticleManagementPage;
