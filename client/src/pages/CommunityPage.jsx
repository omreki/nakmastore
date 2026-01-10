import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';

const CommunityPage = () => {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pageSettings, setPageSettings] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchCategories();
        fetchArticles();
        fetchPageSettings();
    }, [selectedCategory]);

    const fetchPageSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('pages')
                .select('*')
                .eq('slug', 'community')
                .single();

            if (data) {
                setPageSettings(data);
            }
        } catch (error) {
            console.error('Error fetching community page settings:', error);
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

    const fetchArticles = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('articles')
                .select(`
                    *,
                    article_categories(name, slug),
                    profiles:author_id(full_name)
                `)
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (selectedCategory !== 'all') {
                const category = categories.find(c => c.slug === selectedCategory);
                if (category) {
                    query = query.eq('category_id', category.id);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            setArticles(data || []);
        } catch (error) {
            console.error('Error fetching articles:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-[#050505] min-h-screen text-white font-['Manrope'] pt-20 md:pt-24 pb-20">
            <SEO
                title={pageSettings.meta_title || pageSettings.title || "Community & Articles"}
                description={pageSettings.meta_description || pageSettings.hero_subtitle || "Explore our latest articles, guides, and community insights on performance apparel and athletic lifestyle."}
            />

            {/* Hero Section */}
            <div className="w-full px-4 md:px-6 max-w-[1600px] mx-auto mb-12 md:mb-16">
                <div className="relative w-full h-[300px] md:h-[400px] rounded-[32px] md:rounded-[40px] overflow-hidden group shadow-2xl bg-gradient-to-br from-primary/20 to-[#1a1a1a]">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-105"
                        style={{ backgroundImage: pageSettings.hero_image_url ? `url(${pageSettings.hero_image_url})` : 'none' }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16">
                        {pageSettings.hero_title && (
                            <span className="text-primary-light text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] mb-4 text-[#a14550]">
                                {pageSettings.hero_title}
                            </span>
                        )}
                        <h1 className="text-4xl md:text-8xl font-bold text-white tracking-tight leading-[1] mb-4 md:mb-6">
                            {pageSettings.title}
                        </h1>
                        <p className="text-white/60 text-sm md:text-xl font-medium max-w-xl line-clamp-2 md:line-clamp-none">
                            {pageSettings.hero_subtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="w-full px-4 md:px-8 max-w-[1600px] mx-auto mb-12">
                <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${selectedCategory === 'all'
                            ? 'bg-white text-black'
                            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        All Articles
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.slug)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${selectedCategory === category.slug
                                ? 'bg-white text-black'
                                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Articles Grid */}
            <div className="w-full px-4 md:px-8 max-w-[1600px] mx-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="size-12 border-4 border-[#a14550]/20 border-t-[#a14550] rounded-full animate-spin"></div>
                        <p className="text-white/40 font-bold tracking-widest uppercase text-sm">Loading Articles...</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-32 rounded-[40px] border border-white/5 bg-white/[0.02]">
                        <h3 className="text-2xl font-bold mb-2">No articles found</h3>
                        <p className="text-white/40">Check back soon for new content.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                        {articles.map((article, index) => (
                            <motion.article
                                key={article.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group cursor-pointer"
                            >
                                <Link to={`/community/${article.slug}`} className="block">
                                    {/* Featured Image */}
                                    <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden mb-6 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-2">
                                        {article.featured_image_url ? (
                                            <img
                                                src={article.featured_image_url}
                                                alt={article.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-black flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white/20 text-6xl">article</span>
                                            </div>
                                        )}
                                        {/* Category Badge */}
                                        {article.article_categories && (
                                            <div className="absolute top-4 left-4">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/80 text-white backdrop-blur-sm">
                                                    {article.article_categories.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="px-2">
                                        <h3 className="text-white font-bold text-xl mb-3 group-hover:text-[#a14550] transition-colors line-clamp-2 uppercase tracking-tight">
                                            {article.title}
                                        </h3>

                                        {article.excerpt && (
                                            <p className="text-white/60 text-sm mb-4 line-clamp-3 leading-relaxed">
                                                {article.excerpt}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <span className="text-white/40 text-xs font-medium">
                                                {formatDate(article.created_at)}
                                            </span>
                                            <span className="text-primary text-xs font-black uppercase tracking-widest group-hover:text-white transition-colors flex items-center gap-1">
                                                Read More <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityPage;
