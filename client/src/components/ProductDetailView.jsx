import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useNotification } from '../context/NotificationContext';
import AddToBagButton from './product/AddToBagButton';
import ProductMediaGallery from './product/ProductMediaGallery';

const ProductDetailView = ({
    product,
    variations = [],
    relatedProducts = [],
    settingsOverride = null,
    showNavigation = true,
    isPreview = false,
    isMobileView = false
}) => {
    const settings = settingsOverride || {};
    const { formatPrice, settings: globalSettings } = useStoreSettings();
    const { addToCart } = useCart();
    const { notify } = useNotification();

    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedWeight, setSelectedWeight] = useState(null);
    const [selectedDimension, setSelectedDimension] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeAccordion, setActiveAccordion] = useState(null);

    if (!product) return null;

    const hasVariations = variations.length > 0;
    const colors = product.colors || [];
    const sizes = product.sizes || [];
    const weights = (product.weights || []).map(w => `${w.value}${w.unit}`);
    const dimensions = (product.dimensions || []).map(d => `${d.value}${d.unit}`);

    // Select first options by default if available and not selected? (Optional, but user didn't ask)
    // Actually the image shows a selection.

    const selectedVariation = hasVariations &&
        (selectedSize || !sizes.length) &&
        (selectedColor || !colors.length) &&
        (selectedWeight || !weights.length) &&
        (selectedDimension || !dimensions.length)
        ? variations.find(v =>
            (sizes.length > 0 ? v.size === selectedSize : true) &&
            (colors.length > 0 ? v.color === selectedColor?.name : true) &&
            (weights.length > 0 ? v.weight === selectedWeight : true) &&
            (dimensions.length > 0 ? v.dimension === selectedDimension : true)
        )
        : null;

    // Auto-select if only one option exists
    React.useEffect(() => {
        if (colors.length === 1 && !selectedColor) setSelectedColor(colors[0]);
        if (sizes.length === 1 && !selectedSize) setSelectedSize(sizes[0]);
        if (weights.length === 1 && !selectedWeight) setSelectedWeight(weights[0]);
        if (dimensions.length === 1 && !selectedDimension) setSelectedDimension(dimensions[0]);
    }, [colors, sizes, weights, dimensions]);

    const currentPrice = selectedVariation ? selectedVariation.price : (product.is_sale ? product.sale_price : product.price);
    const maxStock = selectedVariation ? selectedVariation.stock : product.stock;

    const typo = settings.typography || {};
    const layoutStyle = settings.layout?.style || 'classic';
    const contentRatio = settings.layout?.contentRatio || '50/50';
    const spacing = settings.layout?.sectionSpacing || 'comfortable';

    // Classes & Styles
    const getContainerClasses = () => {
        const base = "w-full mx-auto transition-all duration-300";
        if (isMobileView) return `${base} flex flex-col gap-8 px-4 pt-4 pb-8`;

        switch (layoutStyle) {
            case 'narrow': return `${base} max-w-4xl flex flex-col gap-12 px-8 pb-12 pt-8`;
            case 'full': return `${base} max-w-none flex flex-col gap-16`;
            case 'magazine': return `${base} max-w-[1400px] grid grid-cols-12 gap-12 px-12 items-start pb-12 pt-8`;
            case 'classic': default: return `${base} max-w-[1400px] flex flex-col lg:flex-row gap-12 lg:gap-20 px-6 lg:px-16 items-start pb-12 pt-8`;
        }
    };

    const getClassicWidths = () => {
        if (layoutStyle !== 'classic' || isMobileView) return {};
        const ratio = settings.layoutRatio || contentRatio || '1/2,1/2';

        switch (ratio) {
            case '1/3,2/3': return { image: 'lg:w-1/3', content: 'lg:w-2/3' };
            case '2/3,1/3': return { image: 'lg:w-2/3', content: 'lg:w-1/3' };
            case '1/4,3/4': return { image: 'lg:w-1/4', content: 'lg:w-3/4' };
            case '3/4,1/4': return { image: 'lg:w-3/4', content: 'lg:w-1/4' };
            case '60/40': return { image: 'lg:w-[58%]', content: 'lg:w-[38%]' };
            case '40/60': return { image: 'lg:w-[38%]', content: 'lg:w-[58%]' };
            case '1/3,1/3,1/3': return { image: 'lg:w-1/3', content: 'lg:w-1/3', side: 'lg:w-1/3' };
            case '50/50':
            case '1/2,1/2':
            default: return { image: 'lg:w-1/2', content: 'lg:w-1/2' };
        }
    };

    const widths = getClassicWidths();
    const getSpacingClass = () => ({ compact: 'space-y-4', spacious: 'space-y-12', comfortable: 'space-y-8' }[spacing] || 'space-y-8');

    const handleAddToCart = () => {
        if (hasVariations) {
            if (colors.length > 0 && !selectedColor) {
                notify("Please select a color option to continue.", "error");
                return;
            }
            if (sizes.length > 0 && !selectedSize) {
                notify("Please select a size option to continue.", "error");
                return;
            }
            if (weights.length > 0 && !selectedWeight) {
                notify("Please select a weight option to continue.", "error");
                return;
            }
            if (dimensions.length > 0 && !selectedDimension) {
                notify("Please select a dimension option to continue.", "error");
                return;
            }
        }
        const item = selectedVariation ? { ...product, price: selectedVariation.price, variation_id: selectedVariation.id } : product;
        addToCart(item, quantity, selectedSize, selectedColor, selectedWeight, selectedDimension);
        setQuantity(1);
    };

    const handleAccordion = (id) => {
        setActiveAccordion(activeAccordion === id ? null : id);
    };

    // --- Sub-Components ---
    // 0. Breadcrumbs
    const Breadcrumbs = () => (
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary-text">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="material-symbols-outlined text-[10px] opacity-40">chevron_right</span>
            <Link to={`/shop?category=${product.category}`} className="hover:text-primary transition-colors">{product.category || 'Collection'}</Link>
            <span className="material-symbols-outlined text-[10px] opacity-40">chevron_right</span>
            <span className="text-white">{product.name}</span>
        </nav>
    );

    // 1. Rating
    const Rating = () => (
        <div className="flex items-center gap-3 mb-6">
            <div className="flex text-[#FFC400]">
                {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className="material-symbols-outlined text-[16px] filled">star</span>
                ))}
            </div>
            <span className="text-[11px] font-bold text-secondary-text uppercase tracking-widest">128 Reviews</span>
        </div>
    );

    // 2. Quantity Selector (Styled like image)
    const QuantitySelector = () => (
        <div className="flex items-center bg-white/5 rounded-full border border-white/10 p-1 w-36 h-12 shadow-inner group hover:border-white/20 transition-all">
            <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="size-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <div className="flex-1 text-center font-black text-lg text-white">{quantity}</div>
            <button
                onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                className="size-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
        </div>
    );

    // 3. Trust Badges
    const TrustBadges = () => (
        <div className="flex items-center gap-2 py-4 mt-2">
            <span className="material-symbols-outlined text-green-500 text-[18px]">local_shipping</span>
            <span className="text-[10px] font-bold text-secondary-text uppercase tracking-widest leading-none">
                {settings.freeShippingText || `Free shipping on orders over ${formatPrice(100)}`}
            </span>
        </div>
    );

    // 4. Accordion Item
    const AccordionItem = ({ title, content, id, icon }) => (
        <div className="border-b border-white/5">
            <button
                onClick={() => handleAccordion(id)}
                className="w-full py-5 flex items-center justify-between text-left group"
            >
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-gray-400 group-hover:text-white transition-colors">{icon}</span>
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-white group-hover:text-primary transition-colors">{title}</span>
                </div>
                <span className={`material-symbols-outlined text-[20px] text-gray-500 transition-transform duration-300 ${activeAccordion === id ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeAccordion === id ? 'max-h-[500px] opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                <div className="pl-8">
                    <p className="text-sm text-secondary-text leading-relaxed font-medium">
                        {content || "No details provided for this section."}
                    </p>
                </div>
            </div>
        </div>
    );

    // Header Render
    const renderHeader = () => (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <h1 style={{
                    fontFamily: typo.productTitle?.fontFamily || 'inherit',
                    fontSize: typo.productTitle?.fontSize ? `${typo.productTitle.fontSize}px` : '42px',
                    fontWeight: typo.productTitle?.fontWeight || 900,
                    color: typo.productTitle?.color || '#ffffff',
                    letterSpacing: typo.productTitle?.letterSpacing ? `${typo.productTitle.letterSpacing}px` : '-0.02em',
                    textTransform: typo.productTitle?.textTransform || 'none',
                    lineHeight: 1.1
                }}>
                    {product.name}
                </h1>
                <button className="size-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all group">
                    <span className="material-symbols-outlined text-[20px] text-white group-hover:scale-110 active:scale-90 transition-transform">favorite</span>
                </button>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-3xl font-black text-primary" style={{
                    fontFamily: typo.productTitle?.fontFamily || 'inherit'
                }}>
                    {formatPrice(currentPrice)}
                </div>
                <Rating />
            </div>

            <p className="text-sm text-secondary-text leading-relaxed max-w-lg">
                {product.description}
            </p>
        </div>
    );

    const MediaSection = (
        <div className={`transition-all ${widths.image || 'w-full'} ${settings?.layout?.stickyElements?.images && !isMobileView ? 'sticky top-24' : ''}`}>
            <ProductMediaGallery
                images={product.images || []}
                productTitle={product.name}
                settings={{ ...settings, galleryLayout: settings?.galleryLayout || 'magazine' }}
                isNew={product.is_new}
            />
        </div>
    );

    const InfoSection = (
        <div className={`flex flex-col ${widths.content || 'w-full'} ${settings.layout?.stickyElements?.info && !isMobileView ? 'sticky top-24' : ''}`}>
            <div className={getSpacingClass()}>
                {renderHeader()}

                {/* Variants Row */}
                {(colors.length > 0 || sizes.length > 0) && (
                    <div className="flex flex-col gap-8 p-8 bg-white/[0.02] border border-white/5 ring-1 ring-inset ring-white/5 shadow-2xl items-start" style={{ borderRadius: settings.roundingStyle === 'sharp' ? '0' : '2.5rem' }}>
                        {/* Colors */}
                        {colors.length > 0 && (
                            <div className="w-full">
                                <label className="block mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                                    Color {selectedColor && <span className="ml-2 italic">{selectedColor.name}</span>}
                                </label>
                                <div className="flex flex-wrap gap-4">
                                    {colors.map(c => (
                                        <button
                                            key={c.name}
                                            onClick={() => setSelectedColor(selectedColor?.name === c.name ? null : c)}
                                            className={`size-10 border-2 transition-all p-0.5 ${selectedColor?.name === c.name ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-white/10 opacity-60 hover:opacity-100 hover:scale-105'}`}
                                            title={c.name}
                                            style={{ borderRadius: settings.roundingStyle === 'sharp' ? '0' : '999px' }}
                                        >
                                            <div className="w-full h-full" style={{ backgroundColor: c.hex, borderRadius: settings.roundingStyle === 'sharp' ? '0' : '999px' }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sizes */}
                        {sizes.length > 0 && (!colors.length || selectedColor) && (
                            <div className="w-full">
                                <label className="block mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                                    Size {selectedSize && <span className="ml-2 italic">{selectedSize}</span>}
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {sizes.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                                            className={`size-11 flex items-center justify-center text-[11px] font-black transition-all border italic tracking-widest ${selectedSize === s ? 'bg-primary/20 text-white border-primary shadow-lg shadow-primary/10 scale-105' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}
                                            style={{ borderRadius: settings.roundingStyle === 'sharp' ? '0' : '999px' }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Weights */}
                        {weights.length > 0 && (!sizes.length || selectedSize || !colors.length || selectedColor) && (
                            <div className="w-full">
                                <label className="block mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                                    Weight {selectedWeight && <span className="ml-2 italic">{selectedWeight}</span>}
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {weights.map(w => (
                                        <button
                                            key={w}
                                            onClick={() => setSelectedWeight(selectedWeight === w ? null : w)}
                                            className={`h-11 px-5 flex items-center justify-center text-[11px] font-black transition-all border italic tracking-widest ${selectedWeight === w ? 'bg-primary/20 text-white border-primary shadow-lg shadow-primary/10 scale-105' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}
                                            style={{ borderRadius: settings.roundingStyle === 'sharp' ? '0' : '999px' }}
                                        >
                                            {w}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dimensions */}
                        {dimensions.length > 0 && (!weights.length || selectedWeight || !sizes.length || selectedSize || !colors.length || selectedColor) && (
                            <div className="w-full">
                                <label className="block mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                                    Dimension {selectedDimension && <span className="ml-2 italic">{selectedDimension}</span>}
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {dimensions.map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setSelectedDimension(selectedDimension === d ? null : d)}
                                            className={`h-11 px-5 flex items-center justify-center text-[11px] font-black transition-all border italic tracking-widest ${selectedDimension === d ? 'bg-primary/20 text-white border-primary shadow-lg shadow-primary/10 scale-105' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}
                                            style={{ borderRadius: settings.roundingStyle === 'sharp' ? '0' : '999px' }}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-6">
                    <AddToBagButton
                        settings={{
                            ...settings,
                            addToCart: {
                                ...settings?.addToCart,
                                showIcon: true,
                                iconPosition: 'left',
                                showPrice: true,
                                customText: 'Add to Cart',
                                borderRadius: settings.roundingStyle === 'sharp' ? 0 : 99,
                                alignment: settings.addToCartAlignment || 'stretch',
                                styling: {
                                    ...(settings?.addToCart?.styling || {}),
                                    background: '#8B0000',
                                    text: '#ffffff',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    height: 60,
                                }
                            }
                        }}
                        price={currentPrice}
                        onClick={handleAddToCart}
                        disabled={false}
                    />
                    <div className={`flex ${settings.addToCartAlignment === 'center' ? 'justify-center text-center' : settings.addToCartAlignment === 'full' ? 'justify-center text-center' : 'justify-start text-left'}`}>
                        <TrustBadges />
                    </div>
                </div>

                {/* Info Tabs / Accordions */}
                {!widths.side && (
                    <div className="pt-4 space-y-2">
                        <AccordionItem id="features" title="Description & Fit" icon="info" content={product.description_fit || product.description} />
                        <AccordionItem id="care" title="Materials & Care" icon="wash" content={product.materials_care || product.features} />
                    </div>
                )}
            </div>
        </div>
    );

    const SideSection = widths.side ? (
        <div className={`flex flex-col ${widths.side} pt-12`}>
            <div className="space-y-2">
                <AccordionItem id="features" title="Description & Fit" icon="info" content={product.description_fit || product.description} />
                <AccordionItem id="care" title="Materials & Care" icon="wash" content={product.materials_care || product.features} />
            </div>
        </div>
    ) : null;

    // --- Related Products Section ---
    const RelatedProducts = () => (
        <section className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 pt-24 pb-32 border-t border-white/5">
            <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black text-white italic tracking-tight">Complete the Look</h2>
                <Link to="/shop" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors flex items-center gap-2 group">
                    View all <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
                {relatedProducts.slice(0, 4).map((rp) => (
                    <Link key={rp.id} to={`/product/${rp.slug || rp.id}`} className="group block">
                        <div className="aspect-[4/5] overflow-hidden bg-white/5 border border-white/5 mb-6 relative transition-transform duration-500 group-hover:-translate-y-2" style={{ borderRadius: settings.roundingStyle === 'sharp' ? '0' : '2rem' }}>
                            <img src={rp.images?.[0]} alt={rp.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            {rp.is_sale && (
                                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-full">Sale</div>
                            )}
                        </div>
                        <h4 className="text-sm font-black text-white mb-2 group-hover:text-primary transition-colors">{rp.name}</h4>
                        <div className="text-xs font-bold text-secondary-text">{formatPrice(rp.price)}</div>
                    </Link>
                ))}
            </div>
        </section>
    );

    // --- Main Layout ---

    return (
        <div className="bg-black min-h-screen">
            {/* Breadcrumbs Top Container */}
            <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-16 pt-16 md:pt-20 pb-4">
                <Breadcrumbs />
            </div>

            <div className={getContainerClasses()}>
                {layoutStyle === 'magazine' && !isMobileView ? (
                    <>
                        <div className="col-span-7 h-full">
                            {MediaSection}
                        </div>
                        <div className="col-span-1 h-full mx-auto"></div>
                        <div className="col-span-4 pt-12">
                            {InfoSection}
                        </div>
                    </>
                ) : (
                    <>
                        {MediaSection}
                        {InfoSection}
                        {SideSection}
                    </>
                )}
            </div>

            {/* Always show related products at bottom */}
            <RelatedProducts />
        </div>
    );
};

export default ProductDetailView;
