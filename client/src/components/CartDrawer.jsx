import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';

const CartDrawer = () => {
    const {
        cart,
        isCartOpen,
        setIsCartOpen,
        removeFromCart,
        updateQuantity,
        getCartTotal
    } = useCart();
    const { formatPrice } = useStoreSettings();

    const subtotal = getCartTotal();

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsCartOpen(false)}
            ></div>

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-[450px] bg-black z-[101] shadow-2xl transition-transform duration-500 ease-out border-l border-white/5 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Your Bag</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">{cart.length} Items</p>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="size-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors group"
                    >
                        <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-90">close</span>
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-grow overflow-y-auto p-8 space-y-8 scrollbar-hide">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                            <span className="material-symbols-outlined text-6xl text-white/5">shopping_bag</span>
                            <p className="text-white/40 font-medium uppercase tracking-widest text-xs">Your bag is empty</p>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="text-[#30136a] text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={`${item.id}-${item.variation_id || 'base'}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-6 group">
                                <div className="size-24 rounded-2xl overflow-hidden bg-[#f5f5f5] p-3 flex-shrink-0 relative border border-white/5">
                                    <img
                                        src={item.images?.[0] || 'https://via.placeholder.com/100'}
                                        className="w-full h-full object-contain mix-blend-multiply"
                                        alt={item.name}
                                    />
                                </div>
                                <div className="flex-grow flex flex-col justify-between py-1">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-[#30136a] transition-colors line-clamp-1">{item.name}</h4>
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black italic">
                                                    {formatPrice((item.is_sale && item.sale_price ? item.sale_price : item.price) * item.quantity)}
                                                </span>
                                                {item.is_sale && item.sale_price && (
                                                    <span className="text-[9px] text-white/30 line-through decoration-1">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                            Size: {item.selectedSize} / {item.selectedColor}
                                        </p>
                                        {item.variation_name && (
                                            <p className="text-[8px] font-medium text-white/20 uppercase tracking-[0.1em]">
                                                {item.variation_name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center border border-white/10 rounded-lg p-0.5 bg-white/[0.03]">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.variation_id, Math.max(1, item.quantity - 1))}
                                                className="size-7 flex items-center justify-center hover:bg-white/5 rounded-md transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">remove</span>
                                            </button>
                                            <span className="w-8 text-center text-[11px] font-black">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, item.variation_id, item.quantity + 1)}
                                                className="size-7 flex items-center justify-center hover:bg-white/5 rounded-md transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">add</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor, item.variation_id)}
                                            className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 space-y-6 border-t border-white/5 bg-white/[0.01]">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Subtotal</span>
                        <span className="text-2xl font-black italic text-[#30136a]">{formatPrice(subtotal)}</span>
                    </div>

                    <div className="space-y-3">
                        <Link
                            to="/checkout"
                            onClick={() => setIsCartOpen(false)}
                            className="w-full h-14 bg-white text-black rounded-full flex items-center justify-center font-black text-xs uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all transform active:scale-[0.98] shadow-xl"
                        >
                            Checkout
                            <span className="material-symbols-outlined ml-3 text-lg">east</span>
                        </Link>
                        <button
                            onClick={() => setIsCartOpen(false)}
                            className="w-full h-14 bg-white/[0.03] border border-white/10 text-white rounded-full flex items-center justify-center font-black text-xs uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                        >
                            Continue Shopping
                        </button>
                    </div>

                    <p className="text-center text-[9px] font-medium text-white/20 uppercase tracking-widest">
                        Shipping & taxes calculated at checkout
                    </p>
                </div>
            </div>
        </>
    );
};

export default CartDrawer;
