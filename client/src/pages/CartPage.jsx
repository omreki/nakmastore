import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { useStoreSettings } from '../context/StoreSettingsContext';

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
    const { formatPrice, calculateTax, settings, getTaxName, shouldShowTax } = useStoreSettings();
    const [suggestedProducts, setSuggestedProducts] = useState([]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .limit(3);
                if (error) throw error;
                setSuggestedProducts(data || []);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        };
        fetchSuggestions();
    }, []);

    const activeMethods = settings?.shippingMethods?.filter(m => m.enabled) || [];
    const subtotal = getCartTotal();
    // Use the cheapest enabled shipping method for estimation
    const estimatedShipping = activeMethods.length > 0 ? Math.min(...activeMethods.map(m => m.cost)) : 0;
    const tax = calculateTax(subtotal);
    const total = subtotal + estimatedShipping + tax;

    if (cart.length === 0) {
        return (
            <div className="bg-[#30136a] min-h-screen text-white font-['Manrope'] pt-24 md:pt-32 pb-20">
                <span className="material-symbols-outlined text-6xl md:text-8xl text-white/10 mb-8">shopping_bag</span>
                <h1 className="text-3xl md:text-6xl font-bold mb-6 italic px-4">Your Collection is Empty</h1>
                <p className="text-white/40 text-base md:text-lg mb-10 max-w-sm md:max-w-md px-6">Embrace your cultural expression with our unique collection. Explore the store to find your perfect fit.</p>
                <Link to="/shop" className="px-12 py-5 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:bg-[#30136a] hover:text-white transition-all shadow-2xl">Start Exploring</Link>
            </div>
        );
    }

    return (
        <div className="bg-[#30136a] min-h-screen text-white font-['Manrope'] pt-24 md:pt-32 pb-20">
            {/* Ambient Lighting */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#30136a]/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#1e0c42]/10 rounded-full blur-[100px]"></div>
            </div>

            <main className="max-w-[1440px] mx-auto px-6 md:px-10">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
                    {/* Cart Items */}
                    <div className="flex-grow lg:w-2/3 space-y-12">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-6 md:pb-10 gap-4">
                            <h1 className="text-4xl md:text-7xl font-bold tracking-tight">Your <br className="hidden md:block" /> Collection</h1>
                            <span className="text-white/40 font-bold uppercase tracking-widest text-xs md:text-sm mb-2">{cart.length} Items</span>
                        </div>

                        <div className="space-y-8">
                            {cart.map((item) => (
                                <div key={`${item.id}-${item.variation_id || 'base'}-${item.selectedSize}-${item.selectedColor}`} className="flex flex-col md:flex-row gap-6 md:gap-8 py-6 md:py-8 border-b border-white/5 group">
                                    <div className="w-full md:w-48 aspect-video md:aspect-[4/5] rounded-[24px] overflow-hidden bg-[#f5f5f5] p-4 md:p-6 relative flex-shrink-0">
                                        <img
                                            src={item.images?.[0] || 'https://via.placeholder.com/200x250'}
                                            alt={item.name}
                                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="flex-grow flex flex-col justify-between py-2">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <Link to={`/product/${item.slug}`}>
                                                    <h3 className="text-2xl font-bold group-hover:text-[#30136a] transition-colors cursor-pointer">{item.name}</h3>
                                                </Link>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-white/40">
                                                        <span>Size: <span className="text-white">{item.selectedSize || 'M'}</span></span>
                                                        <span>Color: <span className="text-white">{item.selectedColor || 'Black'}</span></span>
                                                    </div>
                                                    {item.variation_name && (
                                                        <span className="text-[10px] font-medium text-white/20 uppercase tracking-[0.1em]">
                                                            {item.variation_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-2xl font-black">{formatPrice(item.price * item.quantity)}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-8">
                                            <div className="flex items-center border border-white/10 rounded-full p-1 bg-white/[0.03]">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.variation_id, Math.max(1, item.quantity - 1))}
                                                    className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">remove</span>
                                                </button>
                                                <span className="w-12 text-center font-bold">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.variation_id, item.quantity + 1)}
                                                    className="size-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor, item.variation_id)}
                                                className="text-white/20 hover:text-[#30136a] transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-1/3">
                        <div className="sticky top-32 space-y-8">
                            <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-10 space-y-10 shadow-2xl backdrop-blur-xl">
                                <h2 className="text-3xl font-bold italic tracking-tight">Order Summary</h2>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center text-white/60 font-medium">
                                        <span>Subtotal</span>
                                        <span className="text-white font-bold">{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-white/60 font-medium">
                                        <span>Delivery</span>
                                        <span className="text-white font-bold">{estimatedShipping === 0 ? 'FREE' : formatPrice(estimatedShipping)}</span>
                                    </div>
                                    {shouldShowTax() && (
                                        <div className="flex justify-between items-center text-white/60 font-medium">
                                            <span>{getTaxName()}</span>
                                            <span className="text-white font-bold">{formatPrice(tax)}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/10 pt-4"></div>
                                    <div className="flex justify-between items-center text-2xl font-black italic">
                                        <span>Total</span>
                                        <span className="text-[#30136a]">{formatPrice(total)}</span>
                                    </div>
                                </div>

                                <Link
                                    to="/checkout"
                                    className="w-full h-20 bg-[#1e0c42] text-white rounded-full flex items-center justify-center gap-4 font-black uppercase tracking-[0.2em] hover:bg-[#30136a] transition-all transform active:scale-[0.98] shadow-2xl"
                                >
                                    Proceed to Checkout
                                    <span className="material-symbols-outlined">east</span>
                                </Link>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-4 text-xs font-bold text-white/40 uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-primary-light">verified</span>
                                        Secure Checkout Guaranteed
                                    </div>
                                    <div className="flex gap-4 opacity-30 grayscale">
                                        {['visa', 'mastercard', 'apple_pay', 'google_pay'].map((card) => (
                                            <span key={card} className="material-symbols-outlined text-3xl">payments</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Suggestions */}
                            {suggestedProducts.length > 0 && (
                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40 px-4">You might also like</h4>
                                    <div className="space-y-4">
                                        {suggestedProducts.map((p) => (
                                            <Link to={`/product/${p.slug}`} key={p.id} className="flex gap-6 p-4 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
                                                <div className="size-20 rounded-[16px] overflow-hidden bg-[#f5f5f5] p-2 flex-shrink-0">
                                                    <img src={p.images?.[0] || 'https://via.placeholder.com/80'} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="font-bold text-sm group-hover:text-[#30136a] transition-colors">{p.name}</span>
                                                    <span className="text-white/40 text-xs font-bold">{formatPrice(p.price)}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CartPage;
