import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { supabase } from '../lib/supabase';
import { emailService } from '../services/emailService';
import { analyticsService } from '../services/analyticsService';
// Removed react-paystack hook to use direct Inline JS for better stability with async flows

const CheckoutPage = () => {
    const { formatPrice, settings, calculateTax, getTaxName, shouldShowTax } = useStoreSettings();
    const { user, setIsLoginModalOpen } = useAuth();
    const { cart, getCartTotal, clearCart } = useCart();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [selectedPayment, setSelectedPayment] = useState('');
    const [selectedShippingId, setSelectedShippingId] = useState('');
    const [isGuestCheckout, setIsGuestCheckout] = useState(false);
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        analyticsService.trackEvent('checkout', 'Checkout Start', { step: 1 });
    }, []);

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        phoneNumber: '',
        country: 'Kenya',
        cardNumber: '',
        expiry: '',
        cvv: ''
    });

    useEffect(() => {
        if (user?.email) {
            setFormData(prev => ({ ...prev, email: user.email }));
            // If user logs in while prompt is open, close it and advance to payment
            if (showAuthPrompt) {
                setShowAuthPrompt(false);
                setStep(3);
                notify('Authenticated! Continuing to payment...', 'success');
            }
        }
    }, [user, showAuthPrompt]);

    const subtotal = getCartTotal();
    const activeMethods = settings?.shippingMethods?.filter(m => m.enabled) || [];

    useEffect(() => {
        if (activeMethods.length > 0) {
            const currentIsValid = activeMethods.some(m => m.id === selectedShippingId);
            if (!selectedShippingId || !currentIsValid) {
                setSelectedShippingId(activeMethods[0].id);
            }
        } else if (selectedShippingId) {
            setSelectedShippingId('');
        }
    }, [activeMethods, selectedShippingId]);

    const activePaymentGateways = settings?.paymentGateways ?
        Object.entries(settings.paymentGateways)
            .filter(([_, enabled]) => enabled)
            .map(([key]) => key) : [];

    useEffect(() => {
        if (activePaymentGateways.length > 0) {
            const currentIsValid = activePaymentGateways.includes(selectedPayment);
            if (!selectedPayment || !currentIsValid) {
                setSelectedPayment(activePaymentGateways[0]);
            }
        } else if (selectedPayment) {
            setSelectedPayment('');
        }
    }, [activePaymentGateways, selectedPayment]);

    const selectedMethod = activeMethods.find(m => m.id === selectedShippingId);
    const shipping = selectedMethod ? selectedMethod.cost : 0;
    const tax = calculateTax(subtotal);
    const total = subtotal + shipping + tax;

    // Paystack is now handled directly in handleSubmit using PaystackPop.setup()
    // for better stability in live Mobile Money environments.

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 2) {
            // Before moving to payment (Step 3), enforce authentication unless guest
            if (!user && !isGuestCheckout) {
                setShowAuthPrompt(true);
                return;
            }
            setStep(3);
        } else if (step === 1) {
            setStep(2);
            analyticsService.trackEvent('checkout', 'Checkout Step 2', { from_step: 1 });
        } else if (step === 3) {
            if (selectedPayment === 'paystack') {
                const publicKey = settings?.paymentConfigs?.paystack?.publicKey;
                if (!publicKey) {
                    notify('Paystack configuration missing.', 'error');
                    return;
                }

                try {
                    setIsProcessing(true);
                    notify('Preparing your order...', 'info');

                    // 1. Generate local fresh data
                    const currentRef = `REF${Date.now()}${(Math.random() * 10000).toFixed(0)}`;
                    const amountInCents = Math.round(Number(total) * 100);

                    // 2. Create the order in your database first
                    const order = await processOrder('Unpaid', currentRef, true);

                    if (!order) {
                        console.error('Database: Order creation failed before payment');
                        setIsProcessing(false);
                        return;
                    }

                    console.log('Database: Order created successfully. Initializing Paystack...', order.id);

                    // 3. Trigger Paystack Inline directly (more stable than the hook for async flows)
                    const handler = window.PaystackPop.setup({
                        key: publicKey.trim(),
                        email: (formData.email || '').toLowerCase().trim(),
                        amount: amountInCents,
                        currency: (settings?.currency || 'KES').toUpperCase().trim(),
                        ref: currentRef,
                        firstname: formData.firstName,
                        lastname: formData.lastName,
                        metadata: {
                            order_id: order.id,
                            custom_fields: [
                                {
                                    display_name: "Customer Name",
                                    variable_name: "customer_name",
                                    value: `${formData.firstName} ${formData.lastName}`
                                },
                                {
                                    display_name: "Order ID",
                                    variable_name: "order_id",
                                    value: order.id
                                }
                            ]
                        },
                        callback: (response) => {
                            console.log('Paystack SUCCESS:', response);
                            notify('Payment confirmed!', 'success');
                            finalizeOrderAfterPayment(order, response.reference);
                        },
                        onClose: () => {
                            console.log('Paystack CANCELLED');
                            setIsProcessing(false);
                            notify('Payment was cancelled.', 'info');
                        }
                    });

                    handler.openIframe();

                } catch (err) {
                    console.error('Checkout logic error:', err);
                    notify('Failed to start checkout. Please try again.', 'error');
                    setIsProcessing(false);
                }
            } else {
                processOrder(selectedPayment === 'cod' ? 'Unpaid' : 'Paid');
            }
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
                shippingDetails: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    line1: formData.address,
                    country: formData.country,
                    phone: formData.phoneNumber,
                    method: selectedMethod?.name || 'Standard Shipping'
                },
                items: cart.map(item => ({
                    name: item.name,
                    images: item.images || [],
                    variation_name: item.variation_name,
                    quantity: item.quantity,
                    price: item.price,
                    selectedSize: item.selectedSize || 'M',
                    selectedColor: item.selectedColor || ''
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
            const customerData = { email: (formData.email || '').trim(), full_name: `${formData.firstName} ${formData.lastName}` };
            const emailItems = confirmationData.order.items.map(item => ({
                product_name: item.name,
                quantity: item.quantity,
                price: item.price
            }));

            // Fetch admin emails
            const { data: teamMembers } = await supabase.from('team_members').select('email').in('role', ['admin', 'editor', 'shop_manager']);
            const allRecipients = [...new Set([(teamMembers || []).map(m => m.email), settings?.alertEmails || []].flat())].filter(Boolean);

            await Promise.all([
                emailService.sendOrderConfirmation(confirmationData.order, customerData, emailItems)
                    .catch(e => console.error('Customer email failed:', e)),
                allRecipients.length > 0
                    ? emailService.sendAdminOrderNotification(confirmationData.order, allRecipients, customerData, emailItems)
                        .catch(e => console.error('Admin email failed:', e))
                    : Promise.resolve()
            ]);
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
        const shippingAddress = {
            line1: formData.address,
            country: formData.country,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phoneNumber
        };

        try {
            let finalCustomerId = user?.id || null;

            // Handle Guest Auto-Account Creation
            if (!user && isGuestCheckout) {
                try {
                    // Check if profile exists first to avoid Auth 422 error noise
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('email', formData.email)
                        .maybeSingle();

                    if (existingProfile) {
                        finalCustomerId = existingProfile.id;
                        console.log('Found existing customer profile. Linking order.');
                    } else {
                        const { data: authData, error: authError } = await supabase.auth.signUp({
                            email: formData.email,
                            password: 'NakmaStore@2026',
                            options: {
                                data: {
                                    full_name: `${formData.firstName} ${formData.lastName}`,
                                }
                            }
                        });

                        if (!authError && authData.user) {
                            finalCustomerId = authData.user.id;
                            // Create profile manually as backup
                            supabase.from('profiles').upsert([{
                                id: authData.user.id,
                                email: formData.email,
                                full_name: `${formData.firstName} ${formData.lastName}`,
                                role: 'user'
                            }]).then(({ error }) => error && console.error('Profile backup error:', error));

                            // Send account details email
                            emailService.sendGuestAccountDetails(formData.email, 'NakmaStore@2026').catch(console.error);
                        }
                    }
                } catch (err) {
                    console.error('Guest prep error:', err);
                }
            }

            // 1. Create the order in Supabase
            const generatedRef = paymentReference || `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: finalCustomerId,
                    total_amount: total,
                    status: onlyCreate ? 'Pending' : 'Processing',
                    payment_status: paymentStatus,
                    payment_method: selectedPayment,
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
                variation_name: item.variation_name || null
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
                const customerData = { email: (formData.email || '').trim(), full_name: `${formData.firstName} ${formData.lastName}` };
                const emailItems = cart.map(item => ({
                    product_name: item.name,
                    quantity: item.quantity,
                    price: item.price
                }));

                // Admin Email Fetch
                const { data: teamMembers } = await supabase.from('team_members').select('email').in('role', ['admin', 'editor', 'shop_manager']);
                const allRecipients = [...new Set([(teamMembers || []).map(m => m.email), settings?.alertEmails || []].flat())].filter(Boolean);

                await Promise.all([
                    emailService.sendOrderConfirmation(order, customerData, emailItems)
                        .catch(e => console.error('Customer email failed:', e)),
                    allRecipients.length > 0
                        ? emailService.sendAdminOrderNotification(order, allRecipients, customerData, emailItems)
                            .catch(e => console.error('Admin email failed:', e))
                        : Promise.resolve()
                ]);
            } catch (e) {
                console.error('Notification background error:', e);
            }

            notify('Order placed!', 'success');
            setIsProcessing(false);
            navigate('/confirmation', {
                state: {
                    order: {
                        ...order,
                        paymentMethod: selectedPayment,
                        shippingDetails: {
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            email: formData.email,
                            line1: formData.address,
                            country: formData.country,
                            phone: formData.phoneNumber,
                            method: selectedMethod?.name || 'Standard Shipping'
                        },
                        items: cart.map(item => ({
                            name: item.name,
                            images: item.images || [],
                            variation_name: item.variation_name,
                            quantity: item.quantity,
                            price: item.price,
                            selectedSize: item.selectedSize,
                            selectedColor: item.selectedColor
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

    const handleGuestCheckout = () => {
        setIsGuestCheckout(true);
        setShowAuthPrompt(false);
        setStep(3);
    };

    const handleLoginClick = () => {
        setShowAuthPrompt(false);
        setIsLoginModalOpen(true);
    };

    return (
        <div className="bg-black min-h-screen text-white font-['Manrope'] pt-20 md:pt-32 pb-10 md:pb-20 relative">
            {/* Ambient Lighting */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-black/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Auth Prompt Modal */}
            {showAuthPrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div
                        onClick={() => setShowAuthPrompt(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <div className="relative w-full max-w-md bg-black glass-panel p-10 rounded-[40px] border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#b82063] to-transparent opacity-50"></div>

                        <h2 className="text-2xl font-black italic tracking-tight mb-4 text-center uppercase">Secure Your Order</h2>
                        <p className="text-white/60 text-center mb-10 text-sm leading-relaxed">
                            Sign in or create an account to complete your purchase. This ensures you can track your delivery and access your order history.
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={handleLoginClick}
                                className="w-full h-14 store-button-primary rounded-full text-[10px]"
                            >
                                <span>Sign In / Create Account</span>
                                <span className="material-symbols-outlined text-sm">login</span>
                            </button>
                            <button
                                onClick={handleGuestCheckout}
                                className="w-full h-14 store-button-secondary rounded-full text-[10px]"
                            >
                                <span>Continue as Guest</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                            <p className="text-[9px] text-white/20 text-center uppercase tracking-widest font-bold">Authentication is recommended but optional</p>
                        </div>

                        <button
                            onClick={() => setShowAuthPrompt(false)}
                            className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
            )}

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
                                <span className={step >= 2 ? 'text-[#b82063]' : 'text-white/20'}>Delivery</span>
                                <span className="text-white/10">/</span>
                                <span className={step >= 3 ? 'text-[#b82063]' : 'text-white/20'}>Pay</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
                            {step === 1 && (
                                <div className="space-y-6 md:space-y-10 animate-fade-in">
                                    <div className="space-y-4 md:space-y-6">
                                        <h2 className="text-xl md:text-2xl font-bold italic">Contact Information</h2>
                                        <div className="group relative">
                                            <input
                                                required
                                                type="email"
                                                name="email"
                                                placeholder="Email Address"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-[#b82063] transition-all placeholder:text-white/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 md:space-y-6">
                                        <h2 className="text-xl md:text-2xl font-bold italic">Delivery Address</h2>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                required
                                                name="firstName"
                                                placeholder="First Name"
                                                onChange={handleInputChange}
                                                className="h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-[#b82063] transition-all placeholder:text-white/20"
                                            />
                                            <input
                                                required
                                                name="lastName"
                                                placeholder="Last Name"
                                                onChange={handleInputChange}
                                                className="h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-[#b82063] transition-all placeholder:text-white/20"
                                            />
                                        </div>
                                        <input
                                            required
                                            name="address"
                                            placeholder="Street Address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-[#b82063] transition-all placeholder:text-white/20"
                                        />

                                        <div className="group relative">
                                            <input
                                                required
                                                type="tel"
                                                name="phoneNumber"
                                                placeholder="Phone Number"
                                                onChange={handleInputChange}
                                                className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-[#b82063] transition-all placeholder:text-white/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 md:space-y-10 animate-fade-in">
                                    <h2 className="text-xl md:text-2xl font-bold italic">Choose Delivery Method</h2>
                                    <div className="space-y-3 md:space-y-4">
                                        {activeMethods.length > 0 ? (
                                            activeMethods.map((method) => (
                                                <label key={method.id} className={`flex items-center justify-between p-4 md:p-8 rounded-2xl md:rounded-[30px] border transition-all group cursor-pointer ${selectedShippingId === method.id ? 'bg-primary/10 border-[#b82063]' : 'bg-white/[0.03] border-white/10 hover:border-white/20'}`}>
                                                    <div className="flex items-center gap-4 md:gap-6">
                                                        <input
                                                            type="radio"
                                                            name="shipping"
                                                            checked={selectedShippingId === method.id}
                                                            onChange={() => setSelectedShippingId(method.id)}
                                                            className="size-6 accent-[#b82063]"
                                                        />
                                                        <div>
                                                            <p className="font-bold text-lg md:text-xl">{method.name}</p>
                                                            <p className="text-white/40 text-[10px] md:text-sm">{method.deliveryTime || method.time}</p>
                                                            {method.description && <p className="text-white/20 text-xs mt-1">{method.description}</p>}
                                                        </div>
                                                    </div>
                                                    <span className="font-bold">{method.cost === 0 ? 'FREE' : formatPrice(method.cost)}</span>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="text-white/50 text-center py-10">No delivery methods available.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 md:space-y-10 animate-fade-in">
                                    <h2 className="text-xl md:text-2xl font-bold italic">Payment Method</h2>

                                    <div className="space-y-4">
                                        {['paystack', 'stripe', 'paypal', 'cod'].map((key) => {
                                            const enabled = settings?.paymentGateways?.[key];
                                            if (!enabled) return null;

                                            let label = key;
                                            if (key === 'stripe') label = 'Credit Card (Stripe)';
                                            if (key === 'paypal') label = 'PayPal';
                                            if (key === 'paystack') label = 'Mpesa/Cards';
                                            if (key === 'cod') label = 'Cash on Delivery';

                                            return (
                                                <label key={key} className={`flex items-center gap-3 md:gap-4 p-4 md:p-6 rounded-xl border cursor-pointer transition-all ${selectedPayment === key ? 'bg-primary/10 border-[#b82063]' : 'bg-white/[0.03] border-white/10 hover:border-white/20'}`}>
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value={key}
                                                        checked={selectedPayment === key}
                                                        onChange={(e) => setSelectedPayment(e.target.value)}
                                                        className="accent-[#b82063] size-4 md:size-5"
                                                    />
                                                    <span className="font-bold text-sm uppercase tracking-wider">{label}</span>
                                                </label>
                                            );
                                        })}

                                        {(!settings?.paymentGateways || Object.values(settings.paymentGateways).every(v => !v)) && (
                                            <p className="text-white/50 text-sm">No payment methods available.</p>
                                        )}
                                    </div>

                                </div>
                            )}

                            <div className="flex flex-col md:flex-row gap-6">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setStep(step - 1)}
                                        className="h-14 md:h-20 px-8 md:px-10 rounded-full border border-white/10 font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-xs md:text-sm"
                                    >
                                        Back
                                    </button>
                                )}
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
                                            {step === 3 ? 'Place Order' : (step === 2 ? 'Continue to Payment' : 'Continue')}
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
                                    <div key={`${item.id}-${item.variation_id || 'base'}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-6 items-center">
                                        <div className="size-20 rounded-[16px] overflow-hidden bg-[#f5f5f5] p-2 flex-shrink-0 border border-white/5">
                                            <img src={item.images?.[0]} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-bold text-sm leading-tight">{item.name}</p>
                                            <div className="flex flex-col mt-1">
                                                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
                                                    Qty {item.quantity} / {item.selectedSize || 'M'}
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
                                    <span className="text-white">{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
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

                            <div className="pt-4 space-y-4">
                                {settings?.checkoutPageSettings?.giftMessage && (
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-[#b82063]/20">
                                        <span className="material-symbols-outlined text-[#b82063]">redeem</span>
                                        <p
                                            className="text-[10px] font-bold uppercase tracking-widest leading-tight"
                                            dangerouslySetInnerHTML={{ __html: settings.checkoutPageSettings.giftMessage }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckoutPage;
