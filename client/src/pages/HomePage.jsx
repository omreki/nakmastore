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
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    const heroImage = settings?.homepageSettings?.hero?.imageUrl || settings?.heroImageUrl;
    const { hero = {}, philosophy = {}, categories = {} } = settings?.homepageSettings || {};

    const heroSub = hero.subHeadline || '';
    const heroH1 = hero.headlineLine1 || '';
    const heroH2 = hero.headlineLine2 || '';
    const heroD1 = hero.descriptionLine1 || '';
    const heroD2 = hero.descriptionLine2 || '';
    const heroImg = hero.imageUrl || '';

    const philSub = philosophy.subHeadline || '';
    const philQuote = philosophy.quote || '';
    const philD1 = philosophy.descriptionLine1 || '';
    const philD2 = philosophy.descriptionLine2 || '';
    const philImg = philosophy.imageUrl || '';

    const printsTitle = categories.prints?.title || '';
    const printsSub = categories.prints?.subtitle || '';
    const printsImg = categories.prints?.imageUrl || '';

    const plainsTitle = categories.plains?.title || '';
    const plainsSub = categories.plains?.subtitle || '';
    const plainsImg = categories.plains?.imageUrl || '';

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch New Arrivals
                const { data: arrivals, error: arrivalsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('is_draft', false)
                    .order('created_at', { ascending: false })
                    .limit(6);

                if (arrivalsError) throw arrivalsError;
                setNewArrivals(arrivals || []);



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
        <div className="bg-secondary min-h-screen text-white font-['Manrope']">
            <SEO
                title={settings?.homepageSettings?.seo?.metaTitle || "Home"}
                description={settings?.homepageSettings?.seo?.metaDescription || "Nakma Store: Unique African-inspired men's fashion. Blend heritage with modern design for the contemporary man."}
            />
            {/* Hero Section */}
            <div className="layout-container pt-24 pb-8 relative group">
                {/* Background Ambient Glows */}
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[4s]"></div>
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-primary-dark/15 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6s]"></div>

                <div className="relative w-full h-[500px] md:h-[800px] rounded-[32px] md:rounded-[56px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] border border-white/[0.03] bg-secondary bg-gradient-to-br from-primary/20 via-secondary to-secondary">
                    {/* Main Image with optimized blend */}
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                        <img
                            src={heroImg}
                            alt="Hero Background"
                            className="w-full h-full object-cover object-center transition-transform duration-[4s] ease-out group-hover:scale-105"
                        />
                    </div>

                    {/* Hollow Faded Background Text */}
                    {hero.hollowText && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-15 select-none">
                            <svg
                                className="w-full h-full"
                                viewBox={`${-(hero.hollowTextPadding ?? 5) * 5} 0 ${(hero.hollowText.length * 55) + (hero.hollowTextPadding ?? 5) * 10} 120`}
                                preserveAspectRatio={
                                    hero.hollowTextViewMode === 'fill' ? 'none' :
                                        hero.hollowTextViewMode === 'cover' ? 'xMidYMid slice' :
                                            'xMidYMid meet'
                                }
                            >
                                <text
                                    x="50%"
                                    y="55%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="font-black tracking-tighter uppercase"
                                    style={{
                                        fontSize: "100px",
                                        fill: "none",
                                        stroke: "var(--color-primary)",
                                        strokeWidth: `${hero.hollowTextStroke ?? 1}px`,
                                        opacity: (hero.hollowTextOpacity ?? 20) / 100,
                                    }}
                                >
                                    {hero.hollowText}
                                </text>
                            </svg>
                        </div>
                    )}

                    {/* Sophisticated Apple-Style Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-[5]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-[5]"></div>

                    {/* Radial Highlight for sleekness */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(48, 19, 106,0.2),transparent_60%)] z-[5]"></div>

                    {/* Content Section */}
                    <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-28 z-20">
                        <div className="max-w-2xl space-y-10">
                            <div className="space-y-4">
                                {heroSub && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-[1px] w-8 bg-primary"></div>
                                        <span className="text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.8em] animate-fade-in">{heroSub}</span>
                                    </div>
                                )}
                                {heroH1 && (
                                    <h1 className="text-white text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] md:leading-[0.8] drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]">
                                        {heroH1} <br />
                                        <span className="text-white/40 italic font-medium">{heroH2}</span>
                                    </h1>
                                )}
                            </div>

                            {(heroD1 || heroD2) && (
                                <p className="text-white/50 text-base md:text-xl font-medium max-w-lg leading-relaxed tracking-tight">
                                    {heroD1} <br />
                                    <span className="text-white/80">{heroD2}</span>
                                </p>
                            )}

                            <div className="flex flex-wrap gap-4 md:gap-5 pt-6">
                                <Link to="/shop" className="inline-flex items-center gap-3 md:gap-4 bg-white text-black hover:bg-primary hover:text-white px-8 md:px-10 py-4 md:py-5 rounded-full font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] transition-all duration-700 transform hover:scale-[1.02] active:scale-95 shadow-2xl group/btn">
                                    Explore Collection
                                    <span className="material-symbols-outlined text-[18px] md:text-[20px] transition-transform group-hover/btn:translate-x-2">east</span>
                                </Link>
                                <Link to="/about" className="inline-flex items-center gap-3 md:gap-4 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] hover:bg-white/[0.08] text-white px-8 md:px-10 py-4 md:py-5 rounded-full font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] transition-all duration-700 shadow-xl">
                                    Our Story
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

            {/* New Arrivals Header */}
            <div className="layout-container pt-16 md:pt-24 pb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-white text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none">New Arrivals</h2>
                    <p className="text-white/40 mt-3 text-sm md:text-lg font-medium italic">Elevated African style for the modern man.</p>
                </div>
                <Link to="/shop" className="hidden sm:flex items-center gap-1 text-white font-bold hover:text-primary transition-colors bg-white/5 px-6 py-3 rounded-full border border-white/10 hover:bg-white/10 shadow-sm">
                    Shop All <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </Link>
            </div>

            {/* New Arrivals Grid */}
            <div className="layout-container pb-16">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="size-12 border-4 border-white/5 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
                        {newArrivals.map((product) => (
                            <Link to={`/product/${product.slug}`} key={product.id} className="group cursor-pointer">
                                <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden mb-4 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-2 border border-white/5">
                                    <img
                                        src={product.images?.[0] || 'https://via.placeholder.com/300?text=Product'}
                                        alt={product.name}
                                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                    />

                                    {/* Quick Add Button */}
                                    <div className="absolute bottom-4 left-4 right-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none md:pointer-events-auto">
                                        <button
                                            onClick={(e) => handleQuickAdd(e, product)}
                                            className="w-full h-10 bg-black text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary transition-colors shadow-xl pointer-events-auto"
                                        >
                                            Add to Bag
                                        </button>
                                    </div>
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
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Philosophy/Women's Collection Section */}
            <div className="layout-container py-12 md:py-16">
                <div className="relative w-full h-[400px] md:h-[600px] rounded-[32px] md:rounded-[56px] overflow-hidden group shadow-2xl border border-white/[0.03] bg-gradient-to-br from-primary/10 via-secondary to-secondary">
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
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(48, 19, 106,0.1),transparent_70%)]"></div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 md:p-12 z-10">
                        <div className="max-w-4xl space-y-8">
                            {philSub && <span className="text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.6em] animate-fade-in opacity-90">{philSub}</span>}

                            {philQuote && (
                                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.15] tracking-tight italic drop-shadow-2xl">
                                    "{philQuote}"
                                </h2>
                            )}

                            {(philD1 || philD2) && (
                                <p className="text-white/50 text-base md:text-xl font-medium tracking-tight max-w-2xl mx-auto">
                                    {philD1} <br />
                                    <span className="text-white/80">{philD2}</span>
                                </p>
                            )}

                            <div className="pt-6">
                                <Link to="/about" className="inline-flex items-center gap-3 bg-white text-black hover:bg-primary hover:text-white px-8 py-4 rounded-full font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 shadow-xl group/btn_w">
                                    Read Our Story
                                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover/btn_w:translate-x-1">east</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Section */}
            <div className="layout-container py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Vibrant Prints Card */}
                    {printsTitle && (
                        <Link to="/category/vibrant-prints" className="relative aspect-[4/5] md:aspect-[4/3] rounded-[40px] overflow-hidden group block shadow-2xl bg-[#121212] bg-gradient-to-t from-primary/20 to-secondary">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                style={{ backgroundImage: `url('${printsImg}')` }}
                            >
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                            <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 flex items-end justify-between">
                                <div>
                                    <h3 className="text-white text-2xl md:text-4xl font-bold mb-1 md:mb-2">{printsTitle}</h3>
                                    <p className="text-white/60 text-sm md:text-lg font-medium">{printsSub}</p>
                                </div>
                                <div className="size-12 md:size-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary transition-all duration-300 transform group-hover:translate-x-2">
                                    <span className="material-symbols-outlined text-[24px] md:text-[32px]">arrow_forward</span>
                                </div>
                            </div>
                        </Link>
                    )}

                    {/* Classic Plains Card */}
                    {plainsTitle && (
                        <Link to="/category/classic-plains" className="relative aspect-[4/5] md:aspect-[4/3] rounded-[40px] overflow-hidden group block shadow-2xl bg-[#121212] bg-gradient-to-t from-primary/20 to-secondary">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                style={{ backgroundImage: `url('${plainsImg}')` }}
                            >
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                            <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10 flex items-end justify-between">
                                <div>
                                    <h3 className="text-white text-2xl md:text-4xl font-bold mb-1 md:mb-2">{plainsTitle}</h3>
                                    <p className="text-white/60 text-sm md:text-lg font-medium">{plainsSub}</p>
                                </div>
                                <div className="size-12 md:size-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary transition-all duration-300 transform group-hover:translate-x-2">
                                    <span className="material-symbols-outlined text-[24px] md:text-[32px]">arrow_forward</span>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

        </div>
    );
};

export default HomePage;
