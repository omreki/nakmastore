import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    FileText, Activity, CreditCard
} from 'lucide-react';

const AnalyticsPage = () => {
    const { formatPrice } = useStoreSettings();
    const navigate = useNavigate();
    const { notify } = useNotification();
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
                fetchAnalyticsData();
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
            const year = parseInt(selectedDate.split('-')[0]);
            const month = parseInt(selectedDate.split('-')[1]) - 1;
            const day = parseInt(selectedDate.split('-')[2]);

            if (filterType === 'lifetime') {
                startDate = new Date(0);
                endDate = new Date();
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

            // Fetch Current Period
            const { data: events, error: eventsError } = await supabase
                .from('analytics_events')
                .select('*')
                .gte('created_at', startDateISO)
                .lt('created_at', endDateISO);

            if (eventsError) throw eventsError;

            const { data: orders } = await supabase
                .from('orders')
                .select('created_at, total_amount')
                .gte('created_at', startDateISO)
                .lt('created_at', endDateISO);

            // Fetch Previous Period for Trends
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

            // Process Stats
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

            const currentVisits = events.filter(e => e.event_type === 'page_view').length;
            const prevVisits = (prevEvents || []).filter(e => e.event_type === 'page_view').length;

            const currentUniqueDevices = new Set(events.map(e => e.persistent_id || e.session_id)).size;
            const prevUniqueDevices = new Set((prevEvents || []).map(e => e.persistent_id || e.session_id)).size;

            const currentCR = currentUniqueDevices > 0 ? ((orders?.length || 0) / currentUniqueDevices) * 100 : 0;
            const prevCR = prevUniqueDevices > 0 ? ((prevOrders?.length || 0) / prevUniqueDevices) * 100 : 0;

            const cartAdds = events.filter(e => e.event_name === 'Add to Cart' || e.event_name === 'Add to Bag').length;
            const checkoutStarts = events.filter(e => e.event_name === 'Checkout Start').length;
            const purchaseCompletes = orders?.length || 0;

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
                uniqueSessions: Object.keys(sessionTimes).length,
                checkoutStarts,
                purchaseCompletes,
                cartAdds,
                interactionCount: events.filter(e => ['click', 'interaction', 'link_click'].includes(e.event_type)).length
            });

            // Time series data
            const timeSeriesMap = {};
            if (filterType === 'date') {
                for (let i = 0; i < 24; i++) {
                    const h = i.toString().padStart(2, '0');
                    timeSeriesMap[h] = { date: `${h}:00`, visits: 0, interactions: 0, sortKey: i };
                }
            } else if (filterType === 'month') {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    const d = i.toString().padStart(2, '0');
                    const label = new Date(year, month, i).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    timeSeriesMap[d] = { date: label, visits: 0, interactions: 0, sortKey: i };
                }
            } else if (filterType === 'year') {
                for (let i = 0; i < 12; i++) {
                    const m = i.toString().padStart(2, '0');
                    const label = new Date(year, i, 1).toLocaleDateString([], { month: 'short' });
                    timeSeriesMap[m] = { date: label, visits: 0, interactions: 0, sortKey: i };
                }
            }

            events.forEach(e => {
                const dateObj = new Date(e.created_at);
                let key;
                if (filterType === 'date') key = dateObj.getHours().toString().padStart(2, '0');
                else if (filterType === 'month') key = dateObj.getDate().toString().padStart(2, '0');
                else if (filterType === 'year') key = dateObj.getMonth().toString().padStart(2, '0');
                else key = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

                if (!timeSeriesMap[key]) {
                    timeSeriesMap[key] = {
                        date: key,
                        visits: 0,
                        interactions: 0,
                        sortKey: dateObj.getTime()
                    };
                }

                if (e.event_type === 'page_view') timeSeriesMap[key].visits++;
                else timeSeriesMap[key].interactions++;
            });

            setVisitData(Object.values(timeSeriesMap).sort((a, b) => a.sortKey - b.sortKey));

            // Popular Pages
            const pageStats = events.filter(e => e.event_type === 'page_view').reduce((acc, curr) => {
                const path = curr.event_name || curr.page_url;
                acc[path] = (acc[path] || 0) + 1;
                return acc;
            }, {});
            setPopularPages(Object.entries(pageStats).map(([name, visits]) => ({ name, visits })).sort((a, b) => b.visits - a.visits).slice(0, 5));

            // Top Products
            const productStats = events.filter(e => e.event_type === 'product_view').reduce((acc, curr) => {
                const name = curr.event_name;
                acc[name] = (acc[name] || 0) + 1;
                return acc;
            }, {});
            setTopProducts(Object.entries(productStats).map(([name, views]) => ({ name, views })).sort((a, b) => b.views - a.views).slice(0, 5));

            // Top Elements
            const elementStats = events.filter(e => ['click', 'link_click'].includes(e.event_type)).reduce((acc, curr) => {
                const name = curr.event_name;
                acc[name] = (acc[name] || 0) + 1;
                return acc;
            }, {});
            setTopElements(Object.entries(elementStats).map(([name, clicks]) => ({ name, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 5));

            // Interaction feed
            setInteractionData(events.filter(e => ['click', 'interaction', 'link_click'].includes(e.event_type))
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
                .map(e => ({
                    time: new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    event: e.event_name,
                    page: e.page_url?.replace(window.location.host, '') || '/'
                })));

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6 md:gap-8 pb-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-light ring-1 ring-inset ring-primary/30">Intelligence Center</span>
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest px-2">/ Kinetic Data</span>
                        </div>
                        <h1 className="text-white text-3xl md:text-5xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Network <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light via-white to-gray-500 font-black">Analytics</span>
                        </h1>
                        <p className="text-gray-400 text-sm md:text-base font-medium mt-2 max-w-xl">
                            Visualizing customer flow and operational efficiency in real-time.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex flex-col sm:flex-row gap-3 p-1.5 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
                            <div className="flex gap-1">
                                {['lifetime', 'year', 'month', 'date'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type
                                            ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105'
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            {filterType !== 'lifetime' && (
                                <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3 flex items-center">
                                    {filterType === 'date' ? (
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer px-2"
                                        />
                                    ) : (
                                        <select
                                            value={selectedDate.split('-')[0]}
                                            onChange={(e) => setSelectedDate(`${e.target.value}-01-01`)}
                                            className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                                        >
                                            {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-black">{y}</option>)}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <MetricCard
                        title="Total Impressions"
                        value={stats.totalVisits.toLocaleString()}
                        icon={<Eye className="size-5" />}
                        trend={stats.totalVisitsTrend}
                        isPositive={!stats.totalVisitsTrend?.startsWith('-')}
                        onClick={() => navigate('/admin/analytics')}
                    />
                    <MetricCard
                        title="Active Sessions"
                        value={stats.uniqueSessions.toLocaleString()}
                        icon={<Users className="size-5" />}
                        trend={stats.uniqueVisitorsTrend}
                        isPositive={!stats.uniqueVisitorsTrend?.startsWith('-')}
                        onClick={() => navigate('/admin/customers')}
                    />
                    <MetricCard
                        title="Conversion Rate"
                        value={`${stats.conversionRate}%`}
                        icon={<TrendingUp className="size-5" />}
                        trend={stats.conversionRateTrend}
                        isPositive={!stats.conversionRateTrend?.startsWith('-')}
                        onClick={() => navigate('/admin/orders')}
                    />
                    <MetricCard
                        title="Avg Duration"
                        value={stats.avgSessionDuration}
                        icon={<Timer className="size-5" />}
                        trend={stats.avgSessionDurationTrend}
                        isPositive={!stats.avgSessionDurationTrend?.startsWith('-')}
                    />
                </div>

                {/* Main Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Traffic Overview */}
                    <div className="lg:col-span-2 glossy-panel rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl bg-black/40 relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <div>
                                <h3 className="text-xl font-black text-white">Engagement Frequency</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Temporal analysis of site interaction</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-primary shadow-lg shadow-primary/20"></div>
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Views</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20"></div>
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Actions</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[250px] md:h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={visitData}>
                                    <defs>
                                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ff007f" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ff007f" stopOpacity={0} />
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
                                        tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 800 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 800 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff10', borderRadius: '16px', fontSize: '10px', fontWeight: '900', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ stroke: '#ffffff10', strokeWidth: 2 }}
                                    />
                                    <Area type="monotone" dataKey="visits" name="Views" stroke="#ff007f" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                                    <Area type="monotone" dataKey="interactions" name="Actions" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorInteractions)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Funnel / Conversion */}
                    <div className="glossy-panel rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl bg-black/40 flex flex-col">
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wider">Purchase Pipe</h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-10">Transactional drop-off metrics</p>

                        <div className="flex-1 space-y-8">
                            <FunnelStep
                                label="Manifest Loading"
                                value={stats.cartAdds}
                                percentage={100}
                                color="bg-gray-700"
                            />
                            <FunnelStep
                                label="Checkout Trigger"
                                value={stats.checkoutStarts}
                                percentage={stats.cartAdds > 0 ? (stats.checkoutStarts / stats.cartAdds) * 100 : 0}
                                color="bg-orange-500"
                            />
                            <FunnelStep
                                label="Signal Finalized"
                                value={stats.purchaseCompletes}
                                percentage={stats.checkoutStarts > 0 ? (stats.purchaseCompletes / stats.checkoutStarts) * 100 : 0}
                                color="bg-green-500"
                            />

                            <div className="mt-12 p-6 rounded-3xl bg-red-500/5 border border-red-500/10 group hover:bg-red-500/10 transition-all cursor-pointer" onClick={() => navigate('/admin/orders')}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Leakage Alert</span>
                                    <Package className="size-4 text-red-500 scale-100 group-hover:scale-125 transition-transform" />
                                </div>
                                <h4 className="text-4xl font-black text-white">{stats.abandonedCarts}</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-2 tracking-widest">Manifests Abandoned</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {/* Matrix Cards (Page, Product, Element, Activity) */}
                    <MatrixBox
                        title="Node Usage"
                        data={popularPages}
                        labelKey="name"
                        valueKey="visits"
                        icon={<FileText className="size-4" />}
                        onItemClick={() => navigate('/admin/analytics')}
                    />
                    <MatrixBox
                        title="Object Focus"
                        data={topProducts}
                        labelKey="name"
                        valueKey="views"
                        icon={<Package className="size-4" />}
                        onItemClick={(item) => navigate('/admin/products')}
                    />
                    <MatrixBox
                        title="Control Flux"
                        data={topElements}
                        labelKey="name"
                        valueKey="clicks"
                        icon={<MousePointer2 className="size-4" />}
                    />
                    <VisualFeed
                        title="Live Stream"
                        data={interactionData}
                        icon={<Activity className="size-4" />}
                    />
                </div>
            </div>
        </AdminLayout>
    );
};

const MetricCard = ({ title, value, icon, trend, isPositive, onClick }) => (
    <button
        onClick={onClick}
        className={`glossy-card p-6 rounded-[2rem] relative overflow-hidden group border border-white/5 transition-all duration-300 text-left w-full hover:-translate-y-1 ${onClick ? 'hover:border-primary/40 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]' : ''}`}
    >
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500"></div>
        <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-primary-light group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                {icon}
            </div>
            {trend && (
                <span className={`flex items-center text-[9px] font-black ${isPositive ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'} px-2.5 py-1 rounded-lg border ${isPositive ? 'border-green-400/20' : 'border-red-400/20'} uppercase tracking-widest`}>
                    {trend}
                    {isPositive ? <ArrowUpRight className="size-3 ml-0.5" /> : <ArrowDownRight className="size-3 ml-0.5" />}
                </span>
            )}
        </div>
        <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
    </button>
);

const FunnelStep = ({ label, value, percentage, color }) => (
    <div className="space-y-3">
        <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{label}</span>
            <span className="text-sm font-black text-white tracking-tight">{Math.round(value).toLocaleString()}</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
            <div
                className={`h-full ${color} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.05)]`}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
        <div className="flex justify-end pr-1">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{Math.round(percentage)}% THROUGHPUT</span>
        </div>
    </div>
);

const MatrixBox = ({ title, data, labelKey, valueKey, icon, onItemClick }) => (
    <div className="glossy-panel rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl bg-black/40">
        <h3 className="text-lg font-bold text-white mb-8 border-b border-white/5 pb-4 uppercase tracking-wider">{title}</h3>
        <div className="space-y-4">
            {data.length > 0 ? data.map((item, idx) => (
                <button
                    key={idx}
                    onClick={() => onItemClick?.(item)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all w-full text-left group"
                >
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="size-8 rounded-xl bg-white/5 flex items-center justify-center text-primary-light border border-white/5 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            {icon}
                        </div>
                        <span className="text-xs font-bold text-white tracking-tight line-clamp-1 group-hover:text-primary-light transition-colors">{item[labelKey]}</span>
                    </div>
                    <span className="text-[10px] font-black text-white ml-2">{item[valueKey].toLocaleString()}</span>
                </button>
            )) : (
                <div className="text-center py-10 opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No Data Signal Detected</p>
                </div>
            )}
        </div>
    </div>
);

const VisualFeed = ({ title, data, icon }) => (
    <div className="glossy-panel rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl bg-black/40 relative">
        <h3 className="text-lg font-bold text-white mb-8 border-b border-white/5 pb-4 uppercase tracking-wider">{title}</h3>
        <div className="space-y-4 h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {data.length > 0 ? data.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform shadow-inner">
                            {icon}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-white tracking-tight truncate group-hover:text-blue-400 transition-colors uppercase">{item.event}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 truncate">{item.page}</p>
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-gray-400 shrink-0 ml-2">{item.time}</span>
                </div>
            )) : (
                <div className="text-center py-10 opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">System Idle</p>
                </div>
            )}
        </div>
    </div>
);

export default AnalyticsPage;
