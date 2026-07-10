import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { sendOrderPlacementNotifications } from '../utils/orderNotifications';
import { analyticsService } from '../services/analyticsService';
import DeliveryLocationPicker from '../components/checkout/DeliveryLocationPicker';
import { NETWORK_DELIVERY_FLAT_RATE } from '../constants/deliveryLocations';
import {
    getPaymentMethodLabel,
    resolveCartPaymentMethod,
} from '../utils/paymentMethod';
// Removed react-paystack hook to use direct Inline JS for better stability with async flows

const CheckoutPage = () => {
    const { formatPrice, settings, calculateTax, getTaxName, shouldShowTax } = useStoreSettings();
    const { user } = useAuth();
    const { cart, getCartTotal, clearCart } = useCart();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [deliveryLocation, setDeliveryLocation] = useState({
        type: 'custom',
        location: '',
        routeId: null,
        routeName: null,
    });

    const getCheckoutEmail = () => {
        if (user?.email) return user.email.toLowerCase().trim();
        const phoneDigits = (formData.phoneNumber || '').replace(/\D/g, '');
        if (phoneDigits) return `guest+${phoneDigits}@nakmaltd.com`;
        return 'guest@nakmaltd.com';
    };

    useEffect(() => {
        analyticsService.trackEvent('checkout', 'Checkout Start', { step: 1 });
    }, []);

    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        country: 'Kenya',
        cardNumber: '',
        expiry: '',
        cvv: ''
    });

    const getCustomerFullName = () => formData.fullName.trim();
    const getDeliveryLocationLabel = () => deliveryLocation.location?.trim() || '';

    const getShippingMethodLabel = () => {
        if (deliveryLocation.type === 'network' && deliveryLocation.routeName) {
            return `${deliveryLocation.routeName} · Flat Rate`;
        }
        return getDeliveryLocationLabel() || 'Delivery';
    };

    const buildShippingDetails = () => ({
        fullName: getCustomerFullName(),
        firstName: getCustomerFullName(),
        lastName: '',
        email: getCheckoutEmail(),
        line1: getDeliveryLocationLabel(),
        country: formData.country,
        phone: formData.phoneNumber,
        method: getShippingMethodLabel(),
        deliveryLocation: getDeliveryLocationLabel(),
        deliveryRoute: deliveryLocation.routeName || null,
        deliveryLocationType: deliveryLocation.type,
        isNetworkDelivery: deliveryLocation.type === 'network',
    });

    const getPaystackNameParts = () => {
        const parts = getCustomerFullName().split(/\s+/).filter(Boolean);
        if (!parts.length) return { firstname: '', lastname: '' };
        return {
            firstname: parts[0],
            lastname: parts.slice(1).join(' ') || parts[0],
        };
    };

    const subtotal = getCartTotal();
    const orderPaymentMethod = resolveCartPaymentMethod(cart);
    const isPaymentGatewayEnabled = settings?.paymentGateways?.[orderPaymentMethod] ?? orderPaymentMethod === 'cod';

    const shipping = deliveryLocation.type === 'network' ? NETWORK_DELIVERY_FLAT_RATE : 0;
    const tax = calculateTax(subtotal);
    const total = subtotal + shipping + tax;

    const getShippingDisplay = () => {
        if (deliveryLocation.type === 'network') return formatPrice(NETWORK_DELIVERY_FLAT_RATE);
        return '—';
    };

    // Paystack is now handled directly in handleSubmit using PaystackPop.setup()
    // for better stability in live Mobile Money environments.

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const placeOrder = async () => {
        if (!isPaymentGatewayEnabled) {
            notify(`Payment method "${getPaymentMethodLabel(orderPaymentMethod)}" is not available.`, 'error');
            return;
        }

        if (orderPaymentMethod === 'paystack') {
            const publicKey = settings?.paymentConfigs?.paystack?.publicKey;
            if (!publicKey) {
                notify('Paystack configuration missing.', 'error');
                return;
            }

            try {
                setIsProcessing(true);
                notify('Preparing your order...', 'info');

                const currentRef = `REF${Date.now()}${(Math.random() * 10000).toFixed(0)}`;
                const amountInCents = Math.round(Number(total) * 100);
                const order = await processOrder('Unpaid', currentRef, true);

                if (!order) {
                    console.error('Database: Order creation failed before payment');
                    setIsProcessing(false);
                    return;
                }

                const paystackNames = getPaystackNameParts();
                const handler = window.PaystackPop.setup({
                    key: publicKey.trim(),
                    email: getCheckoutEmail(),
                    amount: amountInCents,
                    currency: (settings?.currency || 'KES').toUpperCase().trim(),
                    ref: currentRef,
                    firstname: paystackNames.firstname,
                    lastname: paystackNames.lastname,
                    metadata: {
                        order_id: order.id,
                        custom_fields: [
                            {
                                display_name: 'Customer Name',
                                variable_name: 'customer_name',
                                value: getCustomerFullName(),
                            },
                            {
                                display_name: 'Order ID',
                                variable_name: 'order_id',
                                value: order.id,
                            },
                        ],
                    },
                    callback: (response) => {
                        notify('Payment confirmed!', 'success');
                        finalizeOrderAfterPayment(order, response.reference);
                    },
                    onClose: () => {
                        setIsProcessing(false);
                        notify('Payment was cancelled.', 'info');
                    },
                });

                handler.openIframe();
            } catch (err) {
                console.error('Checkout logic error:', err);
                notify('Failed to start checkout. Please try again.', 'error');
                setIsProcessing(false);
            }
            return;
        }

        processOrder(orderPaymentMethod === 'cod' ? 'Unpaid' : 'Paid');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 2) {
            await placeOrder();
        } else if (step === 1) {
            if (!getDeliveryLocationLabel()) {
                notify('Please enter a delivery location.', 'error');
                return;
            }
            setStep(2);
            analyticsService.trackEvent('checkout', 'Checkout Step 2', { from_step: 1 });
        }
    };

    const finalizeOrderAfterPayment = async (originalOrder, reference) => {
        console.log('Finalizing order after payment...', { orderId: originalOrder?.id, reference });

        // 1. Prepare ALL necessary data immediately
        const confirmationData = {
            order: {
                ...originalOrder,
                id: originalOrder.id || reference,
                payment_status: 'Paid',
                paymentMethod: 'paystack',
                shippingDetails: buildShippingDetails(),
                items: cart.map(item => ({
                    name: item.name,
                    images: item.images || [],
                    variation_name: item.variation_name,
                    quantity: item.quantity,
                    price: item.price,
                    selectedSize: item.selectedSize,
                    selectedColor: item.selectedColor,
                    selectedWeight: item.selectedWeight,
                    selectedDimension: item.selectedDimension
                })),
                totals: {
                    subtotal: Number(subtotal),
                    shipping: Number(shipping),
                    tax: Number(tax),
                    total: Number(total)
                }
            }
        };

        console.log('Redirection state prepared:', confirmationData);

        // 2. SILENT BACKGROUND UPDATE (Backup for webhook)
        supabase.from('orders').update({
            payment_status: 'Paid',
            status: 'Processing',
            payment_reference: reference
        }).eq('id', originalOrder.id).then(({ error }) => {
            if (error) console.log('Silent update backup:', error.message);
        });

        // 3. SILENT BACKGROUND NOTIFICATIONS
        // 3. AWAIT BACKGROUND NOTIFICATIONS (Ensure they are sent before moving)
        try {
            console.log('Sending notifications...');
            const customerData = { email: getCheckoutEmail(), full_name: getCustomerFullName() };
            await sendOrderPlacementNotifications({
                order: confirmationData.order,
                customer: customerData,
                items: confirmationData.order.items,
                settings,
            });
            console.log('Notifications sent.');
        } catch (e) {
            console.error('Notification error:', e);
        }

        // 4. IMMEDIATE REDIRECT (Don't clear cart here, clear on confirmation page to avoid race conditions)
        console.log('Triggering navigation to /confirmation');
        setIsProcessing(false);
        navigate('/confirmation', {
            state: confirmationData,
            replace: true
        });
    };

    const processOrder = async (paymentStatus, paymentReference = null, onlyCreate = false) => {
        if (isProcessing) return;
        setIsProcessing(true);

        // Construct Shipping Address
        const shippingAddress = buildShippingDetails();

        try {
            const finalCustomerId = user?.id || null;
            // 1. Create the order in Supabase
            const generatedRef = paymentReference || `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: finalCustomerId,
                    total_amount: total,
                    status: onlyCreate ? 'Pending' : 'Processing',
                    payment_status: paymentStatus,
                    payment_method: orderPaymentMethod,
                    payment_reference: generatedRef,
                    shipping_address: shippingAddress,
                    currency: settings?.currency || 'USD'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create order items
            const orderItems = cart.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                variation_id: item.variation_id || null,
                variation_name: item.variation_name || null,
                selected_size: item.selectedSize || null,
                selected_color: item.selectedColor ? (typeof item.selectedColor === 'object' ? item.selectedColor.name : item.selectedColor) : null,
                selected_weight: item.selectedWeight || null,
                selected_dimension: item.selectedDimension || null
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Early return for Paystack
            if (onlyCreate) {
                return order;
            }

            // 4. Finalize for other methods (COD)
            clearCart();

            // Background decrement for non-paystack
            for (const item of cart) {
                if (item.variation_id) {
                    supabase.rpc('decrement_variation_stock', { var_id: item.variation_id, qty: item.quantity });
                }
                supabase.rpc('decrement_product_stock', { prod_id: item.id, qty: item.quantity });
            }

            // Background Notifications
            // AWAIT Notifications before navigation
            try {
                const customerData = { email: getCheckoutEmail(), full_name: getCustomerFullName() };
                await sendOrderPlacementNotifications({
                    order,
                    customer: customerData,
                    items: cart,
                    settings,
                });
            } catch (e) {
                console.error('Notification background error:', e);
            }

            notify('Order placed!', 'success');
            setIsProcessing(false);
            navigate('/confirmation', {
                state: {
                    order: {
                        ...order,
                        paymentMethod: orderPaymentMethod,
                        shippingDetails: buildShippingDetails(),
                        items: cart.map(item => ({
                            name: item.name,
                            images: item.images || [],
                            variation_name: item.variation_name,
                            quantity: item.quantity,
                            price: item.price,
                            selectedSize: item.selectedSize,
                            selectedColor: item.selectedColor,
                            selectedWeight: item.selectedWeight,
                            selectedDimension: item.selectedDimension
                        })),
                        totals: { subtotal, shipping, tax, total }
                    }
                },
                replace: true
            });
            setIsProcessing(false);
        } catch (err) {
            console.error('Order process error:', err);
            if (err.message && err.message.includes('unique constraint')) {
                notify('Please wait a moment and try again (Reference Collision).', 'error');
            } else {
                notify(`Checkout failed: ${err.message || 'Please try again'}`, 'error');
            }
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-black min-h-screen text-white font-['Manrope'] pt-20 md:pt-32 pb-10 md:pb-20 relative">
            {/* Ambient Lighting */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-black/10 rounded-full blur-[100px]"></div>
            </div>

            <main className="max-w-[1440px] mx-auto px-4 md:px-10">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-24">
                    {/* Left Column: Form */}
                    <div className="flex-grow lg:w-2/3 space-y-8 md:space-y-12">
                        {/* Progress Header */}
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 md:gap-6">
                            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Secure Checkout</h1>
                            <div className="flex items-center gap-3 md:gap-4 text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.3em]">
                                <span className={step >= 1 ? 'text-[#b82063]' : 'text-white/20'}>Info</span>
                                <span className="text-white/10">/</span>
                                <span className={step >= 2 ? 'text-[#b82063]' : 'text-white/20'}>Review</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
                            {step === 1 && (
                                <div className="space-y-4 md:space-y-6 animate-fade-in">
                                    <h2 className="text-xl md:text-2xl font-bold italic">Delivery Address</h2>
                                    <input
                                        required
                                        name="fullName"
                                        placeholder="Your name"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-[#b82063] transition-all placeholder:text-white/50"
                                    />
                                    <DeliveryLocationPicker
                                        value={deliveryLocation}
                                        onChange={setDeliveryLocation}
                                    />

                                    <div className="group relative">
                                        <input
                                            required
                                            type="tel"
                                            name="phoneNumber"
                                            placeholder="Phone Number"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-[#b82063] transition-all placeholder:text-white/50"
                                        />
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 md:space-y-10 animate-fade-in">
                                    <h2 className="text-xl md:text-2xl font-bold italic">Delivery Summary</h2>
                                    <div className="p-6 md:p-8 rounded-2xl md:rounded-[30px] border bg-primary/10 border-[#b82063] space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Location</p>
                                            <p className="font-bold text-lg md:text-xl mt-1">{getDeliveryLocationLabel()}</p>
                                            {deliveryLocation.routeName && (
                                                <p className="text-white/50 text-sm mt-1">{deliveryLocation.routeName}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <div>
                                                <p className="font-bold text-lg md:text-xl">Delivery Fee</p>
                                                {deliveryLocation.type === 'network' && (
                                                    <p className="text-white/40 text-[10px] md:text-sm">
                                                        Flat rate across our delivery network
                                                    </p>
                                                )}
                                            </div>
                                            <span className="font-bold text-lg md:text-xl">
                                                {deliveryLocation.type === 'network'
                                                    ? formatPrice(NETWORK_DELIVERY_FLAT_RATE)
                                                    : '—'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <div>
                                                <p className="font-bold text-lg md:text-xl">Payment</p>
                                                <p className="text-white/40 text-[10px] md:text-sm">
                                                    Set per product in your bag
                                                </p>
                                            </div>
                                            <span className="font-bold text-lg md:text-xl">
                                                {getPaymentMethodLabel(orderPaymentMethod)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row gap-6">
                                <button
                                    type="button"
                                    onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
                                    className="h-14 md:h-20 px-8 md:px-10 rounded-full border border-white/10 font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-xs md:text-sm"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className={`flex-grow h-16 md:h-20 store-button-primary rounded-[20px] md:rounded-full text-sm md:text-base ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <span>Confirming...</span>
                                            <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        </>
                                    ) : (
                                        <>
                                            {step === 2 ? 'Place Order' : 'Continue'}
                                            <span className="material-symbols-outlined">east</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Mini Cart */}
                    <div className="lg:w-1/3">
                        <div className="sticky top-32 bg-white/[0.03] border border-white/10 rounded-[24px] md:rounded-[40px] p-5 md:p-10 space-y-6 md:space-y-10 shadow-2xl backdrop-blur-xl">
                            <h2 className="text-xl md:text-3xl font-bold italic tracking-tight underline decoration-[#b82063] decoration-2 md:decoration-4 underline-offset-4 md:underline-offset-8">In Your Bag</h2>

                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                {cart.map((item) => (
                                    <div key={`${item.id}-${item.variation_id || 'base'}-${item.selectedSize}-${item.selectedColor?.name || item.selectedColor}-${item.selectedWeight}-${item.selectedDimension}`} className="flex gap-6 items-center">
                                        <div className="size-20 overflow-hidden bg-[#f5f5f5] p-2 flex-shrink-0 border border-white/5">
                                            <img src={item.images?.[0]} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-bold text-sm leading-tight">{item.name}</p>
                                            <div className="flex flex-col mt-1">
                                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
                                                    Qty {item.quantity} / {[
                                                        item.selectedColor?.name || item.selectedColor,
                                                        item.selectedSize,
                                                        item.selectedWeight,
                                                        item.selectedDimension
                                                    ].filter(Boolean).join(' / ')}
                                                </p>
                                                {item.variation_name && (
                                                    <p className="text-[9px] font-medium text-white/20 uppercase tracking-[0.1em]">
                                                        {item.variation_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 border-t border-white/10 pt-6 md:pt-10">
                                <div className="flex justify-between items-center text-white/40 text-sm font-bold uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span className="text-white">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-white/40 text-sm font-bold uppercase tracking-widest">
                                    <span>Delivery</span>
                                    <span className="text-white">{getShippingDisplay()}</span>
                                </div>
                                {shouldShowTax() && (
                                    <div className="flex justify-between items-center text-white/40 text-sm font-bold uppercase tracking-widest">
                                        <span>{getTaxName()}</span>
                                        <span className="text-white">{formatPrice(tax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-2xl font-black italic pt-4">
                                    <span>Total</span>
                                    <span className="text-[#b82063]">{formatPrice(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckoutPage;
