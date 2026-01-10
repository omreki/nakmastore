import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useNotification } from '../../context/NotificationContext';
import { emailService } from '../../services/emailService';

const CreateOrderModal = ({ onClose, onSuccess }) => {
    const { formatPrice, settings: storeSettings } = useStoreSettings();
    const { notify } = useNotification();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data states
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form states
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchCustomer, setSearchCustomer] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchProduct, setSearchProduct] = useState('');
    const [shippingAddress, setShippingAddress] = useState({
        line1: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [custRes, prodRes] = await Promise.all([
                supabase.from('profiles').select('*').order('full_name'),
                supabase.from('products').select('*').order('name')
            ]);

            if (custRes.data) setCustomers(custRes.data);
            if (prodRes.data) setProducts(prodRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addItem = (product) => {
        const existing = selectedItems.find(item => item.id === product.id);
        if (existing) {
            setSelectedItems(selectedItems.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
        }
    };

    const removeItem = (productId) => {
        setSelectedItems(selectedItems.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setSelectedItems(selectedItems.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleSubmit = async () => {
        if (!selectedCustomer || selectedItems.length === 0) return;

        try {
            setIsSubmitting(true);

            // 1. Create the order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    customer_id: selectedCustomer.id,
                    total_amount: totalAmount,
                    status: 'Pending',
                    payment_status: 'Unpaid',
                    shipping_address: shippingAddress,
                    currency: storeSettings?.currency || 'USD'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create order items
            const orderItems = selectedItems.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Trigger Email Notifications (Async)
            if (storeSettings?.emailNotificationsEnabled) {
                emailService.sendOrderConfirmation(order, selectedCustomer).catch(err => console.error('Confirmation email failed:', err));
                if (storeSettings?.supportEmail) {
                    emailService.sendAdminOrderNotification(order, storeSettings.supportEmail).catch(err => console.error('Admin notification failed:', err));
                }
            }

            onSuccess();
        } catch (error) {
            console.error('Error creating order:', error);
            notify('Failed to create order. Please ensure the orders table exists.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.full_name?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchCustomer.toLowerCase())
    );

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchProduct.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl glossy-panel bg-[#0a0a0a]/90 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in">

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-wider">Configure Order</h2>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Manual Transaction Interface</p>
                    </div>
                    <button onClick={onClose} className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all border border-white/5">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-white/5 relative">
                    <div
                        className="absolute h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                        style={{ width: `${(step / 3) * 100}%` }}
                    ></div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Select Customer</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">search</span>
                                    <input
                                        type="text"
                                        placeholder="SEARCH BY NAME OR EMAIL ID"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-12 pr-6 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-gray-700"
                                        value={searchCustomer}
                                        onChange={(e) => setSearchCustomer(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {isLoading ? (
                                    <div className="col-span-2 py-10 text-center text-gray-500 text-[10px] font-black uppercase tracking-widest">Accessing Profile Registry...</div>
                                ) : filteredCustomers.map(customer => (
                                    <button
                                        key={customer.id}
                                        onClick={() => setSelectedCustomer(customer)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${selectedCustomer?.id === customer.id
                                            ? 'bg-primary/20 border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'
                                            : 'bg-white/5 border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`size-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-black text-white border border-white/10`}>
                                            {(customer.full_name || customer.email)[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col flex-1 truncate">
                                            <span className="text-white font-bold text-xs truncate">{customer.full_name || 'Anonymous User'}</span>
                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tight truncate">{customer.email}</span>
                                        </div>
                                        {selectedCustomer?.id === customer.id && (
                                            <span className="material-symbols-outlined text-primary text-xl">verified</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Add Products</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">search</span>
                                        <input
                                            type="text"
                                            placeholder="SEARCH PRODUCT CATALOG"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-12 pr-6 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-gray-700"
                                            value={searchProduct}
                                            onChange={(e) => setSearchProduct(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                                    {filteredProducts.map(product => (
                                        <div key={product.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 group transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                                                    {product.images?.[0] ? (
                                                        <img src={product.images[0]} alt="" className="w-full h-full object-cover opacity-80" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-gray-600">image</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-xs">{product.name}</span>
                                                    <span className="text-primary font-black text-[10px]">{formatPrice(product.price)}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => addItem(product)}
                                                className="size-10 rounded-xl bg-white/5 hover:bg-primary hover:text-white flex items-center justify-center text-gray-500 transition-all border border-white/10"
                                            >
                                                <span className="material-symbols-outlined">add</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Current Manifest</label>
                                <div className="glossy-panel bg-black/40 rounded-3xl border border-white/5 p-6 space-y-4 min-h-[300px] flex flex-col">
                                    <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {selectedItems.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full opacity-20 text-center py-20">
                                                <span className="material-symbols-outlined text-5xl mb-4">shopping_cart</span>
                                                <p className="text-[10px] font-black uppercase tracking-widest">Manifest Empty</p>
                                            </div>
                                        ) : selectedItems.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-xs">{item.name}</span>
                                                    <span className="text-gray-500 text-[10px]">{formatPrice(item.price)} each</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-1">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="size-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-lg">remove</span>
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="size-8 rounded-lg hover:bg-white/5 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-lg">add</span>
                                                        </button>
                                                    </div>
                                                    <button onClick={() => removeItem(item.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                                        <span className="material-symbols-outlined">delete_sweep</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedItems.length > 0 && (
                                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Total Valuation</span>
                                                <span className="text-2xl font-black text-white">{formatPrice(totalAmount)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in max-w-xl mx-auto">
                            <div className="text-center space-y-2">
                                <span className="material-symbols-outlined text-5xl text-primary mb-2">local_shipping</span>
                                <h3 className="text-xl font-black text-white uppercase tracking-wider">Final Authorization</h3>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Validate shipping and payment protocols</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Address Line</label>
                                    <input
                                        type="text"
                                        placeholder="STREET ADDRESS"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all placeholder:text-gray-700"
                                        value={shippingAddress.line1}
                                        onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">City</label>
                                        <input
                                            type="text"
                                            placeholder="CITY"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                            value={shippingAddress.city}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Zip/Postal</label>
                                        <input
                                            type="text"
                                            placeholder="POSTAL CODE"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                            value={shippingAddress.postal_code}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="glossy-panel bg-primary/5 border border-primary/20 rounded-3xl p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined font-black">receipt_long</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-sm">Order Summary</span>
                                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{selectedItems.length} items for {selectedCustomer?.full_name}</span>
                                    </div>
                                </div>
                                <span className="text-2xl font-black text-white">{formatPrice(totalAmount)}</span>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-black/20 flex items-center justify-between">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                        className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                        {step === 1 ? 'Discard' : 'Go Back'}
                    </button>

                    <button
                        disabled={step === 1 ? !selectedCustomer : step === 2 ? selectedItems.length === 0 : isSubmitting}
                        onClick={() => {
                            if (step < 3) setStep(step + 1);
                            else handleSubmit();
                        }}
                        className="bg-primary hover:bg-white text-white hover:text-black px-12 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 disabled:opacity-20 flex items-center gap-3"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                COMMITTING...
                            </>
                        ) : step === 3 ? 'DEPLOY ORDER' : 'NEXT PHASE'}
                    </button>
                </div>
            </div>

            <style>{`
                .animate-zoom-in {
                    animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes zoomIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default CreateOrderModal;
