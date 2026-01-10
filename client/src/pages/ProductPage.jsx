import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import SEO from '../components/SEO';
import { analyticsService } from '../services/analyticsService';

const ProductPage = () => {
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

    const { id } = useParams();

    const { formatPrice, settings } = useStoreSettings();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [variations, setVariations] = useState([]);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [activeImage, setActiveImage] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                let query = supabase.from('products').select('*');

                // Check if param is UUID or Numeric ID
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                const isNumeric = /^\d+$/.test(id);

                if (isUuid || isNumeric) {
                    query = query.eq('id', id);
                } else {
                    query = query.eq('slug', id);
                }

                const { data, error } = await query.single();

                if (error) throw error;
                setProduct(data);

                if (data.images && data.images.length > 0) {
                    setActiveImage(data.images[0]);
                }

                // Fetch Variations
                const { data: varData } = await supabase
                    .from('product_variations')
                    .select('*')
                    .eq('product_id', data.id);

                setVariations(varData || []);
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            if (!product) return;
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .neq('id', product.id)
                    .eq('category', product.category)
                    .limit(4);
                if (error) throw error;
                setRelatedProducts(data || []);
            } catch (error) {
                console.error('Error fetching related products:', error);
            }
        };
        fetchRelatedProducts();
    }, [product, id]);

    useEffect(() => {
        if (product) {
            analyticsService.trackProductView(product);
        }
    }, [product]);

    useEffect(() => {
        if (product) {
            // Priority 1: Use first variation's size/color if available
            // Priority 2: Use product's default sizes/colors
            if (variations.length > 0) {
                const firstVar = variations[0];
                setSelectedSize(firstVar.size);
                setSelectedColor(firstVar.color); // Color name OR hex
            } else {
                if (product.sizes && product.sizes.length > 0) {
                    setSelectedSize(product.sizes[0]);
                }
                if (product.colors && product.colors.length > 0) {
                    const firstColor = product.colors[0];
                    // Prefer name for variation matching if available
                    setSelectedColor(typeof firstColor === 'string' ? firstColor : (firstColor.name || firstColor.hex));
                }
            }
        }
    }, [product, variations]);

    useEffect(() => {
        // Find matching variation
        if (variations.length > 0 && selectedSize && selectedColor) {
            const match = variations.find(v => {
                const sizeMatch = v.size === selectedSize;
                // Try matching by color name or color hex if we can find it in product.colors
                const colorObj = Array.isArray(product.colors) ? product.colors.find(c => c.name === selectedColor || c.hex === selectedColor) : null;
                const colorMatch = v.color === selectedColor || (colorObj && v.color === colorObj.name);
                return sizeMatch && colorMatch;
            });
            setSelectedVariation(match || null);
        } else {
            setSelectedVariation(null);
        }
    }, [selectedSize, selectedColor, variations]);

    const handleAddToCart = () => {
        if (!product) return;

        // Pass variation details if found
        const itemToAddToCart = selectedVariation ? {
            ...product,
            price: selectedVariation.price || product.price,
            stock: selectedVariation.stock,
            sku: selectedVariation.sku || product.sku,
            variation_id: selectedVariation.id,
            variation_name: selectedVariation.name
        } : product;

        addToCart(itemToAddToCart, quantity, selectedSize, selectedColor);
        // Reset quantity after adding to cart
        setQuantity(1);
    };

    if (loading) {
        return (
            <div className="bg-black min-h-screen text-white font-['Manrope'] pt-20 md:pt-24 pb-12 overflow-x-hidden">
                <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-white/40 font-bold tracking-[0.3em] uppercase text-xs">Crafting Heritage...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-10 text-center">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">Product Not Found</h1>
                <Link to="/shop" className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-primary hover:text-white transition-all">Back to Collection</Link>
            </div>
        );
    }

    const mainImage = product.images?.[0] || 'https://via.placeholder.com/600x800?text=No+Image';

    return (
        <div className="bg-black min-h-screen text-white font-['Manrope'] pt-20 md:pt-24 pb-12 overflow-x-hidden">
            <SEO
                title={product.name}
                description={product.description}
                image={mainImage}
                type="product"
                productData={{
                    name: product.name,
                    image: mainImage,
                    description: product.description,
                    price: product.is_sale ? product.sale_price : product.price,
                    currency: settings?.general?.currency || 'USD',
                    inStock: product.stock > 0
                }}
            />
            {/* Ambient Lighting */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary-dark/10 rounded-full blur-[80px]"></div>
            </div>

            <main className="layout-container">
                {/* Breadcrumbs - Compact */}
                <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-6">
                    <Link to="/" className="hover:text-white transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                    <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
                    <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                    <span className="text-white/60">{product.name}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                    {/* Image Showcase - Compact */}
                    <div className="w-full lg:w-[45%] shrink-0 space-y-4">
                        <div className="aspect-square rounded-[24px] md:rounded-[32px] overflow-hidden bg-[#1a1a1a] shadow-2xl relative group border border-white/5">
                            <img
                                src={activeImage || mainImage}
                                alt={product.name}
                                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                            />
                            {product.is_new && (
                                <div className="absolute top-6 left-6">
                                    <span className="px-3 py-1 rounded-full bg-black text-[9px] font-black uppercase tracking-widest">New</span>
                                </div>
                            )}
                        </div>
                        {/* More images - Smaller thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-4 flex-wrap">
                                {product.images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`size-20 rounded-[16px] overflow-hidden bg-[#1a1a1a] cursor-pointer group border transition-all ${activeImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-white/5 hover:border-primary/50'}`}
                                    >
                                        <div
                                            className="w-full h-full bg-cover bg-no-repeat bg-center transition-transform duration-500 group-hover:scale-110"
                                            style={{ backgroundImage: `url('${img}')` }}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details Panel - Optimized for Height */}
                    <div className="flex-grow space-y-6 lg:max-h-[800px] lg:overflow-y-auto pr-0 lg:pr-2 custom-scrollbar">
                        <div className="space-y-3">
                            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">{product.category}</span>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none uppercase">{product.name}</h1>
                                <div className="flex items-center gap-3">
                                    {selectedVariation ? (
                                        <span className="text-xl md:text-2xl font-black italic text-primary">{formatPrice(selectedVariation.price || product.price)}</span>
                                    ) : product.is_sale && product.sale_price ? (
                                        <>
                                            <span className="text-xl md:text-2xl font-black italic text-primary">{formatPrice(product.sale_price)}</span>
                                            <span className="text-sm md:text-base font-bold text-white/30 line-through decoration-primary decoration-2">{formatPrice(product.price)}</span>
                                        </>
                                    ) : (
                                        <span className="text-xl md:text-2xl font-black italic text-white">{formatPrice(product.price)}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex text-primary">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <span key={s} className="material-symbols-outlined text-[14px] fill-current">star</span>
                                        ))}
                                    </div>
                                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">128 Verified Reviews</span>
                                </div>
                                <div className="pt-2">
                                    {(selectedVariation ? selectedVariation.stock : product.stock) > 5 ? (
                                        <div className="flex items-center gap-2">
                                            <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                            <p className="text-green-500/80 text-[10px] font-black uppercase tracking-widest">
                                                In Stock ({(selectedVariation ? selectedVariation.stock : product.stock)} available)
                                            </p>
                                        </div>
                                    ) : (selectedVariation ? selectedVariation.stock : product.stock) <= 5 && (selectedVariation ? selectedVariation.stock : product.stock) > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <div className="size-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(5,150,105,0.6)]"></div>
                                            <p className="text-primary text-[10px] font-black uppercase tracking-widest">
                                                Low Stock: Only {(selectedVariation ? selectedVariation.stock : product.stock)} units left!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="size-1.5 rounded-full bg-gray-600"></div>
                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                                Sold Out
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-white/50 text-sm leading-relaxed font-medium max-w-xl line-clamp-3">
                                {product.description || "Unique African-inspired men's shirts that seamlessly blend heritage with modern design. Crafted for the modern man who values cultural identity and sophisticated silhouettes."}
                            </p>

                            {/* Options - Tighter Spacing */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Colors */}
                                {product.colors && product.colors.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">
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
                                                        className={`size-10 rounded-full border transition-all p-0.5 ${isActive ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-white/10 hover:border-white/40'}`}
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
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Size: <span className="text-white ml-2">{selectedSize}</span></p>
                                        <button className="text-primary text-[9px] font-black uppercase tracking-widest hover:underline">Size Guide</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(product.sizes || ['S', 'M', 'L', 'XL']).map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`size-10 rounded-xl text-[11px] font-black transition-all border ${selectedSize === size ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Quantity Selector */}
                            {!((selectedVariation ? selectedVariation.stock : product.stock) === 0) && (
                                <div className="space-y-3 !mt-8">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Quantity</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-white/5 rounded-2xl border border-white/5 p-1">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="size-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
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
                                                className="size-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">add</span>
                                            </button>
                                        </div>
                                        <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest italic">
                                            Max available: {selectedVariation ? selectedVariation.stock : product.stock}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Add to Cart - More Compact */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={(selectedVariation ? selectedVariation.stock : product.stock) === 0}
                                    className="w-full h-14 rounded-full bg-primary text-white font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-hover transition-all transform active:scale-[0.98] shadow-xl flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                                >
                                    {(selectedVariation ? selectedVariation.stock : product.stock) === 0 ? 'Out of Stock' : (
                                        <>
                                            Add to Bag
                                            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">east</span>
                                        </>
                                    )}
                                </button>
                                <div className="flex items-center justify-between px-2 md:px-4 text-white/20 text-[8px] md:text-[9px] font-black uppercase tracking-widest gap-2">
                                    <span className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                                        <span className="material-symbols-outlined text-[12px] md:text-[14px]">local_shipping</span>
                                        {settings?.shippingMethods?.some(m => m.enabled && m.cost === 0) ? 'Free Shipping' : 'Standard Shipping'}
                                    </span>
                                    <span className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"><span className="material-symbols-outlined text-[12px] md:text-[14px]">history</span> 30-Day Returns</span>
                                    <span className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"><span className="material-symbols-outlined text-[12px] md:text-[14px]">policy</span> 2Yr Warranty</span>
                                </div>
                            </div>

                            {/* Specifications - Tighter Accordions */}
                            <div className="space-y-2 !mt-8">
                                {[
                                    { title: 'Heritage', content: 'Premium African fabrics with tailored heritage cuts.' },
                                    { title: 'Care', content: 'Dry clean recommended for best maintenance of fabric integrity.' }
                                ].map((item, idx) => (
                                    <details key={idx} className="group border-b border-white/5 pb-2">
                                        <summary className="flex items-center justify-between cursor-pointer list-none">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{item.title}</span>
                                            <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-180">expand_more</span>
                                        </summary>
                                        <p className="pt-2 text-[11px] font-medium text-white/40 leading-relaxed italic">{item.content}</p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Related Products - Keeps as is but moved lower */}
                </div>

                {
                    relatedProducts.length > 0 && (
                        <div className="mt-20 pt-16 border-t border-white/5">
                            <div className="flex justify-between items-end mb-10">
                                <h2 className="text-2xl md:text-4xl font-black italic tracking-tight uppercase">Complete <br /> The Look</h2>
                                <Link to="/shop" className="text-primary text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2 pb-1">
                                    Explore Collection <span className="material-symbols-outlined text-[16px]">east</span>
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {relatedProducts.map((p) => (
                                    <Link to={`/product/${p.slug}`} key={p.id} className="group cursor-pointer">
                                        <div className="relative aspect-square rounded-[24px] overflow-hidden mb-4 bg-[#1a1a1a] transition-transform duration-500 group-hover:-translate-y-1">
                                            <img
                                                src={p.images?.[0] || 'https://via.placeholder.com/300?text=Product'}
                                                alt={p.name}
                                                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1 px-1">
                                            <h3 className="font-bold text-xs group-hover:text-[#b82063] transition-colors uppercase tracking-tight">{p.name}</h3>
                                            <div className="flex items-center gap-2">
                                                {p.is_sale && p.sale_price ? (
                                                    <>
                                                        <span className="font-black text-xs italic text-[#b82063]">{formatPrice(p.sale_price)}</span>
                                                        <span className="font-bold text-[10px] text-white/30 line-through decoration-1">{formatPrice(p.price)}</span>
                                                    </>
                                                ) : (
                                                    <span className="font-black text-xs italic text-white">{formatPrice(p.price)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default ProductPage;
