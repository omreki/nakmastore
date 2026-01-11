import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
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
    const { addToCart } = useCart();

    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeAccordion, setActiveAccordion] = useState(null);

    if (!product) return null;

    const hasVariations = variations.length > 0;
    const colors = product.colors || [];
    const sizes = product.sizes || [];

    // Select first options by default if available and not selected? (Optional, but user didn't ask)
    // Actually the image shows a selection.

    const selectedVariation = hasVariations && selectedSize && selectedColor
        ? variations.find(v => v.size === selectedSize && v.color === selectedColor)
        : null;

    const currentPrice = selectedVariation ? selectedVariation.price : (product.is_sale ? product.sale_price : product.price);
    const maxStock = selectedVariation ? selectedVariation.stock : product.stock;

    const typo = settings.typography || {};
    const layoutStyle = settings.layout?.style || 'classic';
    const contentRatio = settings.layout?.contentRatio || '50/50';
    const spacing = settings.layout?.sectionSpacing || 'comfortable';

    // Classes & Styles
    const getContainerClasses = () => {
        const base = "w-full mx-auto transition-all duration-300";
        if (isMobileView) return `${base} flex flex-col gap-8 px-4 py-8`;

        switch (layoutStyle) {
            case 'narrow': return `${base} max-w-4xl flex flex-col gap-12 px-8 py-12`;
            case 'full': return `${base} max-w-none flex flex-col gap-16`;
            case 'magazine': return `${base} max-w-[1400px] grid grid-cols-12 gap-12 px-12 items-start py-12`;
            case 'classic': default: return `${base} max-w-[1400px] flex flex-col lg:flex-row gap-12 lg:gap-20 px-6 lg:px-16 items-start py-12`;
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
            case '50/50':
            case '1/2,1/2':
            default: return { image: 'lg:w-1/2', content: 'lg:w-1/2' };
        }
    };

    const widths = getClassicWidths();
    const getSpacingClass = () => ({ compact: 'space-y-4', spacious: 'space-y-12', comfortable: 'space-y-8' }[spacing] || 'space-y-8');

    const handleAddToCart = () => {
        const item = selectedVariation ? { ...product, price: selectedVariation.price, variation_id: selectedVariation.id } : product;
        addToCart(item, quantity, selectedSize, selectedColor);
        setQuantity(1);
    };

    const handleAccordion = (id) => {
        setActiveAccordion(activeAccordion === id ? null : id);
    };

    // --- Sub-Components ---

    // 1. Rating
    const Rating = () => (
        <div className="flex items-center gap-2 mb-2">
            <div className="flex text-primary">
                {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className="material-symbols-outlined text-[18px] filled">star</span>
                ))}
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">128 Verified Reviews</span>
        </div>
    );

    // 2. Quantity Selector (Styled like image)
    const QuantitySelector = () => (
        <div className="flex items-center bg-[#111] rounded-full border border-white/10 p-1 w-36 h-12 shadow-inner">
            <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="size-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <div className="flex-1 text-center font-black text-lg italic text-white">{quantity}</div>
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
        <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-white/5 opacity-60">
            <div className="flex flex-col items-center gap-2 text-center">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">Free Shipping</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
                <span className="material-symbols-outlined text-[20px]">history</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">30-Day Returns</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">2yr Warranty</span>
            </div>
        </div>
    );

    // 4. Accordion Item
    const AccordionItem = ({ title, content, id }) => (
        <div className="border-b border-white/10">
            <button
                onClick={() => handleAccordion(id)}
                className="w-full py-4 flex items-center justify-between text-left group"
            >
                <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">{title}</span>
                <span className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${activeAccordion === id ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${activeAccordion === id ? 'max-h-40 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">{content}</p>
            </div>
        </div>
    );

    // Header Render
    const renderHeader = () => (
        <div className="space-y-3">
            {/* Subtitle / Breadcrumb-ish */}
            <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">
                {product.category || 'Collection'}
            </div>

            <h1 style={{
                fontFamily: typo.productTitle?.fontFamily,
                fontSize: `${typo.productTitle?.fontSize}px`,
                fontWeight: typo.productTitle?.fontWeight,
                color: typo.productTitle?.color,
                letterSpacing: `${typo.productTitle?.letterSpacing}px`,
                textTransform: typo.productTitle?.textTransform,
                lineHeight: 1
            }}>
                {product.name}
            </h1>

            <Rating />

            <div className="flex items-center gap-4 mt-2" style={{
                fontSize: `${typo.price?.fontSize}px`,
                fontFamily: typo.productTitle?.fontFamily
            }}>
                {product.is_sale && (
                    <span className="line-through opacity-40 text-[0.8em]" style={{ color: typo.price?.color }}>
                        ${product.price}
                    </span>
                )}
                <span className="italic font-bold" style={{ color: product.is_sale ? (typo.price?.saleColor || '#ff0000') : typo.price?.color }}>
                    Ksh {currentPrice}
                </span>
            </div>

            {maxStock < 5 && maxStock > 0 && (
                <div className="flex items-center gap-2 mt-2">
                    <span className="flex size-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Low Stock: Only {maxStock} units left!</span>
                </div>
            )}
        </div>
    );

    const MediaSection = (
        <div className={`transition-all ${widths.image || 'w-full'} ${settings.layout?.stickyElements?.images && !isMobileView ? 'sticky top-24' : ''}`}>
            <ProductMediaGallery
                images={product.images || []}
                productTitle={product.name}
                settings={settings}
                isNew={product.is_new}
            />
        </div>
    );

    const InfoSection = (
        <div className={`flex flex-col ${widths.content || 'w-full'} ${settings.layout?.stickyElements?.info && !isMobileView ? 'sticky top-24' : ''}`}>
            <div className={getSpacingClass()}>
                {renderHeader()}

                <div style={{
                    fontFamily: typo.description?.fontFamily,
                    fontSize: `${typo.description?.fontSize}px`,
                    color: typo.description?.color,
                    lineHeight: typo.description?.lineHeight
                }}>
                    <h3 className="text-sm font-bold text-gray-500 mb-1">{product.category}</h3>
                </div>

                {/* Variants */}
                {(colors.length > 0 || sizes.length > 0) && (
                    <div className="space-y-6">
                        {/* Colors */}
                        {colors.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Select Color: <span className="text-white ml-1">{selectedColor?.name}</span></label>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map(c => (
                                        <button
                                            key={c.name}
                                            onClick={() => setSelectedColor(c)}
                                            className={`size-10 rounded-full border-2 transition-all ${selectedColor?.name === c.name ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-white/10 hover:border-white/50'}`}
                                            style={{ backgroundColor: c.hex }}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sizes */}
                        {sizes.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Size: <span className="text-white ml-1">{selectedSize}</span></label>
                                    <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors">Size Guide</button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {sizes.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setSelectedSize(s)}
                                            className={`size-12 rounded-xl flex items-center justify-center text-xs font-black transition-all border ${selectedSize === s ? 'bg-white text-black border-white scale-105 shadow-lg' : 'bg-[#111] text-gray-400 border-white/10 hover:border-white/40 hover:text-white'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Quantity */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Quantity</label>
                    <QuantitySelector />
                    {maxStock > 0 && maxStock < 10 && <span className="text-[10px] font-bold text-gray-600 italic">Max Available: {maxStock}</span>}
                </div>

                {/* Add to Cart Button */}
                <AddToBagButton
                    settings={settings}
                    price={`$${currentPrice}`}
                    onClick={handleAddToCart}
                    disabled={hasVariations && (!selectedSize || (!selectedColor && colors.length > 0))}
                />

                {settings.advanced?.showTrustBadges && <TrustBadges />}

                {/* Accordions */}
                <div className="pt-8 mt-8 border-t border-white/5 space-y-2">
                    <AccordionItem id="features" title="Features" content="Engineered with our proprietary Noesis fabric for unmatched breathability and 4-way stretch. Moisture-wicking technology keeps you dry while the ergonomic seams prevent chafing." />
                    <AccordionItem id="care" title="Care" content="Machine wash cold with like colors. Tumble dry low. Do not bleach. Do not iron. Do not dry clean." />
                </div>
            </div>
        </div>
    );

    // --- Main Layout ---

    if (layoutStyle === 'full') {
        return (
            <div className={getContainerClasses()}>
                <div className="w-full">
                    <ProductMediaGallery settings={{ ...settings, productImages: { ...settings.productImages, aspectRatio: '21:9', fit: 'cover' } }} images={product.images} productTitle={product.name} isNew={product.is_new} />
                </div>
                <div className="max-w-4xl mx-auto w-full">
                    {InfoSection}
                </div>
            </div>
        );
    }

    // Magazine or Classic/Narrow
    if (layoutStyle === 'magazine' && !isMobileView) {
        return (
            <div className={getContainerClasses()}>
                <div className="col-span-7 h-full sticky top-24">
                    <ProductMediaGallery settings={settings} images={product.images} productTitle={product.name} isNew={product.is_new} />
                </div>
                <div className="col-span-1 border-l border-white/10 h-full mx-auto"></div>
                <div className="col-span-4 pt-12">
                    {InfoSection}
                </div>
            </div>
        );
    }

    return (
        <div className={getContainerClasses()}>
            {MediaSection}
            {InfoSection}
        </div>
    );
};

export default ProductDetailView;
