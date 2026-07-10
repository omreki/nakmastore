import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { normalizeHomepageSections, getSectionConfig, getListingGridClass, formatSectionTitle } from '../constants/homepageDefaults';
import {
    LISTING_PRODUCT_COMPARE_PRICE,
    LISTING_PRODUCT_NAME,
    LISTING_PRODUCT_PRICE,
    LISTING_PRODUCT_SALE_PRICE,
} from '../constants/productListingStyles';
import SEO from '../components/SEO';

const fetchSectionProducts = async (section, page, batchSize) => {
    const from = (page - 1) * batchSize;
    const to = from + batchSize - 1;
    const useCategoryFilter = section.productSource === 'category' && section.categoryId;

    let query = supabase
        .from('products')
        .select(useCategoryFilter ? '*, product_categories!inner (category_id)' : '*')
        .eq('is_draft', false)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (section.productSource === 'new_arrivals') {
        query = query.eq('is_new', true);
    } else if (useCategoryFilter) {
        query = query.eq('product_categories.category_id', section.categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
};

const HomePageProductSection = ({ section, formatPrice, onQuickAdd, showShopAllLink, isFirst }) => {
    const config = useMemo(() => getSectionConfig(section), [section]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadProducts = useCallback(async (pageNumber, reset = false) => {
        if (section.productSource === 'category' && !section.categoryId) {
            setProducts([]);
            setHasMore(false);
            setLoading(false);
            return;
        }

        try {
            if (pageNumber === 1) setLoading(true);

            const data = await fetchSectionProducts(section, pageNumber, config.batchSize);
            if (data.length < config.batchSize) setHasMore(false);
            else setHasMore(true);

            setProducts((prev) => (pageNumber === 1 || reset ? data : [...prev, ...data]));
        } catch (error) {
            console.error(`Error fetching homepage section (${section.id}):`, error);
        } finally {
            setLoading(false);
        }
    }, [section, config.batchSize]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        loadProducts(1, true);
    }, [loadProducts]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadProducts(nextPage);
    };

    return (
        <div className={isFirst ? 'pb-16' : 'py-16'}>
            <div className={`layout-container ${isFirst ? 'pt-24 md:pt-28 pb-8' : ''} flex items-end justify-between`}>
                <div>
                    <h2 className="text-white text-2xl md:text-4xl font-black tracking-tight leading-none">{formatSectionTitle(config.title)}</h2>
                    <p className="text-white/40 mt-3 text-sm md:text-lg font-medium italic">{config.subtitle}</p>
                </div>
                {showShopAllLink && (
                    <Link to="/shop" className="hidden sm:flex items-center gap-1 text-white font-bold hover:text-primary transition-colors bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:bg-white/10 shadow-sm">
                        Shop All <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                    </Link>
                )}
            </div>

            <div className="layout-container">
                {loading && page === 1 ? (
                    <div className="flex justify-center py-20">
                        <div className="size-12 border-4 border-white/5 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest">No products to display</p>
                    </div>
                ) : (
                    <div className={`grid ${getListingGridClass(config.columnsPerRow)} gap-6 md:gap-8`}>
                        {products.map((product) => (
                            <Link to={`/product/${product.slug}`} key={product.id} className="group cursor-pointer">
                                <div className="relative aspect-[4/5] overflow-hidden mb-4 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-2 border border-white/5">
                                    <img
                                        src={product.images?.[0] || 'https://via.placeholder.com/300?text=Product'}
                                        alt={product.name}
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute bottom-4 left-4 right-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none md:pointer-events-auto">
                                        <button
                                            onClick={(e) => onQuickAdd(e, product)}
                                            className="w-full h-10 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary transition-colors shadow-xl pointer-events-auto"
                                        >
                                            Shop this look
                                        </button>
                                    </div>
                                </div>
                                <div className="px-1">
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className={LISTING_PRODUCT_NAME}>{product.name}</h3>
                                        <div className="flex items-center gap-2">
                                            {product.is_sale && product.sale_price ? (
                                                <>
                                                    <span className={LISTING_PRODUCT_SALE_PRICE}>{formatPrice(product.sale_price)}</span>
                                                    <span className={LISTING_PRODUCT_COMPARE_PRICE}>{formatPrice(product.price)}</span>
                                                </>
                                            ) : (
                                                <span className={LISTING_PRODUCT_PRICE}>{formatPrice(product.price)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && hasMore && products.length > 0 && (
                    <div className="flex justify-center mt-12">
                        <button
                            onClick={handleLoadMore}
                            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-full transition-all duration-300"
                        >
                            <span className="text-white text-xs font-black uppercase tracking-[0.2em]">Load More Products</span>
                            <span className="material-symbols-outlined text-[18px] text-white/60 group-hover:text-white group-hover:translate-y-1 transition-all duration-300">expand_more</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const HomePage = () => {
    const { formatPrice, settings } = useStoreSettings();
    const { addToCart } = useCart();
    const sections = useMemo(
        () => normalizeHomepageSections(settings?.homepageSettings),
        [settings?.homepageSettings]
    );

    const handleQuickAdd = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        const color = product.colors && product.colors.length > 0
            ? (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0].hex)
            : null;
        addToCart(product, 1, 'M', color);
    };

    return (
        <div className="bg-secondary min-h-screen text-white font-['Manrope']">
            <SEO
                title={settings?.homepageSettings?.seo?.metaTitle || 'Home'}
                description={settings?.homepageSettings?.seo?.metaDescription || 'Nakma Ltd — an African inspired fashion house.'}
            />
            {sections.map((section, index) => (
                <HomePageProductSection
                    key={section.id}
                    section={section}
                    formatPrice={formatPrice}
                    onQuickAdd={handleQuickAdd}
                    showShopAllLink={index === 0}
                    isFirst={index === 0}
                />
            ))}
        </div>
    );
};

export default HomePage;
