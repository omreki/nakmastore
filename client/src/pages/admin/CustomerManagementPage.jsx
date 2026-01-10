import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useNotification } from '../../context/NotificationContext';

const CustomerManagementPage = () => {
    const { formatPrice } = useStoreSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recentSignups, setRecentSignups] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const { notify, confirm } = useNotification();
    const [newMember, setNewMember] = useState({
        email: '',
        firstName: '',
        lastName: '',
        password: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);

            // Parallel fetch for profiles and orders
            const [profilesResponse, ordersResponse] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('orders')
                    .select('id, customer_id, total_amount, created_at, status')
                    .order('created_at', { ascending: false })
            ]);

            if (profilesResponse.error) throw profilesResponse.error;
            if (ordersResponse.error) throw ordersResponse.error;

            const allOrders = ordersResponse.data;

            const formattedCustomers = profilesResponse.data.map(profile => {
                const customerOrders = allOrders.filter(o => o.customer_id === profile.id);

                // Calculate stats
                const totalSpent = customerOrders.reduce((sum, order) => {
                    // Exclude cancelled/refunded orders if necessary, assuming all distinct from 'cancelled' for now
                    if (order.status?.toLowerCase() === 'cancelled') return sum;
                    return sum + (order.total_amount || 0);
                }, 0);

                const lastOrderDate = customerOrders.length > 0
                    ? new Date(customerOrders[0].created_at)
                    : null;

                return {
                    id: profile.id,
                    name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User',
                    email: profile.email,
                    role: profile.role,
                    avatar: null,
                    initials: getInitials(profile.full_name || profile.first_name || profile.email),
                    status: 'Active',
                    lastOrder: lastOrderDate,
                    totalSpent: totalSpent,
                    ordersCount: customerOrders.length,
                    orders: customerOrders, // Attach orders for modal
                    joinedAt: new Date(profile.created_at).toLocaleDateString()
                };
            });

            setCustomers(formattedCustomers);

            // Generate recent activity from signups
            const signups = formattedCustomers.slice(0, 5).map(c => ({
                type: 'signup',
                icon: 'person_add',
                color: 'blue',
                text: <><span className="font-bold text-white">{c.name}</span> registered an account</>,
                time: getTimeAgo(new Date(profilesResponse.data.find(p => p.id === c.id).created_at))
            }));
            setRecentSignups(signups);

        } catch (error) {
            console.error('Error fetching customers:', error);
            notify('Failed to fetch customer list', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name
            .match(/(\b\S)?/g)
            .join("")
            .match(/(^\S|\S$)?/g)
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            Active: 'bg-green-500/10 text-green-400 border-green-500/20',
            Inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
            Pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            Blocked: 'bg-red-500/10 text-red-400 border-red-500/20'
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[status] || statusColors.Active}`}>
                {status}
            </span>
        );
    };

    const getLoyaltyTier = (totalSpent) => {
        if (totalSpent >= 2500) return 'Diamond';
        if (totalSpent >= 1000) return 'Platinum';
        if (totalSpent >= 500) return 'Gold';
        if (totalSpent >= 150) return 'Silver';
        return 'Bronze';
    };

    const handleAddMemberChange = (e) => {
        setNewMember({ ...newMember, [e.target.name]: e.target.value });
    };

    const handleDeleteCustomer = async (customerId, customerName) => {
        const confirmed = await confirm({
            title: 'Delete Member',
            message: `Are you sure you want to permanently delete user "${customerName}"? This action cannot be undone.`,
            confirmLabel: 'Delete User',
            type: 'danger'
        });

        if (!confirmed) return;

        try {
            const { error } = await supabase.rpc('delete_user_by_id', { target_user_id: customerId });

            if (error) throw error;

            notify(`User ${customerName} has been removed.`, 'success');

            // Remove from local state
            setCustomers(prev => prev.filter(c => c.id !== customerId));

        } catch (error) {
            console.error('Delete failed:', error);
            notify('Failed to delete user: ' + error.message, 'error');
        }
    };

    const handleAddMemberSubmit = async (e) => {
        e.preventDefault();
        setIsAdding(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    email: newMember.email,
                    password: newMember.password,
                    firstName: newMember.firstName,
                    lastName: newMember.lastName
                }
            });

            if (error) throw new Error(error.message || "Function invocation failed");
            if (data && data.error) throw new Error(data.error);

            notify(`User ${newMember.email} successfully created.`, 'success');
            setShowAddModal(false);
            setNewMember({ email: '', firstName: '', lastName: '', password: '' });

            // Refresh the list immediately to show the new customer
            await fetchCustomers();

        } catch (error) {
            console.error("Error adding member:", error);
            notify(error.message || "Failed to create user.", 'error');
        } finally {
            setIsAdding(false);
        }
    };

    // Combined activity log
    const activities = [
        ...recentSignups,
        {
            type: 'order',
            icon: 'shopping_bag',
            color: 'green',
            text: <><span className="font-bold text-white">System</span> ready for orders</>,
            time: 'Just now'
        }
    ];

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || customer.status.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const featuredCustomer = customers.length > 0
        ? customers.reduce((max, customer) => (customer.totalSpent > max.totalSpent ? customer : max), customers[0])
        : null;

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 pb-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm">
                                Community
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ Customer List</span>
                        </div>
                        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Customer <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Management</span>
                        </h1>
                        <p className="text-gray-400 text-base font-medium mt-2 max-w-xl">
                            Manage your community, analyze shopper behavior, and oversee memberships.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="hidden md:flex items-center justify-center rounded-xl h-12 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white gap-2 text-[10px] font-black uppercase tracking-widest px-6 transition-all border border-white/10 group">
                            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">download</span>
                            Export
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-primary hover:bg-primary-hover text-white h-12 px-6 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-2xl hover:-translate-y-0.5 transition-all border border-white/10"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Add Customer
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glossy-panel rounded-[1.5rem] p-6 relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-primary/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Members</p>
                                <h3 className="text-3xl font-black text-white tracking-tight">{customers.length}</h3>
                            </div>
                            <div className="size-11 rounded-xl bg-white/5 flex items-center justify-center text-primary-light border border-white/5 shadow-inner">
                                <span className="material-symbols-outlined">group</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter relative z-10">
                            <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">trending_up</span> +100%
                            </span>
                            <span className="text-gray-500">since inception</span>
                        </div>
                    </div>

                    <div className="glossy-panel rounded-[1.5rem] p-6 relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Members</p>
                                <h3 className="text-3xl font-black text-white tracking-tight">{customers.filter(c => c.status === 'Active').length}</h3>
                            </div>
                            <div className="size-11 rounded-xl bg-white/5 flex items-center justify-center text-blue-400 border border-white/5 shadow-inner">
                                <span className="material-symbols-outlined">verified_user</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter relative z-10">
                            <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">trending_up</span> 100%
                            </span>
                            <span className="text-gray-500">active rate</span>
                        </div>
                    </div>

                    <div className="glossy-panel rounded-[1.5rem] p-6 relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-orange-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">New Signups</p>
                                <h3 className="text-3xl font-black text-white tracking-tighter">{recentSignups.length}</h3>
                            </div>
                            <div className="size-11 rounded-xl bg-white/5 flex items-center justify-center text-orange-400 border border-white/5 shadow-inner">
                                <span className="material-symbols-outlined">person_add</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter relative z-10">
                            <span className="bg-white/5 text-gray-400 px-2 py-1 rounded-lg border border-white/10">
                                LATEST
                            </span>
                            <span className="text-gray-500">joined recently</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Customer Table */}
                    <div className="lg:col-span-8 flex flex-col">
                        <div className="glossy-panel rounded-[2.5rem] flex flex-col relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl min-h-[600px]">
                            {/* Search and Filters */}
                            <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/[0.02] backdrop-blur-md">
                                <div className="relative w-full sm:w-auto flex-1 max-w-md group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-lg group-focus-within:text-white transition-colors">search</span>
                                    <input
                                        className="glossy-input w-full pl-11 pr-4 py-3 rounded-2xl text-sm focus:ring-1 focus:ring-primary/40 bg-black/40 border-white/5"
                                        placeholder="Search by name, email, or ID..."
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <div className="relative group">
                                        <select
                                            className="glossy-panel appearance-none pl-5 pr-12 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 bg-black/20 border border-white/10 transition-all"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option className="bg-black" value="all">Status: All</option>
                                            <option className="bg-black" value="active">Active</option>
                                            <option className="bg-black" value="inactive">Inactive</option>
                                            <option className="bg-black" value="blocked">Blocked</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-xl group-hover:text-white transition-colors">expand_more</span>
                                    </div>
                                    <button className="glossy-panel size-11 flex items-center justify-center rounded-2xl text-gray-400 hover:text-white border border-white/5 hover:bg-white/5 transition-all">
                                        <span className="material-symbols-outlined text-[18px]">tune</span>
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="flex-grow overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead className="bg-white/[0.01] text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                        <tr>
                                            <th className="p-6">Customer</th>
                                            <th className="p-6">Status</th>
                                            <th className="p-6">Joined Date</th>
                                            <th className="p-6 text-right">Total Spent</th>
                                            <th className="p-6 text-right pr-12">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-white/5">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="p-10 text-center text-gray-500">Loading Customers...</td>
                                            </tr>
                                        ) : filteredCustomers.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="p-10 text-center text-gray-500">No members found matching your criteria.</td>
                                            </tr>
                                        ) : (
                                            filteredCustomers.map((customer) => (
                                                <tr key={customer.id} className="group hover:bg-white/[0.03] transition-all duration-300 cursor-pointer">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                {customer.avatar ? (
                                                                    <img
                                                                        alt="Avatar"
                                                                        className="size-11 rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-primary/50 transition-all shadow-xl group-hover:scale-105 duration-300"
                                                                        src={customer.avatar}
                                                                    />
                                                                ) : (
                                                                    <div className="size-11 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-black border border-white/10 shadow-xl group-hover:scale-105 duration-300">
                                                                        {customer.initials}
                                                                    </div>
                                                                )}
                                                                <div className="absolute -bottom-1 -right-1 size-3.5 bg-green-500 rounded-full border-2 border-primary shadow-lg"></div>
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-bold text-white text-base group-hover:text-primary-light transition-colors truncate">{customer.name}</span>
                                                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-tight truncate">{customer.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        {getStatusBadge(customer.status)}
                                                    </td>
                                                    <td className="p-6">
                                                        <span className="text-white font-bold text-xs">{customer.joinedAt}</span>
                                                    </td>
                                                    <td className="p-6 text-right font-black text-white text-lg tracking-tighter">{formatPrice(customer.totalSpent)}</td>
                                                    <td className="p-6 text-center">
                                                        {(customer.role === 'admin' || (import.meta.env.VITE_ADMIN_EMAILS || '').toLowerCase().includes(customer.email?.toLowerCase())) ? (
                                                            <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase text-gray-500 border border-white/5 tracking-wider">
                                                                Admin
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id, customer.name); }}
                                                                className="size-10 rounded-2xl hover:bg-red-500/20 flex items-center justify-center text-gray-500 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20 group/delete"
                                                                title="Delete User"
                                                            >
                                                                <span className="material-symbols-outlined group-hover/delete:scale-110 transition-transform">delete</span>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="p-7 border-t border-white/5 flex items-center justify-between bg-black/20">
                                <span className="text-xs font-black text-gray-600 uppercase tracking-widest">
                                    Displaying <span className="text-white font-black">{filteredCustomers.length}</span> members
                                </span>
                                <div className="flex gap-2">
                                    <button className="size-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30" disabled>
                                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                                    </button>
                                    <button className="size-10 rounded-2xl bg-primary text-white font-black text-xs shadow-xl shadow-primary/20 ring-1 ring-white/10">
                                        1
                                    </button>
                                    <button className="size-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        {/* Featured Member Card */}
                        {featuredCustomer ? (
                            <div className="glossy-panel rounded-[2.5rem] p-8 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="absolute -bottom-8 -right-8 size-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-white text-xs font-black uppercase tracking-[0.25em]">Top Shopper</h3>
                                    <div className="size-2 rounded-full bg-primary shadow-[0_0_10px_rgba(255,0,127,1)]"></div>
                                </div>
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative mb-6">
                                        <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-primary via-transparent to-primary-light animate-spin-slow opacity-20 blur-md"></div>
                                        {featuredCustomer.avatar ? (
                                            <img
                                                alt="Top Customer"
                                                className="size-28 rounded-3xl object-cover border-2 border-white/10 relative z-10 shadow-2xl transition-transform duration-700 hover:scale-105"
                                                src={featuredCustomer.avatar}
                                            />
                                        ) : (
                                            <div className="size-28 rounded-3xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-3xl font-black border-2 border-white/10 shadow-2xl relative z-10">
                                                {featuredCustomer.initials}
                                            </div>
                                        )}
                                        <span className="absolute -bottom-2 -right-2 bg-white text-black text-[9px] font-black px-2.5 py-1 rounded-full shadow-2xl z-20 border-4 border-primary uppercase tracking-widest">VIP</span>
                                    </div>
                                    <h4 className="text-2xl font-black text-white mb-2 tracking-tighter">{featuredCustomer.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-8">Member Since {new Date(featuredCustomer.joinedAt).getFullYear()}</p>
                                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 shadow-inner">
                                            <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">Lifetime Value</p>
                                            <p className="text-xl font-black text-white tracking-tighter">{formatPrice(featuredCustomer.totalSpent)}</p>
                                        </div>
                                        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 shadow-inner">
                                            <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">Total Orders</p>
                                            <p className="text-xl font-black text-white tracking-tighter">{featuredCustomer.ordersCount}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedCustomer(featuredCustomer);
                                            setShowProfileModal(true);
                                        }}
                                        className="w-full py-4 rounded-2xl admin-button-primary text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl group flex items-center justify-center gap-2"
                                    >
                                        Member Profile
                                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Placeholder State when no customers exist
                            <div className="glossy-panel rounded-[2.5rem] p-8 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl min-h-[400px] flex items-center justify-center">
                                <div className="text-center opacity-50">
                                    <span className="material-symbols-outlined text-4xl mb-2">person_off</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">No featured member yet</p>
                                </div>
                            </div>
                        )}

                        {/* Audit Log / Recent Activity */}
                        <div className="glossy-panel rounded-[2.5rem] p-8 flex-1 flex flex-col border border-white/5 bg-black/20 shadow-2xl h-full">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-white text-xs font-black uppercase tracking-[0.25em]">Activity Log</h3>
                                <button className="size-10 flex items-center justify-center rounded-2xl hover:bg-white/5 text-gray-600 hover:text-white transition-all border border-transparent hover:border-white/10 group">
                                    <span className="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">refresh</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[420px] pr-2 space-y-6 custom-scrollbar">
                                {activities.map((activity, idx) => (
                                    <div key={idx} className="flex gap-4 items-start group">
                                        <div className={`size-10 rounded-2xl bg-${activity.color}-500/10 text-${activity.color}-400 flex items-center justify-center flex-shrink-0 border border-${activity.color}-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                            <span className="material-symbols-outlined text-[20px]">{activity.icon}</span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-xs text-gray-300 font-medium leading-relaxed">{activity.text}</p>
                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Developer Footer Meta */}
                <div className="flex items-center justify-between px-2 pt-10 border-t border-white/5 mt-auto">
                    <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.3em]">© 2026 Nakma Store • All Rights Reserved</p>
                    <div className="flex gap-10">
                        <a className="text-[10px] text-gray-700 hover:text-white transition-colors font-bold uppercase tracking-[0.1em]" href="#">Privacy Policy</a>
                        <a className="text-[10px] text-gray-700 hover:text-white transition-colors font-bold uppercase tracking-[0.1em]" href="#">Help Center</a>
                    </div>
                </div>
            </div>



            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
                        onClick={() => setShowAddModal(false)}
                    ></div>
                    <div className="glossy-panel relative w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-black/40 overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-8 md:p-10 flex flex-col">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="size-12 rounded-3xl bg-primary/10 flex items-center justify-center text-primary-light border border-primary/20 shadow-inner">
                                    <span className="material-symbols-outlined text-[24px]">person_add</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Add New User</h3>
                                    <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mt-0.5">Create a new entry in the customer list</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddMemberSubmit} className="flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">First Name</label>
                                        <input
                                            name="firstName"
                                            value={newMember.firstName}
                                            onChange={handleAddMemberChange}
                                            required
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 h-12 px-5 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 text-white font-bold"
                                            placeholder="Jane"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Last Name</label>
                                        <input
                                            name="lastName"
                                            value={newMember.lastName}
                                            onChange={handleAddMemberChange}
                                            required
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 h-12 px-5 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 text-white font-bold"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={newMember.email}
                                        onChange={handleAddMemberChange}
                                        required
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 h-12 px-5 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 text-white font-bold"
                                        placeholder="jane.doe@example.com"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Temp Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={newMember.password}
                                        onChange={handleAddMemberChange}
                                        required
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 h-12 px-5 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 text-white font-bold"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-black text-[10px] uppercase tracking-widest transition-all border border-white/5 active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isAdding}
                                        className="h-14 rounded-2xl admin-button-primary text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isAdding ? 'Creating...' : 'Register User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Profile Modal */}
            {showProfileModal && selectedCustomer && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
                        onClick={() => setShowProfileModal(false)}
                    ></div>
                    <div className="glossy-panel relative w-full max-w-4xl rounded-[2.5rem] border border-white/10 bg-black/40 overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="p-8 md:p-10 flex flex-col flex-1 overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex flex-col md:flex-row gap-8 items-start mb-8 pb-8 border-b border-white/5">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl"></div>
                                    {selectedCustomer.avatar ? (
                                        <img src={selectedCustomer.avatar} className="size-24 rounded-3xl object-cover ring-2 ring-white/10 relative z-10 shadow-2xl" alt="Profile" />
                                    ) : (
                                        <div className="size-24 rounded-3xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-3xl font-black ring-2 ring-white/10 relative z-10 shadow-2xl">
                                            {selectedCustomer.initials}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full z-20 border-2 border-primary uppercase tracking-wider">Active</div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{selectedCustomer.name}</h3>
                                            <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mail</span> {selectedCustomer.email}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> Joined {selectedCustomer.joinedAt}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowProfileModal(false)} className="size-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mt-6">
                                        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Lifetime Value</p>
                                            <p className="text-2xl font-black text-white tracking-tighter">{formatPrice(selectedCustomer.totalSpent)}</p>
                                        </div>
                                        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Orders Count</p>
                                            <p className="text-2xl font-black text-white tracking-tighter">{selectedCustomer.ordersCount}</p>
                                        </div>


                                        <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Loyalty Tier</p>
                                            <p className="text-2xl font-black text-primary-light tracking-tighter">{getLoyaltyTier(selectedCustomer.totalSpent)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Orders Section */}
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-white text-sm font-black uppercase tracking-widest">Order History</h4>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-gray-400 font-bold uppercase border border-white/5">Last Updated: Just now</span>
                                    </div>
                                </div>

                                <div className="flex-1 bg-black/20 rounded-3xl border border-white/5 overflow-hidden flex flex-col">
                                    <div className="overflow-y-auto custom-scrollbar flex-1">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-white/[0.02] sticky top-0 z-10 backdrop-blur-md">
                                                <tr>
                                                    <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Order ID</th>
                                                    <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Date</th>
                                                    <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Status</th>
                                                    <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                                                    selectedCustomer.orders.map(order => (
                                                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                                            <td className="p-5 text-sm font-bold text-white uppercase">#{order.id.slice(0, 8)}</td>
                                                            <td className="p-5 text-sm text-gray-400 font-medium">
                                                                {new Date(order.created_at).toLocaleDateString()}
                                                            </td>
                                                            <td className="p-5">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider
                                                                    ${order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                                        order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                            order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                                                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-5 text-sm font-black text-white text-right">
                                                                {formatPrice(order.total_amount)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="p-12 text-center">
                                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                                <span className="material-symbols-outlined text-4xl mb-3">shopping_bag</span>
                                                                <p className="text-sm font-bold text-gray-400">No orders placed yet</p>
                                                                <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">Get this member to shop!</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-3">
                            <button className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all">
                                Send Message
                            </button>
                            <button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg">
                                View Full Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 15s linear infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.1);
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in {
                    animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
        </AdminLayout>
    );
};

export default CustomerManagementPage;
