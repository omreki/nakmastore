import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

const ArticleDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (slug) {
            fetchArticle();
        }
    }, [slug]);

    const fetchArticle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch article
            const { data: articleData, error: articleError } = await supabase
                .from('articles')
                .select(`
                    *,
                    article_categories(name, slug),
                    profiles:author_id(full_name)
                `)
                .eq('slug', slug)
                .eq('is_published', true)
                .single();

            if (articleError) {
                if (articleError.code === 'PGRST116') {
                    setError('Article not found');
                } else {
                    throw articleError;
                }
                return;
            }

            setArticle(articleData);

            // Increment views
            await supabase
                .from('articles')
                .update({ views: (articleData.views || 0) + 1 })
                .eq('id', articleData.id);

            // Fetch related articles
            if (articleData.category_id) {
                const { data: related } = await supabase
                    .from('articles')
                    .select('id, title, slug, featured_image_url, excerpt, created_at')
                    .eq('category_id', articleData.category_id)
                    .eq('is_published', true)
                    .neq('id', articleData.id)
                    .limit(3)
                    .order('created_at', { ascending: false });

                setRelatedArticles(related || []);
            }
        } catch (err) {
            console.error('Error fetching article:', err);
            setError('Failed to load article');
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

    if (error) {
        return (
            <div className="min-h-screen bg-[#30136a] flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404</h1>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <Link to="/community" className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-primary transition-colors">
                        Back to Community
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading || !article) {
        return (
            <div className="min-h-screen bg-[#30136a] flex items-center justify-center">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#30136a] min-h-screen text-white font-['Manrope'] pt-20 md:pt-24 pb-20">
            <SEO
                title={article.title}
                description={article.excerpt || article.title}
                image={article.featured_image_url}
            />

            {/* Back Button */}
            <div className="w-full px-4 md:px-8 max-w-[1200px] mx-auto mb-8">
                <button
                    onClick={() => navigate('/community')}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold"
                >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Back to Community
                </button>
            </div>

            {/* Article Content */}
            <article className="w-full px-4 md:px-8 max-w-[1200px] mx-auto">
                {/* Featured Image */}
                {article.featured_image_url && (
                    <div className="relative w-full h-[300px] md:h-[500px] rounded-[32px] md:rounded-[40px] overflow-hidden mb-12 shadow-2xl">
                        <img
                            src={article.featured_image_url}
                            alt={article.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Article Header */}
                <div className="max-w-[800px] mx-auto mb-12">
                    {article.article_categories && (
                        <Link
                            to={`/community?category=${article.article_categories.slug}`}
                            className="inline-block px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/20 text-primary hover:bg-primary/30 transition-colors mb-6"
                        >
                            {article.article_categories.name}
                        </Link>
                    )}

                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
                        {article.title}
                    </h1>

                    {article.excerpt && (
                        <p className="text-xl text-white/60 mb-8 leading-relaxed">
                            {article.excerpt}
                        </p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-white/40 pb-8 border-b border-white/10">
                        {article.profiles?.full_name && (
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">person</span>
                                {article.profiles.full_name}
                            </span>
                        )}
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                            {formatDate(article.created_at)}
                        </span>
                        {article.views > 0 && (
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                {article.views} views
                            </span>
                        )}
                    </div>
                </div>

                {/* Article Body */}
                <div className="max-w-[800px] mx-auto prose prose-invert prose-lg mb-16">
                    <div
                        className="text-white/80 leading-relaxed"
                        style={{
                            fontSize: '18px',
                            lineHeight: '1.8'
                        }}
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                </div>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                    <div className="max-w-[1200px] mx-auto mt-20 pt-16 border-t border-white/10">
                        <h2 className="text-3xl font-bold text-white mb-8 uppercase tracking-tight">Related Articles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {relatedArticles.map((related) => (
                                <Link
                                    key={related.id}
                                    to={`/community/${related.slug}`}
                                    className="group"
                                >
                                    <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden mb-4 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-2">
                                        {related.featured_image_url ? (
                                            <img
                                                src={related.featured_image_url}
                                                alt={related.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-black flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white/20 text-4xl">article</span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                        {related.title}
                                    </h3>
                                    {related.excerpt && (
                                        <p className="text-white/60 text-sm line-clamp-2">
                                            {related.excerpt}
                                        </p>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </article>
        </div>
    );
};

export default ArticleDetailPage;
