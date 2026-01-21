import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';

const AdminDashboard = () => {
    const { formatPrice } = useStoreSettings();
    const navigate = useNavigate();

    // State management for metrics
    const [stats, setStats] = useState({
        totalSales: 0,
        pendingOrders: 0,
        activeCustomers: 0,
        lowStockProducts: 0
    });

    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [dailyRevenue, setDailyRevenue] = useState(new Array(7).fill(0));
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();

        // Real-time subscriptions
        const ordersChannel = supabase
            .channel('dashboard_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchDashboardData())
            .subscribe();

        const profilesChannel = supabase
            .channel('dashboard_profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDashboardData())
            .subscribe();

        const productsChannel = supabase
            .channel('dashboard_products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchDashboardData())
            .subscribe();

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(profilesChannel);
            supabase.removeChannel(productsChannel);
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);

            // 1. Fetch Customers Count
            const { count: customerCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // 2. Fetch Orders Data
            const { data: ordersData } = await supabase
                .from('orders')
                .select(`
                    *,
                    customer:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false });

            // 3. Fetch Low Stock Items (Both products and variations)
            const { data: lowStockProducts } = await supabase
                .from('products')
                .select('id, name, slug, stock, sku')
                .lt('stock', 10)
                .gt('stock', 0);

            const { data: lowStockVariations } = await supabase
                .from('product_variations')
                .select('id, product_id, name, sku, stock, products(name)')
                .lt('stock', 10)
                .gt('stock', 0);

            // Combine and format low stock items
            const combinedLowStock = [
                ...(lowStockProducts || []).map(p => ({
                    name: p.name,
                    sku: p.sku || p.slug?.substring(0, 8).toUpperCase() || 'N/A',
                    quantity: p.stock,
                    type: 'Product',
                    id: p.id
                })),
                ...(lowStockVariations || []).map(v => ({
                    name: `${v.products?.name} - ${v.name}`,
                    sku: v.sku || 'N/A',
                    quantity: v.stock,
                    type: 'Variant',
                    id: v.product_id
                }))
            ].sort((a, b) => a.quantity - b.quantity);

            setLowStockItems(combinedLowStock);

            if (ordersData) {
                const totalRevenue = ordersData.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
                const pendingCount = ordersData.filter(o => o.status === 'Pending' || o.status === 'Processing').length;

                setStats({
                    totalSales: totalRevenue,
                    pendingOrders: pendingCount,
                    activeCustomers: customerCount || 0,
                    lowStockProducts: combinedLowStock.length || 0
                });

                // Set Recent Orders (limit 4)
                const formattedRecent = ordersData.slice(0, 4).map(order => ({
                    id: order.id.substring(0, 4).toUpperCase(),
                    rawId: order.id,
                    customer: order.customer?.full_name || 'Guest',
                    initials: getInitials(order.customer?.full_name || 'G'),
                    time: formatTimeAgo(order.created_at),
                    amount: order.total_amount,
                    status: order.status,
                    statusColor: getStatusColor(order.status)
                }));
                setRecentOrders(formattedRecent);

                // Calculate daily revenue for the last 7 days
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    d.setHours(0, 0, 0, 0);
                    return d;
                }).reverse();

                const revenueByDay = last7Days.map(day => {
                    const nextDay = new Date(day);
                    nextDay.setDate(day.getDate() + 1);

                    return ordersData
                        .filter(order => {
                            const orderDate = new Date(order.created_at);
                            return orderDate >= day && orderDate < nextDay;
                        })
                        .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
                });
                setDailyRevenue(revenueByDay);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
            case 'processing': return 'yellow';
            case 'shipped': return 'blue';
            case 'delivered': return 'green';
            case 'returned': return 'red';
            case 'cancelled': return 'gray';
            default: return 'gray';
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        let interval = Math.floor(seconds / 3600);
        if (interval >= 1) return interval + "h ago";
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return interval + "m ago";
        return "Just now";
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6 md:gap-8 pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-light ring-1 ring-inset ring-primary/30">Nakma House</span>
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest px-2">/ Status Overview</span>
                        </div>
                        <h1 className="text-white text-3xl md:text-5xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Center</span>
                        </h1>
                        <p className="text-gray-400 text-sm md:text-base font-medium mt-2 max-w-xl">
                            Live operational metrics and store performance heartbeat.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="relative hidden md:block group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px] group-focus-within:text-white transition-colors">search</span>
                            <input
                                className="glossy-input w-64 h-12 pl-12 pr-4 rounded-xl text-sm outline-none focus:w-80 transition-all duration-300 placeholder:text-gray-600 focus:ring-1 focus:ring-primary/40"
                                placeholder="Search everything..."
                                type="text"
                            />
                        </div>
                        <button className="flex items-center justify-center rounded-xl size-12 bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5 group relative">
                            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">notifications</span>
                            <span className="absolute top-3 right-3 size-2 bg-primary rounded-full ring-2 ring-black shadow-[0_0_10px_rgba(255,0,127,0.5)]"></span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-4">
                    {/* Total Sales Card */}
                    <button
                        onClick={() => navigate('/admin/analytics')}
                        className="glossy-card p-6 rounded-2xl relative overflow-hidden group border border-white/5 hover:border-primary/30 transition-all text-left block w-full hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/40 transition-colors">
                                <span className="material-symbols-outlined text-primary-light group-hover:scale-110 transition-transform">payments</span>
                            </div>
                            <span className="flex items-center text-[10px] font-black text-green-400 bg-green-400/10 px-2.5 py-1 rounded-lg border border-green-400/20 uppercase tracking-widest group-hover:bg-green-400/20">
                                View Rep.
                                <span className="material-symbols-outlined text-[12px] ml-0.5 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                            </span>
                        </div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Conversion</p>
                        <h3 className="text-2xl font-black text-white tracking-tight">{formatPrice(stats.totalSales)}</h3>
                    </button>

                    {/* Pending Orders Card */}
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="glossy-card p-6 rounded-2xl relative overflow-hidden group border border-white/5 hover:border-orange-500/30 transition-all text-left block w-full hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:bg-orange-500/20 group-hover:border-orange-500/40 transition-colors">
                                <span className="material-symbols-outlined text-orange-400 group-hover:scale-110 transition-transform">pending_actions</span>
                            </div>
                            <span className="flex items-center text-[10px] font-black text-orange-400 bg-orange-400/10 px-2.5 py-1 rounded-lg border border-orange-400/20 uppercase tracking-widest group-hover:bg-orange-400/20">
                                Open All
                                <span className="material-symbols-outlined text-[12px] ml-0.5 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                            </span>
                        </div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Pending Sync</p>
                        <h3 className="text-2xl font-black text-white tracking-tight">{stats.pendingOrders} Orders</h3>
                    </button>

                    {/* Active Customers Card */}
                    <button
                        onClick={() => navigate('/admin/customers')}
                        className="glossy-card p-6 rounded-2xl relative overflow-hidden group border border-white/5 hover:border-blue-500/30 transition-all text-left block w-full hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-colors">
                                <span className="material-symbols-outlined text-blue-400 group-hover:scale-110 transition-transform">group</span>
                            </div>
                            <span className="flex items-center text-[10px] font-black text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-lg border border-blue-400/20 uppercase tracking-widest group-hover:bg-blue-400/20">
                                Manage
                                <span className="material-symbols-outlined text-[12px] ml-0.5 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                            </span>
                        </div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Customer Registry</p>
                        <h3 className="text-2xl font-black text-white tracking-tight">{stats.activeCustomers.toLocaleString()}</h3>
                    </button>

                    {/* Low Stock Card */}
                    <button
                        onClick={() => navigate('/admin/products')}
                        className="glossy-card p-6 rounded-2xl relative overflow-hidden group border border-white/5 hover:border-red-500/30 transition-all text-left block w-full hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all duration-500"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-colors">
                                <span className="material-symbols-outlined text-red-400 group-hover:scale-110 transition-transform">warning</span>
                            </div>
                            <span className="flex items-center text-[10px] font-black text-red-400 bg-red-400/10 px-2.5 py-1 rounded-lg border border-red-400/20 uppercase tracking-widest group-hover:bg-red-400/20">
                                Restock
                                <span className="material-symbols-outlined text-[12px] ml-0.5 group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                            </span>
                        </div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Stock Alerts</p>
                        <h3 className="text-2xl font-black text-white tracking-tight">{stats.lowStockProducts} Critical</h3>
                    </button>
                </div>

                {/* Charts & Table Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 glossy-panel rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 relative border border-white/5 shadow-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-bold">Revenue Metrics</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">7 Day Diagnostic</p>
                            </div>
                            <select className="glossy-input rounded-xl px-4 py-2 text-xs border border-white/10 bg-black/40 outline-none cursor-pointer hover:border-white/30 transition-colors hidden sm:block">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>This Year</option>
                            </select>
                        </div>
                        <div className="flex-1 w-full h-[250px] md:h-[350px] relative flex items-end justify-between gap-1 md:gap-2 px-2 pb-8 border-b border-white/5">
                            <div className="absolute inset-0 grid grid-rows-4 gap-0 pointer-events-none">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="border-t border-dashed border-white/5 w-full h-full"></div>
                                ))}
                            </div>
                            {dailyRevenue.map((rev, i) => {
                                const maxRev = Math.max(...dailyRevenue, 100);
                                const height = (rev / maxRev) * 100;
                                const isToday = i === 6;

                                return (
                                    <div
                                        key={i}
                                        className={`w-full ${isToday ? 'bg-gradient-to-t from-primary via-primary-light to-primary-hover shadow-[0_0_20px_rgba(255,0,127,0.4)]' : 'bg-primary/20 hover:bg-primary/40'} rounded-t-lg transition-all relative group cursor-pointer`}
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                    >
                                        <div className={`absolute -top-10 left-1/2 -translate-x-1/2 ${isToday ? 'bg-primary/90 font-black' : 'bg-black/90'} px-2 py-1.5 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 whitespace-nowrap border border-white/10 shadow-2xl z-20`}>
                                            {formatPrice(rev)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 font-black px-2 uppercase tracking-[0.2em]">
                            {[...Array(7)].map((_, i) => {
                                const d = new Date();
                                d.setDate(d.getDate() - (6 - i));
                                const label = d.toLocaleDateString('en-US', { weekday: 'short' });
                                const isToday = i === 6;
                                return (
                                    <span key={i} className={`w-full text-center ${isToday ? 'text-primary-light font-black' : ''}`}>
                                        {label}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Orders List */}
                    <div className="glossy-panel rounded-[2rem] p-6 md:p-8 relative overflow-hidden flex flex-col border border-white/5 shadow-2xl bg-black/40">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold">Transaction Feed</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Real-time Stream</p>
                            </div>
                            <Link to="/admin/orders" className="admin-button-secondary px-4 py-2 text-[10px] rounded-xl font-black uppercase tracking-widest">View Archives</Link>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar max-h-[400px]">
                            {recentOrders.length > 0 ? recentOrders.map((order, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedOrderId(order.rawId)}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group w-full text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-[10px] font-black text-white shadow-inner group-hover:scale-110 transition-transform">
                                            {order.initials}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-sm font-bold text-white group-hover:text-primary-light transition-colors truncate">{order.customer}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">ORD-{order.id} • {order.time}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-white">{formatPrice(order.amount)}</p>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-${order.statusColor}-500/10 text-${order.statusColor}-400 border border-${order.statusColor}-500/20 mt-1 inline-block`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </button>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                                    <span className="material-symbols-outlined text-4xl mb-2">history</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Recent Activity</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Boxes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <div className="glossy-panel rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
                        <h3 className="text-lg font-bold mb-8">Store Protocols</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Link to="/admin/products/new" className="flex flex-col items-center justify-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-primary/20 border border-white/5 hover:border-primary/30 transition-all group">
                                <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all border border-white/5 shadow-inner scale-100 group-hover:scale-110">
                                    <span className="material-symbols-outlined text-[24px]">add_circle</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white text-center">Catalog Entry</span>
                            </Link>
                            <Link to="/admin/orders" className="flex flex-col items-center justify-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 transition-all group">
                                <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all border border-white/5 shadow-inner scale-100 group-hover:scale-110">
                                    <span className="material-symbols-outlined text-[24px]">package_2</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white text-center">Deployment</span>
                            </Link>
                            <Link to="/admin/categories" className="flex flex-col items-center justify-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-green-500/10 border border-white/5 hover:border-green-500/30 transition-all group">
                                <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all border border-white/5 shadow-inner scale-100 group-hover:scale-110">
                                    <span className="material-symbols-outlined text-[24px]">category</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white text-center">Collection Mgmt</span>
                            </Link>
                            <Link to="/admin/settings" className="flex flex-col items-center justify-center gap-4 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group">
                                <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all border border-white/5 shadow-inner scale-100 group-hover:scale-110">
                                    <span className="material-symbols-outlined text-[24px]">manufacturing</span>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 group-hover:text-white text-center">OS Control</span>
                            </Link>
                        </div>
                    </div>

                    <div className="glossy-panel rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl bg-black/40 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold">Inventory Alerts</h3>
                                <p className="text-xs text-red-500 font-black uppercase tracking-widest">Restock Required</p>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary-light bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 animate-pulse">Critical Priority</span>
                        </div>
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                            {lowStockItems.length > 0 ? lowStockItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => navigate(`/admin/products/edit/${item.id}`)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/5 hover:border-white/10 transition-all w-full text-left"
                                >
                                    <div className="size-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 overflow-hidden relative shadow-inner group-hover:scale-105 transition-transform flex items-center justify-center text-gray-700">
                                        <span className="material-symbols-outlined text-sm">inventory</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${item.type === 'Variant' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-primary/10 text-primary-light border border-primary/20'}`}>
                                                {item.type}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">ID: {item.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-red-500 group-hover:scale-110 transition-transform">{item.quantity} Left</p>
                                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest group-hover:text-white transition-colors">Action Required</span>
                                    </div>
                                </button>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-10 opacity-20">
                                    <span className="material-symbols-outlined text-4xl mb-2">done_all</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Inventory Optimized</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order Details Modal */}
                {selectedOrderId && (
                    <OrderDetailsModal
                        orderId={selectedOrderId}
                        onClose={() => setSelectedOrderId(null)}
                        onUpdate={() => {
                            fetchDashboardData();
                        }}
                    />
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
