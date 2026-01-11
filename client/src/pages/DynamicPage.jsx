import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import SEO from '../components/SEO';

const DynamicPage = () => {
    const { slug } = useParams();
    const { formatPrice } = useStoreSettings();
    const { addToCart } = useCart();

    const [pageData, setPageData] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategoryId, setActiveCategoryId] = useState('all');
    const [subCategories, setSubCategories] = useState([]);
    const [mainCategory, setMainCategory] = useState(null);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [error, setError] = useState(null);

    const visibleSubCategories = subCategories.slice(0, 6);
    const hiddenSubCategories = subCategories.slice(6);

    useEffect(() => {
        if (slug) {
            fetchPageData();

            // Subscribe to real-time changes
            const subscription = supabase
                .channel(`page_changes_${slug}`)
                .on('postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'pages', filter: `slug=eq.${slug}` },
                    (payload) => {
                        if (payload.new) {
                            setPageData(payload.new);
                        }
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [slug]);

    useEffect(() => {
        if (mainCategory) {
            fetchProducts();
        }
    }, [activeCategoryId, mainCategory, subCategories]);

    const fetchPageData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch Page Details
            const { data: page, error: pageError } = await supabase
                .from('pages')
                .select('*')
                .eq('slug', slug)
                .single();

            if (pageError) throw pageError;
            if (!page || page.status === 'draft') throw new Error('Page not found');

            setPageData(page);

            // 2. Fetch Associated Content Category
            if (page.content_category_slug) {
                const { data: cat, error: catError } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('slug', page.content_category_slug)
                    .single();

                if (catError && catError.code !== 'PGRST116') { // Ignore not found, might be intentional (no products)
                    console.error("Error fetching category:", catError);
                }

                if (cat) {
                    setMainCategory(cat);

                    // 3. Fetch subcategories
                    const { data: subs } = await supabase
                        .from('categories')
                        .select('*')
                        .eq('parent_id', cat.id)
                        .eq('status', 'Active')
                        .order('name');
                    setSubCategories(subs || []);
                }
            } else {
                setMainCategory(null);
                setSubCategories([]);
                setProducts([]);
            }

        } catch (err) {
            console.error('Error loading page:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };


    const fetchProducts = async () => {
        if (!mainCategory) return;

        setIsLoading(true);
        try {
            let targetIds = [];
            if (activeCategoryId === 'all') {
                targetIds = [mainCategory.id, ...subCategories.map(s => s.id)];
            } else {
                targetIds = [activeCategoryId];
            }

            if (targetIds.length === 0) {
                setProducts([]);
                return;
            }

            const { data: productsData, error } = await supabase
                .from('products')
                .select(`
                    *,
                    product_categories!inner (category_id)
                `)
                .eq('is_draft', false)
                .in('product_categories.category_id', targetIds)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Deduplicate products
            const unique = Array.from(new Map(productsData.map(item => [item.id, item])).values());
            setProducts(unique);

        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAdd = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        const color = product.colors && product.colors.length > 0
            ? (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0].hex)
            : null;
        addToCart(product, 1, 'M', color);
    };

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404</h1>
                    <p className="text-gray-400 mb-6">Page not found</p>
                    <Link to="/" className="px-6 py-3 bg-white text-black rounded-full font-bold">Return Home</Link>
                </div>
            </div>
        );
    }

    if (isLoading && !pageData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen text-white font-['Manrope'] pt-20 md:pt-24 pb-20">
            <SEO
                title={pageData?.meta_title || pageData?.title || 'Nakma'}
                description={pageData?.meta_description || pageData?.hero_subtitle || 'Elevate your performance.'}
            />

            {pageData?.custom_css && (
                <style dangerouslySetInnerHTML={{ __html: pageData.custom_css }} />
            )}

            {/* Header / Hero Section */}
            <div className="w-full px-4 md:px-6 max-w-[1600px] mx-auto mb-12 md:mb-16">
                <div className="relative w-full h-[260px] md:h-[400px] rounded-[32px] md:rounded-[40px] overflow-hidden group shadow-2xl bg-white/[0.03]">
                    {pageData?.hero_image_url && (
                        <div className="absolute inset-0">
                            <img
                                src={`${pageData.hero_image_url}${pageData.hero_image_url.includes('?') ? '&' : '?'}t=${new Date(pageData.updated_at).getTime()}`}
                                alt={pageData.title}
                                className="w-full h-full object-cover object-center transition-transform duration-[2s] group-hover:scale-105"
                            />
                        </div>
                    )}

                    {/* Sophisticated Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-[1]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-[1]"></div>

                    <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 z-10">
                        {pageData?.hero_title && (
                            <span className="text-primary text-[10px] md:text-sm font-black uppercase tracking-[0.4em] mb-4 drop-shadow-lg">
                                {pageData.hero_title}
                            </span>
                        )}
                        <h1 className="text-4xl md:text-8xl font-black text-white tracking-tight leading-[0.9] mb-4 md:mb-6 whitespace-pre-line uppercase drop-shadow-2xl">
                            {pageData?.title}
                        </h1>
                        <p className="text-white/70 text-sm md:text-xl font-medium max-w-xl line-clamp-3 md:line-clamp-none leading-relaxed uppercase drop-shadow-lg">
                            {pageData?.hero_subtitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content / Product Grid (Only if category is linked) */}
            {mainCategory && (
                <>
                    {/* Filter Bar */}
                    <div className="w-full px-4 md:px-8 max-w-[1600px] mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-3 overflow-x-visible pb-2 md:pb-0 scrollbar-hide relative">
                            <button
                                onClick={() => setActiveCategoryId('all')}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeCategoryId === 'all' ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}
                            >
                                All Products
                            </button>
                            {visibleSubCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategoryId(cat.id)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeCategoryId === cat.id ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}

                            {hiddenSubCategories.length > 0 && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsMoreOpen(!isMoreOpen)}
                                        className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${hiddenSubCategories.some(c => c.id === activeCategoryId) ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}>
                                        More <span className="material-symbols-outlined text-sm">expand_more</span>
                                    </button>

                                    {isMoreOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-black border border-white/10 rounded-2xl p-2 shadow-2xl z-50">
                                            {hiddenSubCategories.map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => {
                                                        setActiveCategoryId(cat.id);
                                                        setIsMoreOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeCategoryId === cat.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-white/40 text-sm font-medium uppercase tracking-widest px-1">Sort:</span>
                            <button className="flex items-center gap-2 text-white font-bold hover:text-primary-light transition-colors group">
                                Newest Arrival <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-y-0.5">expand_more</span>
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="w-full px-4 md:px-8 max-w-[1600px] mx-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-6">
                                <div className="size-12 border-4 border-[#b82063]/20 border-t-[#b82063] rounded-full animate-spin"></div>
                                <p className="text-white/40 font-bold tracking-widest uppercase text-sm">Loading Excellence...</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-32 rounded-[40px] border border-white/5 bg-white/[0.02]">
                                <h3 className="text-2xl font-bold mb-2">No products found</h3>
                                <p className="text-white/40">Keep an eye out for our next drop.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                                {products.map(product => (
                                    <Link to={`/product/${product.slug}`} key={product.id} className="group cursor-pointer">
                                        <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden mb-6 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-2">
                                            <img
                                                src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image'}
                                                alt={product.name}
                                                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                            />

                                            {/* Quick Add Button */}
                                            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:left-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none md:pointer-events-auto">
                                                <button
                                                    onClick={(e) => handleQuickAdd(e, product)}
                                                    className="w-full h-10 md:h-12 bg-black text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-black transition-colors shadow-xl pointer-events-auto"
                                                >
                                                    Add to Bag
                                                </button>
                                            </div>

                                            {(product.is_new || product.is_sale) && (
                                                <div className="absolute top-6 left-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${product.is_new ? 'bg-black text-white' : 'bg-black text-white'}`}>
                                                        {product.is_new ? 'New Arrival' : 'Sale'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-2">
                                            <div className="flex flex-col gap-1 mb-1">
                                                <h3 className="text-white font-bold text-lg group-hover:text-[#b82063] transition-colors line-clamp-1 uppercase tracking-tight">{product.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    {product.is_sale && product.sale_price ? (
                                                        <>
                                                            <span className="text-[#b82063] font-black italic text-lg whitespace-nowrap leading-none">{formatPrice(product.sale_price)}</span>
                                                            <span className="text-white/30 font-bold text-[10px] line-through decoration-1">{formatPrice(product.price)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-white font-black italic text-lg whitespace-nowrap leading-none">{formatPrice(product.price)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{mainCategory?.name}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default DynamicPage;
