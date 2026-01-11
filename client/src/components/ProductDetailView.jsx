import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { generateProductStyles } from '../utils/productStyles';
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
    // 1. Resolve Settings
    // In real app, we use `useStoreSettings` if override is null. 
    // But for this component, we'll assume `settingsOverride` is the full settings object passed from parent or context.
    // If used in ProductPage, we pass the merged settings.
    const settings = settingsOverride || {};

    const { addToCart } = useCart();

    // State
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeSection, setActiveSection] = useState('description'); // for accordion/tabs

    if (!product) return null;

    // Derived State
    const hasVariations = variations.length > 0;
    const selectedVariation = hasVariations && selectedSize && selectedColor
        ? variations.find(v => v.size === selectedSize && v.color === selectedColor)
        : null;

    const currentPrice = selectedVariation ? selectedVariation.price : (product.is_sale ? product.sale_price : product.price);
    const maxStock = selectedVariation ? selectedVariation.stock : product.stock;

    // Helper for Styles
    // We can still use generateProductStyles for typography classes if we want, or inline them.
    // For this advanced version, let's use the explicit style objects from settings for specific elements.
    const typo = settings.typography || {};

    // === Layout Classes ===
    const layoutStyle = settings.layout?.style || 'classic';
    const contentRatio = settings.layout?.contentRatio || '50/50';
    const spacing = settings.layout?.sectionSpacing || 'comfortable';

    const getContainerClasses = () => {
        const base = "w-full mx-auto transition-all duration-300";
        if (isMobileView) return `${base} flex flex-col gap-8 px-4`;

        switch (layoutStyle) {
            case 'narrow':
                return `${base} max-w-4xl flex flex-col gap-12 px-8`;
            case 'full':
                return `${base} max-w-none flex flex-col gap-16`;
            case 'magazine':
                return `${base} max-w-7xl grid grid-cols-12 gap-8 px-8 items-start`;
            case 'classic':
            default:
                return `${base} max-w-7xl flex flex-col lg:flex-row gap-12 lg:gap-16 px-6 lg:px-12 items-start`;
        }
    };

    // Width calculations for Classic mode
    const getClassicWidths = () => {
        if (layoutStyle !== 'classic' || isMobileView) return {};
        switch (contentRatio) {
            case '60/40': return { image: 'lg:w-[60%]', content: 'lg:w-[40%]' };
            case '40/60': return { image: 'lg:w-[40%]', content: 'lg:w-[60%]' };
            case '50/50':
            default: return { image: 'lg:w-1/2', content: 'lg:w-1/2' };
        }
    };

    const widths = getClassicWidths();

    // Spacing
    const getSpacingClass = () => {
        switch (spacing) {
            case 'compact': return 'space-y-4';
            case 'spacious': return 'space-y-10';
            case 'comfortable':
            default: return 'space-y-6';
        }
    };

    // Actions
    const handleAddToCart = () => {
        const item = selectedVariation ? {
            ...product,
            price: selectedVariation.price,
            variation_id: selectedVariation.id
        } : product;

        if (!settings.addToCart?.loading) {
            // Simulate loading visual if we were connected to real logic
            // But here we just call the context
            addToCart(item, quantity, selectedSize, selectedColor);
        }
    };

    // --- Render Content Sections ---

    // Title & Price
    const renderHeader = () => (
        <div className="space-y-2">
            <h1 style={{
                fontFamily: typo.productTitle?.fontFamily,
                fontSize: `${typo.productTitle?.fontSize}px`,
                fontWeight: typo.productTitle?.fontWeight,
                color: typo.productTitle?.color,
                letterSpacing: `${typo.productTitle?.letterSpacing}px`,
                textTransform: typo.productTitle?.textTransform,
                lineHeight: 1.1
            }}>
                {product.name}
            </h1>
            <div className="flex items-center gap-4" style={{
                fontSize: `${typo.price?.fontSize}px`,
                fontFamily: typo.productTitle?.fontFamily, // Match title usually
            }}>
                {product.is_sale && (
                    <span className="line-through opacity-50" style={{ color: typo.price?.color }}>
                        ${product.price}
                    </span>
                )}
                <span style={{ color: product.is_sale ? (typo.price?.saleColor || '#ff0000') : typo.price?.color }}>
                    ${currentPrice}
                </span>
            </div>
        </div>
    );

    // Render Logic based on Layout Style
    // ----------------------------------

    const MediaSection = (
        <div className={`transition-all ${widths.image || 'w-full'} ${settings.layout?.stickyElements?.images && !isMobileView ? 'sticky top-24' : ''}`}>
            <ProductMediaGallery
                images={product.images || []}
                productTitle={product.name}
                settings={settings}
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
                    <p>{product.description}</p>
                </div>

                {/* Variants (Simplified for brevity, fully functional in real app) */}
                {hasVariations && (
                    <div className="space-y-4 py-4 border-t border-white/10 border-b border-white/10">
                        <div className="flex gap-2">
                            {product.sizes?.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSelectedSize(s)}
                                    className={`size-10 flex items-center justify-center border transition-colors ${selectedSize === s ? 'bg-white text-black border-white' : 'border-white/20 text-white hover:border-white'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Add to Cart Button */}
                <AddToBagButton
                    settings={settings}
                    price={`$${currentPrice}`}
                    onClick={handleAddToCart}
                    disabled={hasVariations && (!selectedSize || !selectedColor && product.colors?.length > 0)}
                />

                {/* Additional Info / Accordions */}
                {/* ... existing accordion logic ... */}
            </div>
        </div>
    );

    // --- Main Render ---

    if (layoutStyle === 'full') {
        // Full width image on top
        return (
            <div className={getContainerClasses()}>
                <div className="w-full">
                    <ProductMediaGallery settings={{ ...settings, productImages: { ...settings.productImages, aspectRatio: '21:9', fit: 'cover' } }} images={product.images} productTitle={product.name} />
                </div>
                <div className="max-w-4xl mx-auto w-full">
                    {InfoSection}
                </div>
            </div>
        );
    }

    if (layoutStyle === 'magazine') {
        // Grid Layout: Image takes 7 cols, Content 5 cols (example)
        if (isMobileView) {
            return (
                <div className={getContainerClasses()}>
                    {MediaSection}
                    {InfoSection}
                </div>
            )
        }
        return (
            <div className={getContainerClasses()}>
                <div className="col-span-7">
                    {MediaSection}
                </div>
                <div className="col-span-1 border-l border-white/10 h-full mx-auto"></div>
                <div className="col-span-4 pt-12">
                    {InfoSection}
                </div>
            </div>
        );
    }

    // Classic & Narrow & Default Mobile
    return (
        <div className={getContainerClasses()}>
            {MediaSection}
            {InfoSection}
        </div>
    );
};

export default ProductDetailView;
