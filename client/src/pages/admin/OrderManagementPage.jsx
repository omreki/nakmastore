import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useNotification } from '../../context/NotificationContext';
import CreateOrderModal from '../../components/admin/CreateOrderModal';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';

const OrderManagementPage = () => {
    const { formatPrice } = useStoreSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('last7');

    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const { notify, confirm } = useNotification();
    const [stats, setStats] = useState({
        totalOrders: 0,
        processing: 0,
        returns: 0,
        revenue: 0,
        orderTrend: '+0%',
        revenueTrend: '+0%'
    });

    useEffect(() => {
        fetchOrders();

        // Real-time subscription
        const channel = supabase
            .channel('orders_channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Real-time order change:', payload);
                fetchOrders(); // Refresh all data on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    customer:profiles(id, full_name, email, first_name, last_name),
                    items:order_items(*)
                `)
                .order('created_at', { ascending: false });

            if (error) {
                // If table doesn't exist, we'll get an error. Handle gracefully.
                if (error.code === '42P01') {
                    console.warn('Orders table does not exist yet. Please run server/create_orders.sql');
                    setOrders([]);
                    setIsLoading(false);
                    return;
                }
                throw error;
            }

            const formattedOrders = data.map(order => ({
                id: order.id.substring(0, 8).toUpperCase(),
                rawId: order.id,
                customer: {
                    name: order.customer?.full_name ||
                        `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() ||
                        `${order.shipping_address?.firstName || ''} ${order.shipping_address?.lastName || ''}`.trim() ||
                        'Guest',
                    email: order.customer?.email || order.shipping_address?.email || 'N/A',
                    initials: getInitials(order.customer?.full_name || order.shipping_address?.firstName || 'G'),
                    avatar: 'from-gray-700 to-gray-900'
                },
                date: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                fullDate: new Date(order.created_at),
                fulfillment: order.status,
                fulfillmentColor: getStatusColor(order.status),
                payment: order.payment_status,
                paymentMethod: order.payment_method,
                total: order.total_amount,
                isViewed: order.is_viewed,
                hasAction: order.status === 'Return Requested'
            }));

            setOrders(formattedOrders);
            calculateStats(data);

        } catch (error) {
            console.error('Error fetching orders:', error);
            notify('Failed to fetch orders.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (data) => {
        const totalOrders = data.length;
        const processing = data.filter(o => o.status === 'Processing' || o.status === 'Pending').length;
        const returns = data.filter(o => o.status === 'Return Requested').length;
        const revenue = data.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

        setStats({
            totalOrders: totalOrders.toLocaleString(),
            processing,
            returns,
            revenue,
            orderTrend: '+0%', // Trends would require comparison with previous period
            revenueTrend: '+0%'
        });
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
            case 'processing': return 'yellow';
            case 'shipped': return 'green';
            case 'delivered': return 'blue';
            case 'return requested':
            case 'returned': return 'red';
            case 'cancelled': return 'gray';
            default: return 'gray';
        }
    };

    const getStatusBadge = (status, color) => {
        const colorClasses = {
            yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]',
            green: 'bg-green-500/10 text-green-400 border-green-500/20',
            blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            red: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
            gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        };

        const showPulse = color === 'yellow';
        const showIcon = status === 'Return Requested';

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colorClasses[color]}`}>
                {showPulse && <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse"></span>}
                {showIcon && <span className="material-symbols-outlined text-[14px]">assignment_return</span>}
                {!showPulse && !showIcon && <span className={`size-1.5 rounded-full bg-${color}-400`}></span>}
                {status}
            </span>
        );
    };

    const handleDeleteOrder = async (orderId, e) => {
        if (e) e.stopPropagation();

        const confirmed = await confirm({
            title: 'Delete Order',
            message: 'Are you sure you want to delete this order? This action cannot be undone.',
            confirmLabel: 'Delete Order',
            type: 'danger'
        });

        if (!confirmed) return;

        const originalOrders = [...orders];

        // Optimistic update: Remove immediately from UI
        setOrders(orders.filter(o => o.rawId !== orderId));

        try {
            // 1. Delete order items first (manual cascade to be safe)
            const { error: itemsError } = await supabase
                .from('order_items')
                .delete()
                .eq('order_id', orderId);

            if (itemsError) {
                console.warn('Error deleting items (might allow cascade):', itemsError);
                // Continue trying to delete the order anyway, in case of cascade or no items
            }

            // 2. Delete the order
            const { data, error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                // If no data returned, it means no row was deleted (RLS or not found)
                throw new Error('Order could not be deleted. Check permissions or if order exists.');
            }

            notify('Order deleted successfully.', 'success');
            // re-fetch to ensure sync (optional since we did optimistic update)
            // fetchOrders(); 
        } catch (error) {
            console.error('Error deleting order:', error);
            // Revert optimistic update
            setOrders(originalOrders);
            notify(`Failed to delete order: ${error.message}`, 'error');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.fulfillment.toLowerCase() === statusFilter.toLowerCase();

        // Date filter logic (simple implementation)
        const now = new Date();
        const orderDate = new Date(order.fullDate);
        let matchesDate = true;

        if (dateFilter === 'last7') {
            const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
            matchesDate = orderDate >= sevenDaysAgo;
        } else if (dateFilter === 'last30') {
            const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
            matchesDate = orderDate >= thirtyDaysAgo;
        } else if (dateFilter === 'month') {
            matchesDate = orderDate.getMonth() === new Date().getMonth() && orderDate.getFullYear() === new Date().getFullYear();
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 pb-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm">
                                Order Center
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ Orders</span>
                        </div>
                        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Order <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Management</span>
                        </h1>
                        <p className="text-gray-400 text-base font-medium mt-2 max-w-xl">
                            Monitor and process your collection orders and customer purchases.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="hidden md:flex items-center justify-center rounded-xl h-12 bg-white/5 hover:bg-white/10 text-white gap-2 text-sm font-bold tracking-wide px-6 transition-all border border-white/10 group">
                            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">download</span> Export
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-[#59000a] to-[#7a000e] hover:to-[#8a0010] text-white px-6 h-12 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(89,0,10,0.4)] border border-white/10 hover:-translate-y-0.5"
                        >
                            <span className="material-symbols-outlined">add</span> Create Order
                        </button>
                    </div>
                </div>



                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="glossy-panel rounded-2xl p-5 flex flex-col justify-between h-36 relative overflow-hidden group border border-white/5 bg-black/20 hover:border-white/10 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
                            <span className="material-symbols-outlined text-6xl text-white">shopping_bag</span>
                        </div>
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total Orders</span>
                        <div className="flex items-end justify-between relative z-10">
                            <span className="text-3xl font-black text-white tracking-tight">{stats.totalOrders}</span>
                            <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                                <span className="material-symbols-outlined text-[12px] mr-1">trending_up</span> {stats.orderTrend}
                            </div>
                        </div>
                    </div>

                    <div className="glossy-panel rounded-2xl p-5 flex flex-col justify-between h-36 relative overflow-hidden group border border-white/5 bg-black/20 hover:border-white/10 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="material-symbols-outlined text-6xl text-yellow-500">pending</span>
                        </div>
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Processing</span>
                        <div className="flex items-end justify-between relative z-10">
                            <span className="text-3xl font-black text-white tracking-tight">{stats.processing}</span>
                            <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-gray-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                                ACTIVE
                            </div>
                        </div>
                    </div>

                    <div className="glossy-panel rounded-2xl p-5 flex flex-col justify-between h-36 relative overflow-hidden group border border-white/5 bg-black/20 hover:border-white/10 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="material-symbols-outlined text-6xl text-red-500">assignment_return</span>
                        </div>
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Returns</span>
                        <div className="flex items-end justify-between relative z-10">
                            <span className="text-3xl font-black text-white tracking-tight">{stats.returns}</span>
                            <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-gray-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                                ACTION REQ.
                            </div>
                        </div>
                    </div>

                    <div className="glossy-panel rounded-2xl p-5 flex flex-col justify-between h-36 relative overflow-hidden group border border-white/5 bg-black/20 hover:border-white/10 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
                            <span className="material-symbols-outlined text-6xl text-green-500">payments</span>
                        </div>
                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Revenue</span>
                        <div className="flex items-end justify-between relative z-10">
                            <span className="text-3xl font-black text-white tracking-tight">{formatPrice(stats.revenue)}</span>
                            <div className="flex items-center text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                                <span className="material-symbols-outlined text-[12px] mr-1">trending_up</span> {stats.revenueTrend}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2 px-0.5">
                    <div className="relative w-full md:w-[480px] group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors duration-300">search</span>
                        <input
                            className="glossy-input w-full rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-gray-600 bg-black/40 border-white/5 text-white"
                            placeholder="Find orders by ID, Customer name, or Email..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <div className="relative group">
                            <select
                                className="glossy-panel appearance-none pl-5 pr-12 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 bg-black/20 border border-white/10 transition-all"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option className="bg-[#1a1a1a]" value="all">Status: All</option>
                                <option className="bg-[#1a1a1a]" value="processing">Processing</option>
                                <option className="bg-[#1a1a1a]" value="shipped">Shipped</option>
                                <option className="bg-[#1a1a1a]" value="delivered">Delivered</option>
                                <option className="bg-[#1a1a1a]" value="returned">Returned</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-xl group-hover:text-white transition-colors">expand_more</span>
                        </div>
                        <div className="relative group">
                            <select
                                className="glossy-panel appearance-none pl-5 pr-12 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 bg-black/20 border border-white/10 transition-all"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            >
                                <option className="bg-[#1a1a1a]" value="last7">Filter: Last 7D</option>
                                <option className="bg-[#1a1a1a]" value="last30">Filter: Last 30D</option>
                                <option className="bg-[#1a1a1a]" value="month">This Month</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-xl group-hover:text-white transition-colors">calendar_today</span>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="glossy-panel rounded-[2.5rem] w-full overflow-hidden flex flex-col border border-white/5 bg-black/20 shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-white/[0.03] text-gray-500 font-black text-[10px] uppercase tracking-widest border-b border-white/10">
                                    <th className="p-7">Order</th>
                                    <th className="p-7">Customer</th>
                                    <th className="p-7">Date</th>
                                    <th className="p-7">Status</th>
                                    <th className="p-7">Payment</th>
                                    <th className="p-7 text-right">Total</th>
                                    <th className="p-7 text-right pr-12">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Fetching Orders...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-20 text-center">
                                            <div className="flex flex-col items-center opacity-30">
                                                <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                                                <p className="text-white font-black text-lg uppercase tracking-widest">No Sequences Found</p>
                                                <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Ready for your first sale</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.rawId} className="group hover:bg-white/[0.03] transition-all duration-300 cursor-pointer">
                                            <td className="p-7">
                                                <button
                                                    onClick={() => setSelectedOrderId(order.rawId)}
                                                    className="font-black text-white font-display hover:text-primary transition-colors text-lg flex items-center gap-1"
                                                >
                                                    <span className="text-gray-600 text-sm font-medium">#</span>{order.id}
                                                    {!order.isViewed && (
                                                        <span className="ml-2 px-1.5 py-0.5 rounded-md bg-primary text-[8px] font-black text-white uppercase tracking-tighter animate-pulse shadow-[0_0_8px_rgba(89,0,10,0.4)]">
                                                            NEW
                                                        </span>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-7">
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-11 rounded-2xl bg-gradient-to-br ${order.customer.avatar} flex items-center justify-center text-xs font-black text-white border border-white/10 shadow-2xl transition-transform duration-500 group-hover:rotate-12`}>
                                                        {order.customer.initials}
                                                    </div>
                                                    <div className="flex flex-col max-w-[180px]">
                                                        <span className="text-white font-bold group-hover:text-primary-light transition-colors truncate">{order.customer.name}</span>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight truncate">{order.customer.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-7">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-300 font-medium">{order.date}</span>
                                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">UTC: {new Date(order.fullDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="p-7">
                                                {getStatusBadge(order.fulfillment, order.fulfillmentColor)}
                                            </td>
                                            <td className="p-7">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-[18px] ${order.payment === 'Paid' ? 'text-green-500' : 'text-gray-500'}`}>
                                                        {order.payment === 'Paid' ? 'verified' : 'pending'}
                                                    </span>
                                                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">{order.payment}</span>
                                                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-tighter ml-1 opacity-60">
                                                        ({order.paymentMethod === 'paystack' ? 'Mpesa' :
                                                            order.paymentMethod === 'stripe' ? 'Stripe' :
                                                                order.paymentMethod === 'cod' ? 'COD' :
                                                                    order.paymentMethod || 'N/A'})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-7 font-black text-white text-lg tracking-tighter">{formatPrice(order.total)}</td>
                                            <td className="p-7 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-100 transition-all duration-300">
                                                    {order.hasAction ? (
                                                        <button className="bg-primary/95 hover:bg-white text-white hover:text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-xl shadow-primary/20 scale-110">
                                                            Resolve
                                                        </button>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button className="p-3 rounded-2xl hover:bg-white/10 text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/10">
                                                                <span className="material-symbols-outlined text-[20px]">print</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteOrder(order.rawId, e)}
                                                                className="p-3 rounded-2xl hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                                                                title="Delete Order"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedOrderId(order.rawId)}
                                                                className="p-3 rounded-2xl hover:bg-white/10 text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-8 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] whitespace-nowrap">
                                Viewing <span className="text-white">{filteredOrders.length}</span> active orders
                            </span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                className="glossy-panel h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 border border-white/5 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                                disabled
                            >
                                <span className="material-symbols-outlined text-[18px] mr-2">arrow_back</span> Prev
                            </button>
                            <button
                                className="glossy-panel h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 border border-white/5 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center font-black"
                                disabled
                            >
                                Next <span className="material-symbols-outlined text-[18px] ml-2 font-black">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Create Order Modal */}
                {showCreateModal && (
                    <CreateOrderModal
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            setShowCreateModal(false);
                            notify('Order created successfully.', 'success');
                            fetchOrders();
                        }}
                    />
                )}

                {/* Order Details Modal */}
                {selectedOrderId && (
                    <OrderDetailsModal
                        orderId={selectedOrderId}
                        onClose={() => setSelectedOrderId(null)}
                        onUpdate={() => {
                            fetchOrders();
                        }}
                    />
                )}

                {/* System Integrity Check */}
                <div className="flex flex-col md:flex-row items-center justify-between px-4 pt-10 gap-4 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <div className="flex gap-8">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-tighter text-gray-600">Sync Status</span>
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Global Live</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-tighter text-gray-600">Integrations</span>
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Stripe • DHL • Twilio</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">© 2026 Nakma Store • All Rights Reserved</p>
                </div>
            </div>
        </AdminLayout >
    );
};

export default OrderManagementPage;
