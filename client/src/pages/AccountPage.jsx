import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useNotification } from '../context/NotificationContext';

const AccountPage = () => {
    const { user, signOut } = useAuth();
    const { formatPrice, currencySymbol } = useStoreSettings();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const highlightOrderId = searchParams.get('orderId');

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        fetchOrders();
    }, [user, navigate]);

    useEffect(() => {
        if (!loading && highlightOrderId && orders.length > 0) {
            const element = document.getElementById(`order-${highlightOrderId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [loading, highlightOrderId, orders]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        products (
                            name,
                            images
                        )
                    )
                `)
                .eq('customer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            notify('Failed to load order history', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'shipped': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'processing': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'pending': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
            case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#30136a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-white/50 text-sm font-bold uppercase tracking-[0.2em]">Crafting Your Space...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#30136a] text-white pt-20 md:pt-24 pb-20 font-['Manrope']">
            {/* Ambient Lighting */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-[#30136a]/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#30136a]/10 rounded-full blur-[100px]"></div>
            </div>

            <main className="max-w-[1200px] mx-auto px-6 md:px-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm">
                                Profile Hub
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ Member Profile</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white italic">
                            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">Account</span>
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Sticky Sidebar */}
                    <div className="lg:col-span-3">
                        <div className="glass-panel rounded-[1.5rem] md:rounded-[2rem] p-3 md:p-4 border border-white/5 bg-black/20 h-fit">
                            <div className="p-4 mb-4 border-b border-white/5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                        <span className="material-symbols-outlined text-primary text-xl">person</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold truncate">{user?.email}</p>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Active Member</p>
                                    </div>
                                </div>
                            </div>
                            <nav className="flex flex-col gap-1">
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all text-left ${activeTab === 'orders' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                                    <span className="font-black text-[10px] uppercase tracking-widest">Orders</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all text-left ${activeTab === 'details' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">id_card</span>
                                    <span className="font-black text-[10px] uppercase tracking-widest">Details</span>
                                </button>
                                <button
                                    onClick={signOut}
                                    className="flex items-center gap-3 px-5 py-4 rounded-xl transition-all text-left text-red-500/60 hover:text-red-500 hover:bg-red-500/10 mt-4 border border-transparent hover:border-red-500/20"
                                >
                                    <span className="material-symbols-outlined text-[20px]">logout</span>
                                    <span className="font-black text-[10px] uppercase tracking-widest">Logout</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        {activeTab === 'orders' ? (
                            <div className="space-y-6">
                                {orders.length === 0 ? (
                                    <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 text-center border border-white/5 bg-black/20 h-fit">
                                        <div className="size-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <span className="material-symbols-outlined text-gray-600 text-4xl">inventory_2</span>
                                        </div>
                                        <h3 className="text-xl font-black mb-2">No Orders Found</h3>
                                        <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8 font-medium">Your order history is currently empty. Explore our collection to find your perfect fit.</p>
                                        <button
                                            onClick={() => navigate('/shop')}
                                            className="px-8 py-3 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl"
                                        >
                                            Explore Collection
                                        </button>
                                    </div>
                                ) : (
                                    orders.map((order) => (
                                        <div
                                            key={order.id}
                                            id={`order-${order.id}`}
                                            className={`glass-panel rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border transition-all duration-500 ${highlightOrderId === order.id ? 'border-primary shadow-[0_0_30px_rgba(5,150,105,0.3)] ring-1 ring-primary/50' : 'border-white/5 bg-black/20'}`}
                                        >
                                            {/* Order Header */}
                                            <div className="p-6 md:p-8 bg-white/[0.02] border-b border-white/5 flex flex-col md:flex-row justify-between gap-6">
                                                <div className="flex flex-wrap gap-8">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Order ID</p>
                                                        <p className="text-sm font-black italic tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Order Date</p>
                                                        <p className="text-sm font-bold text-white/80">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Total Amount</p>
                                                        <p className="text-sm font-black text-primary-light">{formatPrice(order.total_amount)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)} animate-pulse-subtle shadow-inner`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="p-6 md:p-8 space-y-6">
                                                {order.order_items?.map((item, idx) => (
                                                    <div key={idx} className="flex gap-6 items-center group">
                                                        <div className="size-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-2 flex-shrink-0 group-hover:border-primary/40 transition-colors">
                                                            <img src={item.products?.images?.[0]} className="w-full h-full object-contain" alt="" />
                                                        </div>
                                                        <div className="flex-grow">
                                                            <h4 className="font-bold text-sm tracking-tight mb-1">{item.products?.name}</h4>
                                                            <div className="flex gap-3 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                                                <span>Qty: {item.quantity}</span>
                                                                <span>•</span>
                                                                <span>{formatPrice(item.price)} each</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-sm font-black italic tracking-tight">{formatPrice(item.price * item.quantity)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Order Footer / Tracking */}
                                            <div className="px-6 md:px-8 py-4 bg-white/[0.01] flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-widest border-t border-white/5">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                                                    <span>Standard Shipping</span>
                                                </div>
                                                <button className="text-primary hover:text-white transition-colors flex items-center gap-2 group">
                                                    Track Order <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="glass-panel rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 border border-white/5 bg-black/20">
                                <h3 className="text-xl font-black mb-8 italic tracking-tight">Profile <span className="text-primary-light">Details</span></h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Email Address</p>
                                        <div className="h-14 flex items-center px-6 rounded-2xl bg-white/[0.03] border border-white/5 text-sm font-bold opacity-60">
                                            {user?.email}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Account Status</p>
                                        <div className="h-14 flex items-center px-6 rounded-2xl bg-green-500/5 border border-green-500/10 text-green-400 text-sm font-black italic uppercase tracking-widest shadow-inner">
                                            Verified Member
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Account Security</p>
                                        <button className="h-14 w-full flex items-center justify-between px-6 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold group hover:border-primary transition-all">
                                            <span>Update Password</span>
                                            <span className="material-symbols-outlined text-gray-600 group-hover:text-primary transition-colors">key</span>
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Communication Channel</p>
                                        <div className="h-14 flex items-center justify-between px-6 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold">
                                            <span>Email Notifications</span>
                                            <div className="size-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div >
            </main >

            <style>{`
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(0.98); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 3s infinite ease-in-out;
                }
            `}</style>
        </div >
    );
};

export default AccountPage;
