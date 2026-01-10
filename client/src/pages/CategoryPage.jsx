import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useCart } from '../context/CartContext';
import SEO from '../components/SEO';

const CategoryPage = () => {
    const { slug } = useParams();
    const { formatPrice } = useStoreSettings();
    const { addToCart } = useCart();

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubCategory, setActiveSubCategory] = useState('all');
    const [subCategories, setSubCategories] = useState([]);

    useEffect(() => {
        fetchCategoryData();
    }, [slug]);

    const fetchCategoryData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Category Details
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('slug', slug)
                .single();

            if (catError) throw catError;
            setCategory(catData);

            // 2. Fetch Subcategories (if this is a parent) or Siblings (if this is a child)
            let relatedCats = [];
            if (!catData.parent_id) {
                // It's a parent, fetch children
                const { data: subs } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('parent_id', catData.id);
                relatedCats = subs || [];
                setSubCategories(relatedCats);
            } else {
                // It's a child, fetch siblings? Or just null?
                // Usually we show siblings or nothing. Let's show nothing for now.
                setSubCategories([]);
            }

            // 3. Fetch Products
            // We need products linked to this category OR its children (if parent)
            const categoryIdsToCheck = [catData.id, ...relatedCats.map(c => c.id)];

            const { data: productsData, error: prodError } = await supabase
                .from('products')
                .select(`
                    *,
                    product_categories!inner (category_id)
                `)
                .in('product_categories.category_id', categoryIdsToCheck)
                .order('created_at', { ascending: false });

            if (prodError) throw prodError;

            // Remove duplicates (product could be in parent AND child, though unlikely with current UI logic, but possible)
            const uniqueProducts = Array.from(new Map(productsData.map(item => [item.id, item])).values());
            setProducts(uniqueProducts);

        } catch (error) {
            console.error('Error fetching category data:', error);
        } finally {
            setLoading(false);
        }
    };

    const displayedProducts = activeSubCategory === 'all'
        ? products
        : products.filter(p =>
            p.product_categories.some(pc => pc.category_id === activeSubCategory)
        );

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Category Not Found</h1>
                <Link to="/" className="text-primary hover:underline">Return Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black font-display selection:bg-primary selection:text-white pb-20">
            <SEO
                title={category.name}
                description={category.description || `Browse our ${category.name} collection. Unique African-inspired shirts blended with modern design.`}
            />

            {/* Hero Section */}
            <div className="relative pt-24 pb-8 md:pt-32 md:pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="layout-container text-center relative z-10">
                    <p className="text-primary font-black uppercase tracking-[0.2em] text-xs mb-4 animate-fade-in-up">Collection</p>
                    <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 md:mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {category.name}
                    </h1>
                    {category.description && (
                        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            {category.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Subcategories Filter */}
            {subCategories.length > 0 && (
                <div className="layout-container mb-8 md:mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                        <button
                            onClick={() => setActiveSubCategory('all')}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${activeSubCategory === 'all' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}
                        >
                            All
                        </button>
                        {subCategories.map(sub => (
                            <Link
                                key={sub.id}
                                to={`/category/${sub.slug}`}
                                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-white`}
                            >
                                {sub.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="layout-container">
                {displayedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                        {displayedProducts.map((product, index) => (
                            <ProductCard key={product.id} product={product} formatPrice={formatPrice} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.02]">
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No items found in this collection.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProductCard = ({ product, formatPrice, index }) => {
    return (
        <Link
            to={`/product/${product.slug}`}
            className="group block relative animate-fade-in-up"
            style={{ animationDelay: `${0.1 + (index * 0.05)}s` }}
        >
            <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-black border border-white/5 relative">
                {product.images && product.images[0] && (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    />
                )}

                {/* Overlay Tags */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.is_new && (
                        <span className="bg-white/90 backdrop-blur text-black text-[9px] font-black px-2 py-1 uppercase tracking-widest rounded-sm">
                            New
                        </span>
                    )}
                    {product.is_sale && (
                        <span className="bg-black text-white text-[9px] font-black px-2 py-1 uppercase tracking-widest rounded-sm">
                            Sale
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-4 flex justify-between items-start gap-4">
                <div>
                    <h3 className="text-sm text-gray-200 font-bold group-hover:text-white transition-colors uppercase tracking-wide">
                        {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 font-medium">{settings?.storeName || 'Nakma Store'}</p>
                </div>
                <div className="text-right">
                    {product.is_sale ? (
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-[#b82063] font-bold">{formatPrice(product.sale_price)}</span>
                            <span className="text-[10px] text-gray-600 line-through">{formatPrice(product.price)}</span>
                        </div>
                    ) : (
                        <span className="text-xs text-white font-bold">{formatPrice(product.price)}</span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default CategoryPage;
