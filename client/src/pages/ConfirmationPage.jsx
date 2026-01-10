import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { emailService } from '../services/emailService';

const ConfirmationPage = () => {
    const { formatPrice, currencySymbol, settings, getTaxName, shouldShowTax } = useStoreSettings();
    const { clearCart } = useCart();
    const location = useLocation();
    const navigate = useNavigate();
    const [order, setOrder] = React.useState(location.state?.order);
    const [loading, setLoading] = React.useState(!location.state?.order);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const reference = searchParams.get('reference') || searchParams.get('trxref');

        const fetchOrderByReference = async (ref) => {
            try {
                console.log('Recovery: Fetching order by reference:', ref);
                // 1. Fetch order
                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('payment_reference', ref)
                    .single();

                if (orderError) throw orderError;

                // 2. Fetch items
                const { data: itemsData, error: itemsError } = await supabase
                    .from('order_items')
                    .select('*')
                    .eq('order_id', orderData.id);

                if (itemsError) throw itemsError;

                // 3. Format for display (match what CheckoutPage sends)
                const formattedOrder = {
                    ...orderData,
                    shippingDetails: orderData.shipping_address,
                    items: itemsData.map(item => ({
                        name: item.product_name || 'Product',
                        price: item.price,
                        quantity: item.quantity,
                        images: []
                    })),
                    totals: {
                        subtotal: orderData.total_amount - (orderData.shipping_cost || 0) - (orderData.tax_amount || 0),
                        shipping: orderData.shipping_cost || 0,
                        tax: orderData.tax_amount || 0,
                        total: orderData.total_amount
                    }
                };

                setOrder(formattedOrder);
                clearCart();

                // 4. Send Notifications (since direct redirect might have missed them)
                try {
                    const customerData = {
                        email: formattedOrder.shippingDetails?.email,
                        full_name: `${formattedOrder.shippingDetails?.firstName} ${formattedOrder.shippingDetails?.lastName}`
                    };
                    const emailItems = formattedOrder.items.map(item => ({
                        product_name: item.name,
                        quantity: item.quantity,
                        price: item.price
                    }));

                    emailService.sendOrderConfirmation(formattedOrder, customerData, emailItems).catch(console.error);

                    const { data: teamMembers } = await supabase.from('team_members').select('email').in('role', ['admin', 'editor', 'shop_manager']);
                    const allRecipients = [...new Set([(teamMembers || []).map(m => m.email), settings?.alertEmails || []].flat())].filter(Boolean);
                    if (allRecipients.length > 0) {
                        emailService.sendAdminOrderNotification(formattedOrder, allRecipients, customerData, emailItems).catch(console.error);
                    }
                } catch (e) { console.error('Recovery notification fail:', e); }

            } catch (err) {
                console.error('Error fetching order by reference:', err);
                // Wait 2 seconds before giving up, maybe webhook hasn't finished?
                setTimeout(() => {
                    if (!order) navigate('/');
                }, 3000);
            } finally {
                setLoading(false);
            }
        };

        if (!order && reference) {
            fetchOrderByReference(reference);
        } else if (!order && !reference) {
            const timeout = setTimeout(() => {
                if (!order) navigate('/');
            }, 1000);
            return () => clearTimeout(timeout);
        } else {
            // Already have order from state
            clearCart();
            setLoading(false);
        }
    }, [order, location.search, navigate, clearCart, settings?.alertEmails]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#30136a] flex flex-col items-center justify-center text-white">
                <div className="size-12 border-4 border-[#30136a]/20 border-t-[#30136a] rounded-full animate-spin mb-4"></div>
                <p className="font-bold uppercase tracking-widest text-xs opacity-50">Verifying Payment...</p>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="relative flex min-h-screen w-full flex-col font-display overflow-x-hidden selection:bg-primary selection:text-white confirmation-page-bg">
            {/* Ambient Background */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/30 blur-[120px] opacity-60"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px] opacity-50"></div>
                <div className="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-primary-light/10 blur-[100px] opacity-40"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <Link to="/" className="flex items-center gap-3 group">
                        {settings.logoUrl ? (
                            <div className="h-8 flex items-center">
                                <img src={settings.logoUrl} alt={settings.storeName} className="h-full w-auto object-contain" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-center size-8 rounded-full bg-white/10 text-white shadow-glow group-hover:bg-primary transition-colors">
                                    <span className="material-symbols-outlined text-xl">stylus_note</span>
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-white">{settings.storeName}</h1>
                            </>
                        )}
                    </Link>
                    <div className="flex items-center gap-4">
                        <nav className="hidden md:flex gap-6 text-sm font-medium text-white/70 mr-4">
                            <Link to="/category/vibrant-prints" className="hover:text-primary transition-colors">Vibrant Prints</Link>
                            <Link to="/category/classic-plains" className="hover:text-primary transition-colors">Classic Plains</Link>
                        </nav>
                        <Link to="/" className="flex items-center justify-center rounded-full size-8 bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all">
                            <span className="material-symbols-outlined text-xl">close</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-6 md:py-12">
                {/* Success Message */}
                <div className="flex flex-col items-center justify-center text-center mb-10 md:mb-14 space-y-4 animate-fade-in-up">
                    <div className="flex items-center justify-center size-20 rounded-full bg-gradient-to-br from-green-500 to-[#003305] text-white shadow-2xl shadow-green-500/40 mb-2 border border-white/10 ring-1 ring-white/20">
                        <span className="material-symbols-outlined text-4xl font-bold">check</span>
                    </div>
                    <h2 className="text-2xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">Order Confirmed</h2>
                    <div className="flex flex-col gap-1 text-zinc-300">
                        <p className="text-base md:text-lg font-medium px-4">Thank you{order.shippingDetails?.firstName ? `, ${order.shippingDetails.firstName}` : ''}! Your order is confirmed.</p>
                        <p className="text-xs md:text-sm opacity-60 font-body px-6">Order #{order.id} {order.shippingDetails?.email ? `• We sent a confirmation email to ${order.shippingDetails.email}` : ''}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {/* Left Column: Details */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Items */}
                        <div className="glass-panel rounded-2xl p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">Your Items</h3>
                                <span className="text-sm font-bold text-white/90 bg-white/10 border border-white/10 px-3 py-1 rounded-full">{order.items.length} Items</span>
                            </div>
                            <div className="flex flex-col gap-6">
                                {order.items.map((item, index) => (
                                    <React.Fragment key={index}>
                                        <div className="flex gap-4 md:gap-6 items-start group">
                                            <div className="shrink-0 relative overflow-hidden rounded-xl bg-zinc-800 border border-white/10 size-24 md:size-28 shadow-lg">
                                                <div className="bg-center bg-no-repeat w-full h-full bg-cover transition-transform duration-500 group-hover:scale-110 opacity-90" style={{ backgroundImage: `url('${item.images?.[0] || 'https://via.placeholder.com/200'}')` }}></div>
                                            </div>
                                            <div className="flex flex-1 flex-col h-full justify-between py-1">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-white text-lg font-bold leading-tight">{item.name}</p>
                                                        <p className="text-white text-lg font-bold">{formatPrice(item.price)}</p>
                                                    </div>
                                                    <p className="text-white/50 text-sm font-medium mt-1">
                                                        {item.selectedColor || ''} {item.selectedColor && item.selectedSize ? '•' : ''} {item.selectedSize || ''}
                                                    </p>
                                                </div>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-semibold text-white/80 shadow-sm">Qty: {item.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {index < order.items.length - 1 && (
                                            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Delivery Details */}
                            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 hover:shadow-glossy transition-shadow duration-300 group">
                                <div className="flex items-center gap-2 text-white/90">
                                    <span className="material-symbols-outlined text-accent group-hover:text-white transition-colors">local_shipping</span>
                                    <h4 className="font-bold text-white">Delivery Details</h4>
                                </div>
                                <div className="text-sm text-zinc-400 leading-relaxed">
                                    <p className="font-semibold text-white mb-1">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</p>
                                    <p>{order.shippingDetails.line1}</p>
                                    <p>{order.shippingDetails.country}</p>
                                    <p>{order.shippingDetails.phone}</p>
                                    <p className="mt-2 text-accent font-medium">{order.shippingDetails.method}</p>
                                </div>
                            </div>
                            {/* Payment Method */}
                            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 hover:shadow-glossy transition-shadow duration-300 group">
                                <div className="flex items-center gap-2 text-white/90">
                                    <span className="material-symbols-outlined text-accent group-hover:text-white transition-colors">credit_card</span>
                                    <h4 className="font-bold text-white">Payment Method</h4>
                                </div>
                                <div className="text-sm text-zinc-400 leading-relaxed">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-white/80">
                                            {order.paymentMethod === 'cod' ? 'payments' : 'credit_card'}
                                        </span>
                                        <span className="font-medium text-white/90">
                                            {order.paymentMethod === 'cod'
                                                ? 'Cash on Delivery'
                                                : order.paymentMethod === 'stripe'
                                                    ? 'Credit Card (Stripe)'
                                                    : order.paymentMethod === 'paypal'
                                                        ? 'PayPal'
                                                        : order.paymentMethod === 'paystack'
                                                            ? 'Mpesa/Cards'
                                                            : order.paymentMethod}
                                        </span>
                                    </div>
                                    <p>Billing address same as delivery</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Calculations */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-panel rounded-2xl p-6 md:p-8 sticky top-24">
                            <h3 className="text-lg font-bold text-white mb-6">Order Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Subtotal</span>
                                    <span className="font-medium text-white">{formatPrice(order.totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Delivery</span>
                                    <span className="font-medium text-emerald-400">
                                        {order.totals.shipping === 0 ? 'Free' : formatPrice(order.totals.shipping)}
                                    </span>
                                </div>
                                {shouldShowTax() && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">{getTaxName()}</span>
                                        <span className="font-medium text-white">{formatPrice(order.totals.tax)}</span>
                                    </div>
                                )}
                                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-base font-bold text-white">Total</span>
                                    <div className="text-right">
                                        <span className="text-xs text-white/40 block mb-0.5">{currencySymbol}</span>
                                        <span className="text-2xl font-black text-white drop-shadow-sm">{formatPrice(order.totals.total)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 flex flex-col gap-3">
                                <Link to="/account" className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#1e0c42] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/40 border border-white/10 transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                    <span>Track Order</span>
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </Link>
                                <Link to="/shop" className="flex w-full items-center justify-center gap-2 rounded-full bg-white/5 border border-white/10 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
                                    Continue Shopping
                                </Link>
                            </div>
                            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/40 font-medium">
                                <Link to="/returns-policy" className="hover:text-white transition-colors">Returns</Link>
                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                <Link to="/contact" className="hover:text-white transition-colors">Support</Link>
                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-zinc-500 text-sm">Need help with your order? <Link to="/contact" className="text-white/80 font-bold hover:text-white hover:underline transition-colors">Contact Support</Link></p>
                </div>
            </main>

            <footer className="w-full py-8 text-center text-white/20 text-xs border-t border-white/5 mt-auto">
                <p>© 2026 {settings.storeName}. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default ConfirmationPage;
