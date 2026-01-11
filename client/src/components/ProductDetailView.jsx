import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { generateProductStyles } from '../utils/productStyles';
import { useCart } from '../context/CartContext';

const ProductDetailView = ({
    product,
    variations = [],
    relatedProducts = [],
    settingsOverride = null, // If provided, strictly use this (for preview)
    showNavigation = true,
    isPreview = false
}) => {
    const { settings: contextSettings, formatPrice } = useStoreSettings();
    const { addToCart } = useCart();
    // Merge context settings with override
    const settings = settingsOverride ? { ...contextSettings, productPageSettings: settingsOverride } : contextSettings;
    const { productPageSettings, brandSettings } = settings;
    const styles = generateProductStyles(productPageSettings);

    const [selectedVariation, setSelectedVariation] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState(null);
    const [activeImage, setActiveImage] = useState(null);

    // Initial Selection Logic matches ProductPage.jsx
    useEffect(() => {
        if (product) {
            if (activeImage === null && product.images && product.images.length > 0) {
                setActiveImage(product.images[0]);
            }

            if (variations.length > 0) {
                const firstVar = variations[0];
                setSelectedSize(firstVar.size);
                setSelectedColor(firstVar.color);
            } else {
                if (product.sizes && product.sizes.length > 0) {
                    setSelectedSize(product.sizes[0]);
                }
                if (product.colors && product.colors.length > 0) {
                    const firstColor = product.colors[0];
                    setSelectedColor(typeof firstColor === 'string' ? firstColor : (firstColor.name || firstColor.hex));
                }
            }
        }
    }, [product, variations]);

    useEffect(() => {
        if (variations.length > 0 && selectedSize && selectedColor) {
            const match = variations.find(v => {
                const sizeMatch = v.size === selectedSize;
                const colorObj = Array.isArray(product.colors) ? product.colors.find(c => c.name === selectedColor || c.hex === selectedColor) : null;
                const colorMatch = v.color === selectedColor || (colorObj && v.color === colorObj.name);
                return sizeMatch && colorMatch;
            });
            setSelectedVariation(match || null);
        } else {
            setSelectedVariation(null);
        }
    }, [selectedSize, selectedColor, variations, product]);

    const handleAddToCart = () => {
        if (!product) return;
        if (isPreview) {
            alert("Added to cart (Preview Mode)");
            return;
        }

        const itemToAddToCart = selectedVariation ? {
            ...product,
            price: selectedVariation.price || product.price,
            stock: selectedVariation.stock,
            sku: selectedVariation.sku || product.sku,
            variation_id: selectedVariation.id,
            variation_name: selectedVariation.name
        } : product;

        addToCart(itemToAddToCart, quantity, selectedSize, selectedColor);
        setQuantity(1);
    };

    if (!product) return null;

    const mainImage = product.images?.[0] || 'https://via.placeholder.com/600x800?text=No+Image';
    const sectionOrder = productPageSettings?.sections?.order || ['images', 'title', 'price', 'description', 'variants', 'quantity', 'addToCart', 'specs', 'reviews', 'shipping'];
    const visibility = productPageSettings?.sections?.visibility || {};

    const renderPrice = () => (
        <div className="flex items-center gap-3">
            {selectedVariation ? (
                <span style={styles.priceStyle}>{formatPrice(selectedVariation.price || product.price)}</span>
            ) : product.is_sale && product.sale_price ? (
                <>
                    <span style={styles.salePriceStyle}>{formatPrice(product.sale_price)}</span>
                    <span className="text-sm md:text-base font-bold text-white/30 line-through decoration-primary decoration-2">{formatPrice(product.price)}</span>
                </>
            ) : (
                <span style={styles.priceStyle}>{formatPrice(product.price)}</span>
            )}
        </div>
    );

    const renderImages = () => (
        <div className={`${styles.galleryClass} shrink-0 space-y-4`}>
            <div className="aspect-square rounded-[24px] md:rounded-[32px] overflow-hidden bg-[#1a1a1a] shadow-2xl relative group border border-white/5">
                <OptimizedImage
                    src={activeImage || mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    width={800}
                    priority={true}
                />
                {product.is_new && (
                    <div className="absolute top-6 left-6">
                        <span className="px-3 py-1 rounded-full bg-black text-[9px] font-black uppercase tracking-widest">New</span>
                    </div>
                )}
            </div>
            {product.images && product.images.length > 1 && (
                <div className={`flex gap-4 flex-wrap ${productPageSettings?.layout?.galleryType === 'carousel' ? 'overflow-x-auto pb-2' : ''}`}>
                    {product.images.map((img, idx) => (
                        <div
                            key={idx}
                            onClick={() => setActiveImage(img)}
                            className={`size-20 rounded-[16px] overflow-hidden bg-[#1a1a1a] cursor-pointer group border transition-all ${activeImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-white/5 hover:border-primary/50'}`}
                            style={{ borderColor: activeImage === img ? styles.primaryColor : undefined }}
                        >
                            <div className="w-full h-full relative">
                                <OptimizedImage
                                    src={img}
                                    alt={`View ${idx + 1}`}
                                    width={150}
                                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // Section Renderers
    const renderTitle = () => visibility.title && (
        <div className="flex flex-col gap-2 mb-2">
            {visibility.title && <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: styles.primaryColor }}>{product.category}</span>}
            <h1 style={styles.titleStyle}>{product.name}</h1>
        </div>
    );

    const renderPriceSection = () => visibility.price && renderPrice();

    const renderDescription = () => visibility.description && (
        <div className="my-4">
            {visibility.reviews && (
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex" style={{ color: styles.primaryColor }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className="material-symbols-outlined text-[14px] fill-current">star</span>
                        ))}
                    </div>
                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">128 Verified Reviews</span>
                </div>
            )}
            <p style={styles.descriptionStyle}>
                {product.description || "Unique African-inspired men's shirts that seamlessly blend heritage with modern design. Crafted for the modern man who values cultural identity and sophisticated silhouettes."}
            </p>
        </div>
    );

    const renderVariants = () => visibility.variants && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6">
            {product.colors && product.colors.length > 0 && (
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandSettings?.labelColor || 'rgba(255,255,255,0.3)' }}>
                        Select Color: <span className="text-white ml-2">
                            {typeof product.colors.find(c => (typeof c === 'string' ? c : c.hex) === selectedColor) === 'object'
                                ? product.colors.find(c => c.hex === selectedColor).name
                                : selectedColor}
                        </span>
                    </p>
                    <div className="flex gap-3">
                        {product.colors.map((color, idx) => {
                            const bg = typeof color === 'string' ? color : color.hex;
                            const isActive = selectedColor === bg;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedColor(typeof color === 'string' ? color : (color.name || color.hex))}
                                    className={`size-10 rounded-full border transition-all p-0.5 ${isActive ? 'ring-2 ring-primary/20 scale-110' : 'border-white/10 hover:border-white/40'}`}
                                    style={{ borderColor: isActive ? styles.primaryColor : undefined }}
                                >
                                    <div className="w-full h-full rounded-full" style={{ backgroundColor: bg }}></div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Sizes */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandSettings?.labelColor || 'rgba(255,255,255,0.3)' }}>Size: <span className="text-white ml-2">{selectedSize}</span></p>
                    <button className="text-[9px] font-black uppercase tracking-widest hover:underline" style={{ color: styles.primaryColor }}>Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {(product.sizes || ['S', 'M', 'L', 'XL']).map((size) => (
                        <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`size-10 rounded-xl text-[11px] font-black transition-all border ${selectedSize === size ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
                            style={selectedSize === size ? { borderRadius: styles.borderRadius, backgroundColor: '#ffffff', color: '#000000' } : { borderRadius: styles.borderRadius }}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderQuantity = () => visibility.quantity && !((selectedVariation ? selectedVariation.stock : product.stock) === 0) && (
        <div className="space-y-3 !mt-8">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandSettings?.labelColor || 'rgba(255,255,255,0.3)' }}>Quantity</p>
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-white/5 border border-white/5 p-1" style={{ borderRadius: styles.borderRadius }}>
                    <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="size-10 flex items-center justify-center hover:bg-white/5 transition-colors rounded-lg"
                    >
                        <span className="material-symbols-outlined text-[20px]">remove</span>
                    </button>
                    <div className="w-12 text-center font-black text-sm italic">
                        {quantity}
                    </div>
                    <button
                        onClick={() => {
                            const maxStock = selectedVariation ? selectedVariation.stock : product.stock;
                            setQuantity(Math.min(maxStock, quantity + 1));
                        }}
                        className="size-10 flex items-center justify-center hover:bg-white/5 transition-colors rounded-lg"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest italic" style={{ color: brandSettings?.secondaryTextColor || 'rgba(255,255,255,0.4)' }}>
                    Max available: {selectedVariation ? selectedVariation.stock : product.stock}
                </span>
            </div>
        </div>
    );

    const renderAddToCart = () => visibility.addToCart && (
        <div className={`space-y-4 pt-4 border-t border-white/5 p-1 ${productPageSettings?.layout?.stickyElements?.addToCart && !isPreview ? 'sticky bottom-0 bg-black/80 backdrop-blur-md pb-6 z-10' : ''}`}>
            <button
                onClick={handleAddToCart}
                disabled={(selectedVariation ? selectedVariation.stock : product.stock) === 0}
                className={styles.buttonClass}
                style={styles.buttonStyle}
            >
                {(selectedVariation ? selectedVariation.stock : product.stock) === 0 ? 'Out of Stock' : (
                    <>
                        Add to Bag
                        <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">east</span>
                    </>
                )}
            </button>
            {visibility.shipping && (
                <div className="flex items-center justify-between px-2 md:px-0 text-[8px] md:text-[9px] font-black uppercase tracking-widest gap-2" style={{ color: brandSettings?.secondaryTextColor || 'rgba(255,255,255,0.2)' }}>
                    <span className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                        <span className="material-symbols-outlined text-[12px] md:text-[14px]">local_shipping</span>
                        {contextSettings?.shippingMethods?.some(m => m.enabled && m.cost === 0) ? 'Free Shipping' : 'Standard Shipping'}
                    </span>
                    <span className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"><span className="material-symbols-outlined text-[12px] md:text-[14px]">history</span> 30-Day Returns</span>
                    <span className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"><span className="material-symbols-outlined text-[12px] md:text-[14px]">policy</span> 2Yr Warranty</span>
                </div>
            )}
        </div>
    );

    const renderSpecs = () => visibility.specs && (
        <div className="space-y-2 !mt-8">
            {[
                { title: 'Heritage', content: 'Premium African fabrics with tailored heritage cuts.' },
                { title: 'Care', content: 'Dry clean recommended for best maintenance of fabric integrity.' }
            ].map((item, idx) => (
                <details key={idx} className="group border-b border-white/5 pb-2">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                        <span className="text-[10px] font-black uppercase tracking-widest transition-colors group-hover:text-white" style={{ color: brandSettings?.labelColor || 'rgba(255,255,255,0.4)' }}>{item.title}</span>
                        <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-180">expand_more</span>
                    </summary>
                    <p className="pt-2 text-[11px] font-medium leading-relaxed italic" style={{ color: brandSettings?.secondaryTextColor || 'rgba(255,255,255,0.4)' }}>{item.content}</p>
                </details>
            ))}
        </div>
    );

    const sectionRenderers = {
        title: renderTitle,
        price: renderPriceSection,
        description: renderDescription,
        variants: renderVariants,
        quantity: renderQuantity,
        addToCart: renderAddToCart,
        specs: renderSpecs,
        // Images handled separately/layout dependent
    };

    return (
        <div className={`text-white overflow-x-hidden ${isPreview ? '' : 'pt-20 md:pt-24 pb-12'}`} style={{ backgroundColor: productPageSettings?.visual?.backgroundColor || '#000000' }}>
            {/* Ambient Lighting only if not preview or if preview wants it */}
            {!isPreview && (
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]" style={{ backgroundColor: `${styles.primaryColor}20` }}></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary-dark/10 rounded-full blur-[80px]"></div>
                </div>
            )}

            <div className={isPreview ? '' : 'layout-container'}>
                {showNavigation && (
                    <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-6">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-white/60">{product.name}</span>
                    </nav>
                )}

                <div className={styles.containerClass}>
                    {renderImages()}

                    {/* Product Details Panel */}
                    <div className={`${styles.detailsClass} ${styles.sectionSpacing} pr-0 lg:pr-2 custom-scrollbar lg:max-h-[800px] lg:overflow-y-auto`}>
                        {sectionOrder.map(key => {
                            const Renderer = sectionRenderers[key];
                            // Exclude images/reviews if handled elsewhere or not implemented in loop
                            if (key === 'images' || key === 'shipping' || key === 'reviews') return null; // Shipping inside AddToCart, Reviews inside Description for now
                            return Renderer ? <React.Fragment key={key}>{Renderer()}</React.Fragment> : null;
                        })}
                    </div>
                </div>

                {productPageSettings?.advanced?.relatedProducts?.style !== 'hidden' && relatedProducts.length > 0 && (
                    <div className="mt-20 pt-16 border-t border-white/5">
                        <div className="flex justify-between items-end mb-10">
                            <h2 className="text-2xl md:text-4xl font-black italic tracking-tight uppercase">Complete <br /> The Look</h2>
                            {!isPreview && (
                                <Link to="/shop" className="text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2 pb-1" style={{ color: styles.primaryColor }}>
                                    Explore Collection <span className="material-symbols-outlined text-[16px]">east</span>
                                </Link>
                            )}
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.slice(0, productPageSettings?.advanced?.relatedProducts?.count || 4).map((p) => (
                                <Link to={isPreview ? '#' : `/product/${p.slug}`} key={p.id} className="group cursor-pointer">
                                    <div className="relative aspect-square rounded-[24px] overflow-hidden mb-4 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-1">
                                        <OptimizedImage
                                            src={p.images?.[0] || 'https://via.placeholder.com/300?text=Product'}
                                            alt={p.name}
                                            width={400}
                                            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 px-1">
                                        <h3 className="font-bold text-xs group-hover:text-primary transition-colors uppercase tracking-tight" style={{ '--hover-color': styles.primaryColor }}>{p.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-xs italic text-white">{formatPrice(p.price)}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailView;
