import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useNotification } from '../../context/NotificationContext';
import { emailService } from '../../services/emailService';

const OrderDetailsModal = ({ orderId, onClose, onUpdate }) => {
    const { formatPrice, settings: storeSettings } = useStoreSettings();
    const { notify } = useNotification();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const FULFILLMENT_STAGES = [
        'Pending',
        'Processing',
        'Shipped',
        'Delivered',
        'Returned',
        'Cancelled'
    ];

    const PAYMENT_STATUSES = [
        'Unpaid',
        'Paid',
        'Refunded'
    ];

    useEffect(() => {
        if (orderId) fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    customer:profiles(*),
                    items:order_items(
                        *,
                        product:products(*)
                    )
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;
            setOrder(data);

            // Mark as viewed if it wasn't already
            if (data.is_viewed === false) {
                await supabase
                    .from('orders')
                    .update({ is_viewed: true })
                    .eq('id', orderId);

                if (onUpdate) onUpdate(); // Refresh the parent list to clear visual markers
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (field, value) => {
        try {
            setIsUpdating(true);
            const { error } = await supabase
                .from('orders')
                .update({ [field]: value, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (error) throw error;

            // Trigger Email Notification (Async)
            const recipientEmail = order.customer?.email || order.shipping_address?.email;
            if (field === 'status' && storeSettings?.emailNotificationsEnabled && recipientEmail) {
                const customerInfo = {
                    full_name: order.customer?.full_name || `${order.shipping_address?.firstName || ''} ${order.shipping_address?.lastName || ''}`.trim() || 'Valued Customer',
                    email: recipientEmail
                };

                const orderWithMetadata = {
                    ...order,
                    currency: order.currency || storeSettings.currency || 'USD',
                    created_at: order.created_at || new Date().toISOString()
                };

                emailService.sendOrderStatusUpdate(orderWithMetadata, customerInfo, value)
                    .catch(err => console.error('Status update email failed:', err));
            }

            setOrder(prev => ({ ...prev, [field]: value }));
            notify(`${field.replace('_', ' ').toUpperCase()} updated successfully.`, 'success');

            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
            notify(`Failed to update ${field.replace('_', ' ')}`, 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    if (!orderId) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-4xl glossy-panel bg-[#0a0a0a]/90 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in">

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                            Order <span className="text-primary-light">#{orderId.substring(0, 8).toUpperCase()}</span>
                        </h2>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Transaction Detail & Fulfillment Control</p>
                    </div>
                    <button onClick={onClose} className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all border border-white/5">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Accessing Ledger...</p>
                        </div>
                    ) : order ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Column: Fulfillment & Payment Controls */}
                            <div className="lg:col-span-1 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Fulfillment Stage</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {FULFILLMENT_STAGES.map(stage => (
                                            <button
                                                key={stage}
                                                disabled={isUpdating}
                                                onClick={() => handleUpdateStatus('status', stage)}
                                                className={`h-12 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between px-4 ${order.status === stage
                                                    ? 'bg-primary/20 border-primary/40 text-white'
                                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                                                    }`}
                                            >
                                                {stage}
                                                {order.status === stage && <span className="material-symbols-outlined text-[16px] text-primary">verified</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Payment State</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PAYMENT_STATUSES.map(status => (
                                            <button
                                                key={status}
                                                disabled={isUpdating}
                                                onClick={() => handleUpdateStatus('payment_status', status)}
                                                className={`px-4 h-10 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${order.payment_status === status
                                                    ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Payment Method</label>
                                    <div className="glossy-panel bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary-light">
                                            {order.payment_method === 'cod' ? 'payments' : 'credit_card'}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-white text-[10px] font-black uppercase tracking-widest">
                                                {order.payment_method === 'paystack' ? 'Mpesa/Cards' :
                                                    order.payment_method === 'stripe' ? 'Credit Card (Stripe)' :
                                                        order.payment_method === 'cod' ? 'Cash on Delivery' :
                                                            order.payment_method || 'Standard Checkout'}
                                            </span>
                                            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">
                                                {order.payment_reference ? `Ref: ${order.payment_reference}` : 'Verified Processor'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle & Right Column: Details */}
                            <div className="lg:col-span-2 space-y-8">

                                {/* Customer & Shipping */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glossy-panel bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-gray-500 text-lg">person</span>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer Profile</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold">{order.customer?.full_name || `${order.shipping_address?.firstName || ''} ${order.shipping_address?.lastName || ''}`.trim() || 'Guest User'}</span>
                                            <span className="text-gray-500 text-xs">{order.customer?.email || order.shipping_address?.email}</span>
                                        </div>
                                    </div>

                                    <div className="glossy-panel bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-gray-500 text-lg">local_shipping</span>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Shipping Target</span>
                                        </div>
                                        <div className="flex flex-col text-xs text-white">
                                            <span>{order.shipping_address?.line1}</span>
                                            {(order.shipping_address?.city || order.shipping_address?.postal_code) && (
                                                <span>{order.shipping_address?.city}{order.shipping_address?.city && order.shipping_address?.postal_code ? ', ' : ''}{order.shipping_address?.postal_code}</span>
                                            )}
                                            <span className="text-gray-500 uppercase tracking-tighter mt-1">{order.shipping_address?.country || 'US'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Manifest Breakdown</label>
                                    <div className="glossy-panel bg-black/40 border border-white/5 rounded-3xl overflow-hidden">
                                        <div className="overflow-x-auto scrollbar-hide">
                                            <table className="w-full text-left border-collapse min-w-[500px]">
                                                <thead>
                                                    <tr className="bg-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                                        <th className="p-4">SKU/Item</th>
                                                        <th className="p-4 text-center">Qty</th>
                                                        <th className="p-4 text-right">Unit Price</th>
                                                        <th className="p-4 text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {order.items?.map(item => (
                                                        <tr key={item.id} className="text-xs">
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                                                        {item.product?.images?.[0] ? (
                                                                            <img src={item.product.images[0]} className="w-full h-full object-cover" alt="" />
                                                                        ) : (
                                                                            <span className="material-symbols-outlined text-gray-600 text-sm">image</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white font-bold">{item.product?.name || 'Unknown Product'}</span>
                                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                                            {[
                                                                                item.variation_name && <span key="v-name" className="text-[9px] text-primary-light font-black uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded-md">{item.variation_name}</span>,
                                                                                item.selected_size && <span key="v-size" className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter border border-white/10 px-1.5 py-0.5 rounded-md">Size: {item.selected_size}</span>,
                                                                                item.selected_color && <span key="v-color" className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter border border-white/10 px-1.5 py-0.5 rounded-md">Color: {item.selected_color}</span>,
                                                                                item.selected_weight && <span key="v-weight" className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter border border-white/10 px-1.5 py-0.5 rounded-md">{item.selected_weight}</span>,
                                                                                item.selected_dimension && <span key="v-dimension" className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter border border-white/10 px-1.5 py-0.5 rounded-md">{item.selected_dimension}</span>
                                                                            ].filter(Boolean)}
                                                                        </div>
                                                                        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter mt-1">ID: {item.product_id.substring(0, 8)}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-center font-black text-gray-400">{item.quantity}</td>
                                                            <td className="p-4 text-right text-gray-400">{formatPrice(item.price)}</td>
                                                            <td className="p-4 text-right font-black text-white">{formatPrice(item.price * item.quantity)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-white/[0.02]">
                                                        <td colSpan="3" className="p-6 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Valuation</td>
                                                        <td className="p-6 text-right">
                                                            <span className="text-2xl font-black text-white tracking-tighter">{formatPrice(order.total_amount)}</span>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500 uppercase tracking-widest font-black text-xs">Order Record Not Located</div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-black/20 flex items-center justify-between">
                    <button
                        onClick={() => window.print()}
                        className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">print</span> Print Invoice
                    </button>
                    <button
                        onClick={onClose}
                        className="admin-button-primary px-12 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl"
                    >
                        CLOSE MANIFEST
                    </button>
                </div>
            </div >

            <style>{`
                .animate-zoom-in {
                    animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes zoomIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
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
        </div >
    );
};

export default OrderDetailsModal;
