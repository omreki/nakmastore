import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useNotification } from '../../context/NotificationContext';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    Cell, PieChart, Pie
} from 'recharts';
import {
    TrendingUp, Users, MousePointer2, ShoppingCart,
    Timer, Eye, Package, ArrowUpRight, ArrowDownRight,
    FileText, Activity
} from 'lucide-react';

const AnalyticsPage = () => {
    const { formatPrice } = useStoreSettings();
    const { notify, confirm } = useNotification();
    const reportRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState('date'); // 'lifetime', 'year', 'month', 'date'
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [stats, setStats] = useState({
        totalVisits: 0,
        uniqueVisitors: 0,
        conversionRate: 0,
        avgSessionDuration: 0,
        abandonedCarts: 0,
        checkoutStarts: 0,
        interactionCount: 0
    });

    const [visitData, setVisitData] = useState([]);
    const [popularPages, setPopularPages] = useState([]);
    const [interactionData, setInteractionData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [topElements, setTopElements] = useState([]);
    const [conversionData, setConversionData] = useState([]);

    useEffect(() => {
        fetchAnalyticsData();

        // Real-time subscription
        const channel = supabase
            .channel('analytics_realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'analytics_events'
            }, () => {
                fetchAnalyticsData(); // Refresh on new event
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [filterType, selectedDate]);

    const fetchAnalyticsData = async () => {
        try {
            setIsLoading(true);

            let startDate, endDate, prevStartDate, prevEndDate;
            const now = new Date();
            const year = parseInt(selectedDate.split('-')[0]);
            const month = parseInt(selectedDate.split('-')[1]) - 1;
            const day = parseInt(selectedDate.split('-')[2]);

            if (filterType === 'lifetime') {
                startDate = new Date(0); // Epoch
                endDate = new Date();
                // For Lifetime, comparison is hard, maybe vs same period last lifetime? 
                // Let's just use empty for trends or compare to previous year
                prevStartDate = new Date(0);
                prevEndDate = new Date(0);
            } else if (filterType === 'year') {
                startDate = new Date(year, 0, 1);
                endDate = new Date(year + 1, 0, 1);
                prevStartDate = new Date(year - 1, 0, 1);
                prevEndDate = new Date(year, 0, 1);
            } else if (filterType === 'month') {
                startDate = new Date(year, month, 1);
                endDate = new Date(year, month + 1, 1);
                prevStartDate = new Date(year, month - 1, 1);
                prevEndDate = new Date(year, month, 1);
            } else if (filterType === 'date') {
                startDate = new Date(year, month, day);
                endDate = new Date(year, month, day + 1);
                prevStartDate = new Date(year, month, day - 1);
                prevEndDate = new Date(year, month, day);
            }

            const startDateISO = startDate.toISOString();
            const endDateISO = endDate.toISOString();
            const prevStartDateISO = prevStartDate.toISOString();
            const prevEndDateISO = prevEndDate.toISOString();

            // 1. Fetch Current Period Data
            const { data: events, error: eventsError } = await supabase
                .from('analytics_events')
                .select('*')
                .gte('created_at', startDateISO)
                .lt('created_at', endDateISO);

            if (eventsError) throw eventsError;

            const { data: orders, error: ordersError } = await supabase
                .from('orders')
                .select('created_at, total_amount')
                .gte('created_at', startDateISO)
                .lt('created_at', endDateISO);

            if (ordersError) throw ordersError;

            // 2. Fetch Previous Period Data for Trends
            let prevEvents = [];
            let prevOrders = [];

            if (filterType !== 'lifetime') {
                const { data: pe } = await supabase
                    .from('analytics_events')
                    .select('*')
                    .gte('created_at', prevStartDateISO)
                    .lt('created_at', prevEndDateISO);
                prevEvents = pe || [];

                const { data: po } = await supabase
                    .from('orders')
                    .select('created_at')
                    .gte('created_at', prevStartDateISO)
                    .lt('created_at', prevEndDateISO);
                prevOrders = po || [];
            }

            // 3. Process Current Session Duration
            const sessionTimes = {};
            events.forEach(e => {
                const time = new Date(e.created_at).getTime();
                if (!sessionTimes[e.session_id]) {
                    sessionTimes[e.session_id] = { start: time, end: time };
                } else {
                    sessionTimes[e.session_id].start = Math.min(sessionTimes[e.session_id].start, time);
                    sessionTimes[e.session_id].end = Math.max(sessionTimes[e.session_id].end, time);
                }
            });

            const durations = Object.values(sessionTimes).map(s => (s.end - s.start) / 1000);
            const totalDuration = durations.reduce((a, b) => a + b, 0);
            const avgSeconds = durations.length > 0 ? totalDuration / durations.length : 0;

            // 4. Process Previous Session Duration
            const prevSessionTimes = {};
            (prevEvents || []).forEach(e => {
                const time = new Date(e.created_at).getTime();
                if (!prevSessionTimes[e.session_id]) {
                    prevSessionTimes[e.session_id] = { start: time, end: time };
                } else {
                    prevSessionTimes[e.session_id].start = Math.min(prevSessionTimes[e.session_id].start, time);
                    prevSessionTimes[e.session_id].end = Math.max(prevSessionTimes[e.session_id].end, time);
                }
            });
            const prevDurations = Object.values(prevSessionTimes).map(s => (s.end - s.start) / 1000);
            const prevAvgSeconds = prevDurations.length > 0 ? prevDurations.reduce((a, b) => a + b, 0) / prevDurations.length : 0;

            const calculateTrend = (curr, prev) => {
                if (!prev || prev === 0) return curr > 0 ? '+100%' : '0%';
                const diff = ((curr - prev) / prev) * 100;
                return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
            };

            const formatDuration = (s) => {
                if (s < 60) return `${Math.round(s)}s`;
                const m = Math.floor(s / 60);
                const rs = Math.round(s % 60);
                return `${m}m ${rs}s`;
            };

            // 5. Build Stats object with Real Trends
            const currentVisits = events.filter(e => e.event_type === 'page_view').length;
            const prevVisits = (prevEvents || []).filter(e => e.event_type === 'page_view').length;

            // Use persistent_id for unique devices, fallback to session_id for older events
            const currentUniqueDevices = new Set(events.map(e => e.persistent_id || e.session_id)).size;
            const prevUniqueDevices = new Set((prevEvents || []).map(e => e.persistent_id || e.session_id)).size;

            const currentUsers = Object.keys(sessionTimes).length; // Unique Sessions

            const currentCR = currentUniqueDevices > 0 ? (orders.length / currentUniqueDevices) * 100 : 0;
            const prevCR = prevUniqueDevices > 0 ? ((prevOrders?.length || 0) / prevUniqueDevices) * 100 : 0;

            const cartAdds = events.filter(e => e.event_name === 'Add to Cart').length;
            const checkoutStarts = events.filter(e => e.event_name === 'Checkout Start').length;
            const purchaseCompletes = orders.length;

            setStats({
                totalVisits: currentVisits,
                totalVisitsTrend: calculateTrend(currentVisits, prevVisits),
                uniqueVisitors: currentUniqueDevices,
                uniqueVisitorsTrend: calculateTrend(currentUniqueDevices, prevUniqueDevices),
                conversionRate: currentCR.toFixed(1),
                conversionRateTrend: calculateTrend(currentCR, prevCR),
                avgSessionDuration: formatDuration(avgSeconds),
                avgSessionDurationTrend: calculateTrend(avgSeconds, prevAvgSeconds),
                abandonedCarts: Math.max(0, checkoutStarts - purchaseCompletes),
                uniqueSessions: currentUsers,
                checkoutStarts,
                purchaseCompletes,
                cartAdds,
                interactionCount: events.filter(e => e.event_type === 'click' || e.event_type === 'interaction' || e.event_type === 'link_click').length
            });

            // 6. Time series data with dynamic grouping and gap filling
            const timeSeriesMap = {};

            // Pre-fill buckets for a cleaner chart (ensures zero values are shown)
            if (filterType === 'date') {
                for (let i = 0; i < 24; i++) {
                    const h = i.toString().padStart(2, '0');
                    timeSeriesMap[h] = { key: h, date: `${h}:00`, visits: 0, interactions: 0, sortKey: i };
                }
            } else if (filterType === 'month') {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    const d = i.toString().padStart(2, '0');
                    const label = new Date(year, month, i).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    timeSeriesMap[d] = { key: d, date: label, visits: 0, interactions: 0, sortKey: i };
                }
            } else if (filterType === 'year') {
                for (let i = 0; i < 12; i++) {
                    const m = i.toString().padStart(2, '0');
                    const label = new Date(year, i, 1).toLocaleDateString([], { month: 'short' });
                    timeSeriesMap[m] = { key: m, date: label, visits: 0, interactions: 0, sortKey: i };
                }
            }

            events.forEach(e => {
                const dateObj = new Date(e.created_at);
                let key, label;

                if (filterType === 'date') {
                    key = dateObj.getHours().toString().padStart(2, '0');
                } else if (filterType === 'month') {
                    key = dateObj.getDate().toString().padStart(2, '0');
                } else if (filterType === 'year') {
                    key = dateObj.getMonth().toString().padStart(2, '0');
                } else {
                    key = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
                    label = dateObj.toLocaleDateString([], { month: 'short', year: '2-digit' });
                }

                if (!timeSeriesMap[key]) {
                    timeSeriesMap[key] = {
                        key,
                        date: label || key,
                        visits: 0,
                        interactions: 0,
                        sortKey: dateObj.getTime()
                    };
                }

                if (e.event_type === 'page_view') {
                    timeSeriesMap[key].visits++;
                } else {
                    timeSeriesMap[key].interactions++;
                }
            });

            setVisitData(Object.values(timeSeriesMap).sort((a, b) => a.sortKey - b.sortKey));

            // 7. Popular Pages
            const pageStats = events.filter(e => e.event_type === 'page_view').reduce((acc, curr) => {
                const path = curr.event_name || curr.page_url;
                acc[path] = (acc[path] || 0) + 1;
                return acc;
            }, {});

            setPopularPages(Object.entries(pageStats)
                .map(([name, visits]) => ({ name, visits }))
                .sort((a, b) => b.visits - a.visits)
                .slice(0, 5));

            // 8. Top Products Viewed
            const productViews = events.filter(e => e.event_type === 'product_view');
            const productStats = productViews.reduce((acc, curr) => {
                const name = curr.event_name;
                acc[name] = (acc[name] || 0) + 1;
                return acc;
            }, {});

            setTopProducts(Object.entries(productStats)
                .map(([name, views]) => ({ name, views }))
                .sort((a, b) => b.views - a.views)
                .slice(0, 5));

            // 9. Recent Interactions
            const recentInts = events
                .filter(e => e.event_type === 'click' || e.event_type === 'interaction' || e.event_type === 'link_click')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
                .map(e => ({
                    time: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    event: e.event_name,
                    page: e.page_url?.replace(window.location.host, '') || '/'
                }));
            setInteractionData(recentInts);

            // 10. Top Interacted Elements
            const elementStats = events
                .filter(e => e.event_type === 'click' || e.event_type === 'link_click')
                .reduce((acc, curr) => {
                    const name = curr.event_name;
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                }, {});

            setTopElements(Object.entries(elementStats)
                .map(([name, clicks]) => ({ name, clicks }))
                .sort((a, b) => b.clicks - a.clicks)
                .slice(0, 5));

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary-light ring-1 ring-inset ring-primary/30">Admin Only</span>
                            <span className="text-gray-500 text-sm font-medium">/ Shop Intelligence</span>
                        </div>
                        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                            Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-white to-gray-500">Analytics</span>
                        </h1>
                        <p className="text-gray-400 text-base font-medium mt-2 max-w-xl">
                            Real-time insights into customer behavior and store performance.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Master Filter Selection */}
                            <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                                {[
                                    { id: 'lifetime', label: 'Lifetime' },
                                    { id: 'year', label: 'Yearly' },
                                    { id: 'month', label: 'Monthly' },
                                    { id: 'date', label: 'Daily' }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setFilterType(type.id)}
                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type.id
                                            ? 'bg-primary text-white shadow-xl shadow-primary/20'
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* Filter Modifiers */}
                            {filterType !== 'lifetime' && (
                                <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                                    {filterType === 'date' ? (
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer"
                                        />
                                    ) : (
                                        <div className="flex gap-2">
                                            {/* Year Selector */}
                                            <select
                                                value={selectedDate.split('-')[0]}
                                                onChange={(e) => {
                                                    const parts = selectedDate.split('-');
                                                    setSelectedDate(`${e.target.value}-${parts[1]}-${parts[2]}`);
                                                }}
                                                className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer"
                                            >
                                                {[2024, 2025, 2026].map(y => (
                                                    <option key={y} value={y} className="bg-black">{y}</option>
                                                ))}
                                            </select>

                                            {/* Month Selector */}
                                            {filterType === 'month' && (
                                                <select
                                                    value={selectedDate.split('-')[1]}
                                                    onChange={(e) => {
                                                        const parts = selectedDate.split('-');
                                                        setSelectedDate(`${parts[0]}-${e.target.value}-${parts[2]}`);
                                                    }}
                                                    className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer border-l border-white/10"
                                                >
                                                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                                                        <option key={m} value={m} className="bg-black">
                                                            {new Date(2000, parseInt(m) - 1).toLocaleString('default', { month: 'long' })}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Report Content Wrapper */}
                <div ref={reportRef} id="analytics-report-area" className="flex flex-col gap-8">

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="Total Visits"
                            value={stats.totalVisits.toLocaleString()}
                            icon={<Eye className="size-5" />}
                            trend={stats.totalVisitsTrend}
                            isPositive={!stats.totalVisitsTrend?.startsWith('-')}
                        />
                        <MetricCard
                            title="Unique Visitors"
                            value={stats.uniqueVisitors.toLocaleString()}
                            icon={<Users className="size-5" />}
                            trend={stats.uniqueVisitorsTrend}
                            isPositive={!stats.uniqueVisitorsTrend?.startsWith('-')}
                        />
                        <MetricCard
                            title="Conversion Rate"
                            value={`${stats.conversionRate}%`}
                            icon={<TrendingUp className="size-5" />}
                            trend={stats.conversionRateTrend}
                            isPositive={!stats.conversionRateTrend?.startsWith('-')}
                        />
                        <MetricCard
                            title="Avg. Time Spent"
                            value={stats.avgSessionDuration}
                            icon={<Timer className="size-5" />}
                            trend={stats.avgSessionDurationTrend}
                            isPositive={!stats.avgSessionDurationTrend?.startsWith('-')}
                        />
                    </div>

                    {/* Main Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Traffic Overview */}
                        <div className="lg:col-span-2 glossy-panel rounded-[2rem] p-8 border border-white/5 shadow-2xl bg-black/40">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-white">Traffic Overview</h3>
                                    <p className="text-sm text-gray-500">Page views vs User interactions</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="size-3 rounded-full bg-primary shadow-[0_0_10px_rgba(89,0,10,0.5)]"></div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page Views</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="size-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Interactions</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={visitData}>
                                        <defs>
                                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#59000a" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#59000a" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff10', borderRadius: '12px', fontSize: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="visits" stroke="#59000a" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                                        <Area type="monotone" dataKey="interactions" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorInteractions)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Funnel / Conversion */}
                        <div className="glossy-panel rounded-[2rem] p-8 border border-white/5 shadow-2xl bg-black/40 flex flex-col">
                            <h3 className="text-xl font-black text-white mb-2">Checkout Funnel</h3>
                            <p className="text-sm text-gray-500 mb-8">Purchase journey drop-offs</p>

                            <div className="flex-1 space-y-6">
                                <FunnelStep
                                    label="Cart Additions"
                                    value={stats.cartAdds}
                                    percentage={100}
                                    color="bg-gray-500"
                                />
                                <FunnelStep
                                    label="Checkout Started"
                                    value={stats.checkoutStarts}
                                    percentage={stats.cartAdds > 0 ? (stats.checkoutStarts / stats.cartAdds) * 100 : 0}
                                    color="bg-orange-500"
                                />
                                <FunnelStep
                                    label="Purchase Completed"
                                    value={stats.purchaseCompletes}
                                    percentage={stats.checkoutStarts > 0 ? (stats.purchaseCompletes / stats.checkoutStarts) * 100 : 0}
                                    color="bg-green-500"
                                />

                                <div className="mt-10 p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-black text-red-500 uppercase tracking-widest">Abandoned Carts</span>
                                        <Package className="size-4 text-red-500" />
                                    </div>
                                    <h4 className="text-3xl font-black text-white">{stats.abandonedCarts}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold mt-1">Users left without completing purchase</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Popular Pages */}
                        <div className="glossy-panel rounded-[2rem] p-8 border border-white/5 shadow-2xl bg-black/40">
                            <h3 className="text-xl font-black text-white mb-6">Popular Pages</h3>
                            <div className="space-y-4">
                                {popularPages.map((page, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-black text-gray-600 w-4">0{idx + 1}</span>
                                            <span className="text-sm font-bold text-white tracking-tight line-clamp-1">{page.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-white">{page.visits}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Products Viewed */}
                        <div className="glossy-panel rounded-[2rem] p-8 border border-white/5 shadow-2xl bg-black/40">
                            <h3 className="text-xl font-black text-white mb-6">Top Products</h3>
                            <div className="space-y-4">
                                {topProducts.length > 0 ? topProducts.map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary-light border border-primary/20">
                                                <Package className="size-4" />
                                            </div>
                                            <span className="text-sm font-bold text-white tracking-tight line-clamp-1">{product.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-white">{product.views} views</span>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 opacity-30">
                                        <Package className="size-10 mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No products viewed</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Interacted Elements */}
                        <div className="glossy-panel rounded-[2rem] p-8 border border-white/5 shadow-2xl bg-black/40">
                            <h3 className="text-xl font-black text-white mb-6">Top Elements</h3>
                            <div className="space-y-4">
                                {topElements.length > 0 ? topElements.map((el, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                                <MousePointer2 className="size-4" />
                                            </div>
                                            <span className="text-sm font-bold text-white tracking-tight line-clamp-1">{el.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-white">{el.clicks} clicks</span>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 opacity-30">
                                        <MousePointer2 className="size-10 mx-auto mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No interactions</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Interactions */}
                        <div className="glossy-panel rounded-[2rem] p-8 border border-white/5 shadow-2xl bg-black/40">
                            <h3 className="text-xl font-black text-white mb-6">Live Feed</h3>
                            <div className="space-y-3 h-[280px] overflow-y-auto custom-scrollbar pr-2">
                                {interactionData.length > 0 ? (
                                    interactionData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all mb-2">
                                            <div className="flex items-center gap-4">
                                                <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                                    <MousePointer2 className="size-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white tracking-tight line-clamp-1">{item.event}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.page}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-black text-gray-400 shrink-0">{item.time}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 opacity-50">
                                        <MousePointer2 className="size-12 text-gray-700 mx-auto mb-4" />
                                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">No recent interactions</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

const MetricCard = ({ title, value, icon, trend, isPositive }) => (
    <div className="glossy-card p-6 rounded-2xl relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all duration-300">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>
        <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-primary-light">
                {icon}
            </div>
            <span className={`flex items-center text-[10px] font-black ${isPositive ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'} px-2.5 py-1 rounded-lg border ${isPositive ? 'border-green-400/20' : 'border-red-400/20'} uppercase tracking-widest`}>
                {trend}
                {isPositive ? <ArrowUpRight className="size-3 ml-0.5" /> : <ArrowDownRight className="size-3 ml-0.5" />}
            </span>
        </div>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
    </div>
);

const FunnelStep = ({ label, value, percentage, color }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-end">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-bold text-white">{Math.round(value).toLocaleString()}</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
            <div
                className={`h-full ${color} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
        <div className="flex justify-end">
            <span className="text-[10px] font-black text-gray-600">{Math.round(percentage)}% drop-through</span>
        </div>
    </div>
)

export default AnalyticsPage;
