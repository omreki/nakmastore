import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import SEO from '../components/SEO';

const HomePage = () => {
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

    const { formatPrice, settings } = useStoreSettings();
    const [newArrivals, setNewArrivals] = useState([]);
    const [menProducts, setMenProducts] = useState([]);
    const [womenProducts, setWomenProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    const heroImage = settings?.homepageSettings?.hero?.imageUrl || settings?.heroImageUrl;
    const { hero = {}, philosophy = {}, categories = {} } = settings?.homepageSettings || {};

    const heroSub = hero.subHeadline || 'Collection 01';
    const heroH1 = hero.headlineLine1 || 'PRECISION';
    const heroH2 = hero.headlineLine2 || 'APPAREL.';
    const heroD1 = hero.descriptionLine1 || 'High-performance engineered wear.';
    const heroD2 = hero.descriptionLine2 || 'Designed for the relentless mind. Built for the elite body.';

    const philSub = philosophy.subHeadline || 'The Noesis Philosophy';
    const philQuote = philosophy.quote || 'The right gear is the catalyst for your next breakthrough.';
    const philD1 = philosophy.descriptionLine1 || 'Engineered for the relentless individual.';
    const philD2 = philosophy.descriptionLine2 || 'Designed to transcend the boundaries of performance and aesthetic.';
    const philImg = philosophy.imageUrl;

    const menTitle = categories.men?.title || 'Men';
    const menSub = categories.men?.subtitle || 'Engineered Apparel';
    const menImg = categories.men?.imageUrl;

    const womenTitle = categories.women?.title || 'Women';
    const womenSub = categories.women?.subtitle || 'Sculpted Fit';
    const womenImg = categories.women?.imageUrl;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch New Arrivals
                const { data: arrivals, error: arrivalsError } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (arrivalsError) throw arrivalsError;
                setNewArrivals(arrivals || []);

                // Fetch Men's Products
                const { data: men, error: menError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('category', 'men')
                    .limit(4);

                if (menError) throw menError;
                setMenProducts(men || []);

                // Fetch Women's Products
                const { data: women, error: womenError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('category', 'women')
                    .limit(4);

                if (womenError) throw womenError;
                setWomenProducts(women || []);

            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleQuickAdd = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        const color = product.colors && product.colors.length > 0
            ? (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0].hex)
            : null;
        addToCart(product, 1, 'M', color);
    };
    return (
        <div className="bg-[#050505] min-h-screen text-white font-['Manrope']">
            <SEO
                title={settings?.homepageSettings?.seo?.metaTitle || "Home"}
                description={settings?.homepageSettings?.seo?.metaDescription || "Noesis: Precision-engineered fitness apparel. Elevate your performance with gear designed for the relentless."}
            />
            {/* Hero Section */}
            <div className="w-full px-4 md:px-8 pt-24 pb-8 max-w-[1700px] mx-auto relative group">
                {/* Background Ambient Glows */}
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#a14550]/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[4s]"></div>
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#59000a]/15 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6s]"></div>

                <div className="relative w-full h-[500px] md:h-[800px] rounded-[32px] md:rounded-[56px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] border border-white/[0.03] bg-[#050505]">
                    {/* Main Image with optimized blend */}
                    {heroImage && (
                        <div
                            className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-[4s] ease-out group-hover:scale-105"
                            style={{ backgroundImage: `url('${heroImage}')` }}
                        >
                        </div>
                    )}

                    {/* Hollow Faded Background Text */}
                    {hero.hollowText && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                            <span
                                className="font-black leading-none opacity-30 select-none tracking-tighter whitespace-nowrap"
                                style={{
                                    fontSize: "20vw",
                                    WebkitTextStroke: "2px #a14550",
                                    color: "transparent",
                                    transform: "translateY(-5%)"
                                }}
                            >
                                {hero.hollowText}
                            </span>
                        </div>
                    )}

                    {/* Sophisticated Apple-Style Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"></div>

                    {/* Radial Highlight for sleekness */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(161,69,80,0.2),transparent_60%)]"></div>

                    {/* Content Section */}
                    <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-28 z-10">
                        <div className="max-w-2xl space-y-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-[1px] w-8 bg-[#a14550]"></div>
                                    <span className="text-[#a14550] text-[10px] md:text-xs font-black uppercase tracking-[0.8em] animate-fade-in">{heroSub}</span>
                                </div>
                                <h1 className="text-white text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] md:leading-[0.8] drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]">
                                    {heroH1} <br />
                                    <span className="text-white/40 italic font-medium">{heroH2}</span>
                                </h1>
                            </div>

                            <p className="text-white/50 text-base md:text-xl font-medium max-w-lg leading-relaxed tracking-tight">
                                {heroD1} <br />
                                <span className="text-white/80">{heroD2}</span>
                            </p>

                            <div className="flex flex-wrap gap-4 md:gap-5 pt-6">
                                <Link to="/shop" className="inline-flex items-center gap-3 md:gap-4 bg-white text-black hover:bg-[#a14550] hover:text-white px-8 md:px-10 py-4 md:py-5 rounded-full font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] transition-all duration-700 transform hover:scale-[1.02] active:scale-95 shadow-2xl group/btn">
                                    Shop Collection
                                    <span className="material-symbols-outlined text-[18px] md:text-[20px] transition-transform group-hover/btn:translate-x-2">east</span>
                                </Link>
                                <Link to="/about" className="inline-flex items-center gap-3 md:gap-4 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] hover:bg-white/[0.08] text-white px-8 md:px-10 py-4 md:py-5 rounded-full font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] transition-all duration-700 shadow-xl">
                                    The Story
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Minimalist Scroll Cue */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20">
                        <div className="w-px h-16 bg-gradient-to-b from-white via-white/50 to-transparent"></div>
                    </div>
                </div>
            </div>

            {/* Philosophy/Women's Collection Section */}
            <div className="w-full px-4 md:px-8 py-12 md:py-16 max-w-[1700px] mx-auto">
                <div className="relative w-full h-[400px] md:h-[600px] rounded-[32px] md:rounded-[56px] overflow-hidden group shadow-2xl border border-white/[0.03]">
                    {/* Background Image - Women's Gym Outfit */}
                    {philImg && (
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-[5s] group-hover:scale-105"
                            style={{ backgroundImage: `url('${philImg}')` }}
                        ></div>
                    )}

                    {/* Overlays & Gradients */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(161,69,80,0.1),transparent_70%)]"></div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 md:p-12 z-10">
                        <div className="max-w-4xl space-y-8">
                            <span className="text-[#a14550] text-[10px] md:text-xs font-black uppercase tracking-[0.6em] animate-fade-in opacity-90">{philSub}</span>

                            <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.15] tracking-tight italic drop-shadow-2xl">
                                "{philQuote}"
                            </h2>

                            <p className="text-white/50 text-base md:text-xl font-medium tracking-tight max-w-2xl mx-auto">
                                {philD1} <br />
                                <span className="text-white/80">{philD2}</span>
                            </p>

                            <div className="pt-6">
                                <Link to="/women" className="inline-flex items-center gap-3 bg-white text-black hover:bg-[#a14550] hover:text-white px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 shadow-xl group/btn_w">
                                    Shop Women's
                                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover/btn_w:translate-x-1">east</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Section */}
            <div className="w-full px-4 md:px-6 py-12 max-w-[1600px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Men Card */}
                    <Link to="/men" className="relative aspect-[4/5] md:aspect-[4/3] rounded-[40px] overflow-hidden group block shadow-2xl bg-[#121212]">
                        {menImg && (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                style={{ backgroundImage: `url('${menImg}')` }}
                            >
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 flex items-end justify-between">
                            <div>
                                <h3 className="text-white text-2xl md:text-4xl font-bold mb-1 md:mb-2">{menTitle}</h3>
                                <p className="text-white/60 text-sm md:text-lg font-medium">{menSub}</p>
                            </div>
                            <div className="size-12 md:size-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-[#59000a] group-hover:border-[#59000a] transition-all duration-300 transform group-hover:translate-x-2">
                                <span className="material-symbols-outlined text-[24px] md:text-[32px]">arrow_forward</span>
                            </div>
                        </div>
                    </Link>

                    {/* Women Card */}
                    <Link to="/women" className="relative aspect-[4/5] md:aspect-[4/3] rounded-[40px] overflow-hidden group block shadow-2xl bg-[#121212]">
                        {womenImg && (
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                style={{ backgroundImage: `url('${womenImg}')` }}
                            >
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 flex items-end justify-between">
                            <div>
                                <h3 className="text-white text-2xl md:text-4xl font-bold mb-1 md:mb-2">{womenTitle}</h3>
                                <p className="text-white/60 text-sm md:text-lg font-medium">{womenSub}</p>
                            </div>
                            <div className="size-12 md:size-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-[#59000a] group-hover:border-[#59000a] transition-all duration-300 transform group-hover:translate-x-2">
                                <span className="material-symbols-outlined text-[24px] md:text-[32px]">arrow_forward</span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* New Arrivals Header */}
            <div className="w-full px-4 md:px-8 max-w-[1600px] mx-auto pt-16 md:pt-24 pb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-white text-2xl md:text-4xl font-bold tracking-tight uppercase tracking-widest leading-none">New Arrivals</h2>
                    <p className="text-white/40 mt-3 text-sm md:text-lg font-medium italic">Premium gear for your next session.</p>
                </div>
                <Link to="/shop" className="hidden sm:flex items-center gap-1 text-white font-bold hover:text-primary-light transition-colors bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:bg-white/10 shadow-sm">
                    Shop All <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </Link>
            </div>

            {/* New Arrivals Grid */}
            <div className="w-full px-4 md:px-8 max-w-[1600px] mx-auto pb-24">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="size-12 border-4 border-white/5 border-t-[#a14550] rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {newArrivals.map((product) => (
                            <Link to={`/product/${product.slug}`} key={product.id} className="group cursor-pointer">
                                <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden mb-6 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-2">
                                    <img
                                        src={product.images?.[0] || 'https://via.placeholder.com/300?text=Product'}
                                        alt={product.name}
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                    />

                                    {/* Quick Add Button */}
                                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none md:pointer-events-auto">
                                        <button
                                            onClick={(e) => handleQuickAdd(e, product)}
                                            className="w-full h-10 md:h-12 bg-black text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-[#a14550] transition-colors shadow-xl pointer-events-auto"
                                        >
                                            Add to Bag
                                        </button>
                                    </div>
                                </div>
                                <div className="px-2">
                                    <div className="flex flex-col gap-1 mb-1">
                                        <h3 className="text-white font-bold text-lg group-hover:text-[#a14550] transition-colors line-clamp-1 uppercase tracking-tight">{product.name}</h3>
                                        <div className="flex items-center gap-2">
                                            {product.is_sale && product.sale_price ? (
                                                <>
                                                    <span className="text-[#a14550] font-black italic text-lg whitespace-nowrap leading-none">{formatPrice(product.sale_price)}</span>
                                                    <span className="text-white/30 font-bold text-[10px] line-through decoration-1">{formatPrice(product.price)}</span>
                                                </>
                                            ) : (
                                                <span className="text-white font-black italic text-lg whitespace-nowrap leading-none">{formatPrice(product.price)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{product.category}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Men's Collection Header */}
            <div className="w-full px-4 md:px-8 max-w-[1600px] mx-auto pt-16 md:pt-24 pb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-white text-2xl md:text-4xl font-bold tracking-tight uppercase tracking-widest leading-none">Men's Collection</h2>
                    <p className="text-white/40 mt-3 text-sm md:text-lg font-medium italic">Engineered for performance.</p>
                </div>
                <Link to="/men" className="hidden sm:flex items-center gap-1 text-white font-bold hover:text-primary-light transition-colors bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:bg-white/10 shadow-sm">
                    Shop All <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </Link>
            </div>

            {/* Men's Collection Grid */}
            <div className="w-full px-4 md:px-8 max-w-[1600px] mx-auto pb-24">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="size-12 border-4 border-white/5 border-t-[#a14550] rounded-full animate-spin"></div>
                    </div>
                ) : menProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {menProducts.map((product) => (
                            <Link to={`/product/${product.slug}`} key={product.id} className="group cursor-pointer">
                                <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden mb-6 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-2">
                                    <img
                                        src={product.images?.[0] || 'https://via.placeholder.com/300?text=Product'}
                                        alt={product.name}
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                    />

                                    {/* Quick Add Button */}
                                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none md:pointer-events-auto">
                                        <button
                                            onClick={(e) => handleQuickAdd(e, product)}
                                            className="w-full h-10 md:h-12 bg-black text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-[#a14550] transition-colors shadow-xl pointer-events-auto"
                                        >
                                            Add to Bag
                                        </button>
                                    </div>
                                </div>
                                <div className="px-2">
                                    <div className="flex flex-col gap-1 mb-1">
                                        <h3 className="text-white font-bold text-lg group-hover:text-[#a14550] transition-colors line-clamp-1 uppercase tracking-tight">{product.name}</h3>
                                        <div className="flex items-center gap-2">
                                            {product.is_sale && product.sale_price ? (
                                                <>
                                                    <span className="text-[#a14550] font-black italic text-lg whitespace-nowrap leading-none">{formatPrice(product.sale_price)}</span>
                                                    <span className="text-white/30 font-bold text-[10px] line-through decoration-1">{formatPrice(product.price)}</span>
                                                </>
                                            ) : (
                                                <span className="text-white font-black italic text-lg whitespace-nowrap leading-none">{formatPrice(product.price)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{product.category}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-white/40 text-lg">No men's products available yet.</p>
                    </div>
                )}
            </div>

            {/* Women's Collection Header */}
            <div className="w-full px-4 md:px-8 max-w-[1600px] mx-auto pt-16 md:pt-24 pb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-white text-2xl md:text-4xl font-bold tracking-tight uppercase tracking-widest leading-none">Women's Collection</h2>
                    <p className="text-white/40 mt-3 text-sm md:text-lg font-medium italic">Sculpted for excellence.</p>
                </div>
                <Link to="/women" className="hidden sm:flex items-center gap-1 text-white font-bold hover:text-primary-light transition-colors bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:bg-white/10 shadow-sm">
                    Shop All <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </Link>
            </div>

            {/* Women's Collection Grid */}
            <div className="w-full px-4 md:px-8 max-w-[1600px] mx-auto pb-24">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="size-12 border-4 border-white/5 border-t-[#a14550] rounded-full animate-spin"></div>
                    </div>
                ) : womenProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {womenProducts.map((product) => (
                            <Link to={`/product/${product.slug}`} key={product.id} className="group cursor-pointer">
                                <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden mb-6 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-2">
                                    <img
                                        src={product.images?.[0] || 'https://via.placeholder.com/300?text=Product'}
                                        alt={product.name}
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                    />

                                    {/* Quick Add Button */}
                                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none md:pointer-events-auto">
                                        <button
                                            onClick={(e) => handleQuickAdd(e, product)}
                                            className="w-full h-10 md:h-12 bg-black text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-[#a14550] transition-colors shadow-xl pointer-events-auto"
                                        >
                                            Add to Bag
                                        </button>
                                    </div>
                                </div>
                                <div className="px-2">
                                    <div className="flex flex-col gap-1 mb-1">
                                        <h3 className="text-white font-bold text-lg group-hover:text-[#a14550] transition-colors line-clamp-1 uppercase tracking-tight">{product.name}</h3>
                                        <div className="flex items-center gap-2">
                                            {product.is_sale && product.sale_price ? (
                                                <>
                                                    <span className="text-[#a14550] font-black italic text-lg whitespace-nowrap leading-none">{formatPrice(product.sale_price)}</span>
                                                    <span className="text-white/30 font-bold text-[10px] line-through decoration-1">{formatPrice(product.price)}</span>
                                                </>
                                            ) : (
                                                <span className="text-white font-black italic text-lg whitespace-nowrap leading-none">{formatPrice(product.price)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{product.category}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-white/40 text-lg">No women's products available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;
