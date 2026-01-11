import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import shopHeroImage from '../assets/shop_hero.png';
import SEO from '../components/SEO';

const ShopPage = () => {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    const slugify = (text) => {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start
            .replace(/-+$/, '');            // Trim - from end
    };

    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 18;

    const { formatPrice } = useStoreSettings();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState({ name: 'All Products', slug: 'all' });
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [pageSettings, setPageSettings] = useState(null);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchPageSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('pages')
                    .select('*')
                    .eq('slug', 'shop')
                    .single();
                if (data) setPageSettings(data);
            } catch (error) {
                console.error('Error fetching page settings:', error);
            }
        };
        fetchPageSettings();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('shop_page_changes')
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'pages', filter: 'slug=eq.shop' },
                (payload) => {
                    if (payload.new) {
                        setPageSettings(payload.new);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when category or search changes
        fetchProducts();
    }, [activeCategory, searchQuery]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .is('parent_id', null)
                .eq('status', 'Active')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('products')
                .select('*')
                .eq('is_draft', false);

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
            } else if (activeCategory.slug !== 'all') {
                query = query.eq('category', activeCategory.slug);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(data || []);
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

    const visibleCategories = categories.slice(0, 6);
    const hiddenCategories = categories.slice(6);

    // Pagination logic
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(products.length / productsPerPage);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="bg-black min-h-screen text-white font-['Manrope'] pt-20 md:pt-24 pb-20">
            <SEO
                title={searchQuery ? `Search results for "${searchQuery}"` : (pageSettings?.meta_title || `Shop ${activeCategory.slug === 'all' ? 'Collection' : activeCategory.name}`)}
                description={pageSettings?.meta_description || "Browse our complete range of unique African-inspired shirts. Crafted for comfort, designed for cultural expression."}
            />
            {pageSettings?.custom_css && (
                <style dangerouslySetInnerHTML={{ __html: pageSettings.custom_css }} />
            )}
            {/* Hero / Header Section */}
            {!searchQuery && (
                <div className="layout-container mb-12 md:mb-16">
                    <div className="relative w-full h-[260px] md:h-[400px] rounded-[40px] md:rounded-[56px] overflow-hidden group shadow-2xl bg-white/[0.03]">
                        {pageSettings?.hero_image_url && (
                            <div className="absolute inset-0">
                                <img
                                    src={`${pageSettings.hero_image_url}${pageSettings.hero_image_url.includes('?') ? '&' : '?'}t=${new Date(pageSettings.updated_at).getTime()}`}
                                    alt={pageSettings.title || "Shop"}
                                    className="w-full h-full object-cover object-center transition-transform duration-[2s] group-hover:scale-105"
                                />
                            </div>
                        )}

                        {/* Sophisticated Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-[1]"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-[1]"></div>

                        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-20 z-10">
                            <span className="text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.6em] mb-4 drop-shadow-lg">
                                {pageSettings?.hero_title || "THE FULL COLLECTION"}
                            </span>
                            <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-4 md:mb-6 uppercase drop-shadow-2xl">
                                {pageSettings?.title || "Timeless African Elegance"}
                            </h1>
                            <p className="text-white/70 text-base md:text-xl font-medium max-w-xl line-clamp-3 md:line-clamp-none leading-relaxed uppercase drop-shadow-lg">
                                {pageSettings?.hero_subtitle || "Our complete range of unique African-inspired shirts. Crafted for comfort, designed for cultural expression."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Breadcrumbs */}
            <div className="layout-container mb-8">
                <nav className="flex items-center gap-2 text-sm font-medium text-white/40">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <Link to="/shop" className="hover:text-white transition-colors">Shop All</Link>
                    {searchQuery && (
                        <>
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                            <span className="text-white">Search: {searchQuery}</span>
                        </>
                    )}
                </nav>
            </div>

            {/* Filter Bar */}
            {!searchQuery && (
                <div className="layout-container mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3 overflow-x-visible pb-2 md:pb-0 scrollbar-hide relative">
                        <button
                            onClick={() => setActiveCategory({ name: 'All Products', slug: 'all' })}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeCategory.slug === 'all' ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}>
                            All Products
                        </button>
                        {visibleCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeCategory.id === cat.id ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}>
                                {cat.name}
                            </button>
                        ))}

                        {hiddenCategories.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${hiddenCategories.some(c => c.id === activeCategory.id) ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}>
                                    More <span className="material-symbols-outlined text-sm">expand_more</span>
                                </button>

                                {isMoreOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-black border border-white/10 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-xl bg-black/80">
                                        {hiddenCategories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    setActiveCategory(cat);
                                                    setIsMoreOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeCategory.id === cat.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] px-1">Sort:</span>
                        <button className="flex items-center gap-2 text-white font-black hover:text-primary transition-colors group text-sm">
                            Newest Arrivals <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-y-0.5">expand_more</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Search Results Title */}
            {searchQuery && (
                <div className="layout-container mb-12">
                    <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">
                        {products.length} Results for <span className="text-primary italic">"{searchQuery}"</span>
                    </h2>
                </div>
            )}

            {/* Product Grid Area */}
            <div className="layout-container">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-white/40 font-black tracking-[0.4em] uppercase text-[10px]">Crafting Heritage...</p>
                    </div>
                ) : currentProducts.length === 0 ? (
                    <div className="text-center py-32 rounded-[40px] border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center">
                        <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-white/20">search_off</span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tighter">No products found</h3>
                        <p className="text-white/40 max-w-md mx-auto mb-8 font-medium">
                            {searchQuery
                                ? `We couldn't find any products matching "${searchQuery}". Try using different keywords.`
                                : "Keep an eye out for our next drop. Excellence is coming."}
                        </p>
                        {searchQuery && (
                            <Link
                                to="/shop"
                                className="px-10 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all transform active:scale-95"
                            >
                                Clear Search
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
                        {currentProducts.map((product) => {
                            const mainImage = product.images?.[0] || 'https://via.placeholder.com/400x500?text=No+Image';

                            return (
                                <div key={product.id} className="group cursor-pointer">
                                    <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden mb-4 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-2 border border-white/5">
                                        <Link to={`/product/${product.slug}`} className="block w-full h-full">
                                            <img
                                                src={mainImage}
                                                alt={product.name}
                                                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </Link>

                                        {/* Quick Add Button */}
                                        <div className="absolute bottom-4 left-4 right-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none md:pointer-events-auto">
                                            <button
                                                onClick={(e) => handleQuickAdd(e, product)}
                                                className="w-full h-10 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary transition-colors shadow-xl pointer-events-auto"
                                            >
                                                Add to Bag
                                            </button>
                                        </div>

                                        {(product.is_new || product.is_sale) && (
                                            <div className="absolute top-4 left-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${product.is_new ? 'bg-primary text-white' : 'bg-white text-black'}`}>
                                                    {product.is_new ? 'New' : 'Sale'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-1">
                                        <div className="flex flex-col gap-0.5">
                                            <h3 className="text-white font-bold text-sm group-hover:text-primary transition-colors line-clamp-1 uppercase tracking-tight">{product.name}</h3>
                                            <div className="flex items-center gap-2">
                                                {product.is_sale && product.sale_price ? (
                                                    <>
                                                        <span className="text-primary font-black italic text-base whitespace-nowrap leading-none">{formatPrice(product.sale_price)}</span>
                                                        <span className="text-white/30 font-bold text-[10px] line-through decoration-1">{formatPrice(product.price)}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-white font-black italic text-base whitespace-nowrap leading-none">{formatPrice(product.price)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && products.length > productsPerPage && (
                    <div className="mt-20 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`size-12 rounded-full border border-white/10 flex items-center justify-center transition-all ${currentPage === 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white hover:text-black hover:border-white'}`}
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>

                            <div className="flex items-center gap-2 mx-4">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => paginate(i + 1)}
                                        className={`size-12 rounded-full font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`size-12 rounded-full border border-white/10 flex items-center justify-center transition-all ${currentPage === totalPages ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white hover:text-black hover:border-white'}`}
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                            Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, products.length)} of {products.length} Products
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopPage;
