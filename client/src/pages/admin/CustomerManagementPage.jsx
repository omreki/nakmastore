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

                const totalSpent = customerOrders.reduce((sum, order) => {
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
                    orders: customerOrders,
                    joinedAt: new Date(profile.created_at).toLocaleDateString()
                };
            });

            setCustomers(formattedCustomers);

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

    const handleDeleteCustomer = async (customerId, customerName, e) => {
        if (e) e.stopPropagation();

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
            await fetchCustomers();

        } catch (error) {
            console.error("Error adding member:", error);
            notify(error.message || "Failed to create user.", 'error');
        } finally {
            setIsAdding(false);
        }
    };

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
            <div className="flex flex-col gap-6 md:gap-8 pb-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm">
                                Community
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ Customer List</span>
                        </div>
                        <h1 className="text-white text-3xl md:text-5xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Customer <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Management</span>
                        </h1>
                        <p className="text-gray-400 text-sm md:text-base font-medium mt-2 max-w-xl">
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
                            className="bg-primary hover:bg-primary-hover text-white h-12 px-6 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-2xl hover:-translate-y-0.5 transition-all border border-white/10 w-full md:w-auto justify-center"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Add Customer
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div className="glossy-panel rounded-[1.5rem] p-6 relative overflow-hidden group border border-white/5 bg-black/20 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Members</p>
                                <h3 className="text-3xl font-black text-white tracking-tight">{customers.length}</h3>
                            </div>
                            <div className="size-11 rounded-xl bg-white/5 flex items-center justify-center text-primary-light border border-white/5">
                                <span className="material-symbols-outlined">group</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter relative z-10">
                            <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-lg border border-green-500/20 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">trending_up</span> +100%
                            </span>
                        </div>
                    </div>
                    <div className="glossy-panel rounded-[1.5rem] p-6 relative overflow-hidden group border border-white/5 bg-black/20 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Active</p>
                                <h3 className="text-3xl font-black text-white tracking-tight">{customers.filter(c => c.status === 'Active').length}</h3>
                            </div>
                            <div className="size-11 rounded-xl bg-white/5 flex items-center justify-center text-blue-400 border border-white/5">
                                <span className="material-symbols-outlined">verified_user</span>
                            </div>
                        </div>
                    </div>
                    <div className="glossy-panel rounded-[1.5rem] p-6 relative overflow-hidden group border border-white/5 bg-black/20 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">New Signups</p>
                                <h3 className="text-3xl font-black text-white tracking-tighter">{recentSignups.length}</h3>
                            </div>
                            <div className="size-11 rounded-xl bg-white/5 flex items-center justify-center text-orange-400 border border-white/5">
                                <span className="material-symbols-outlined">person_add</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Customer Table */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="glossy-panel rounded-[2rem] flex flex-col relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl min-h-[500px]">
                            {/* Toolbar */}
                            <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/[0.02]">
                                <div className="relative w-full sm:max-w-xs group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-lg group-focus-within:text-white transition-colors">search</span>
                                    <input
                                        className="glossy-input w-full pl-11 pr-4 py-2.5 rounded-xl text-sm focus:ring-1 focus:ring-primary/40 bg-black/40 border-white/5 text-white"
                                        placeholder="Search members..."
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <select
                                        className="glossy-panel appearance-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/40 bg-black/20 border border-white/10 flex-1"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option className="bg-black" value="all">Status: All</option>
                                        <option className="bg-black" value="active">Active</option>
                                        <option className="bg-black" value="inactive">Inactive</option>
                                        <option className="bg-black" value="blocked">Blocked</option>
                                    </select>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto scrollbar-hide">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead className="bg-white/[0.01] text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                        <tr>
                                            <th className="p-6">Customer</th>
                                            <th className="p-6">Status</th>
                                            <th className="p-6">Joined</th>
                                            <th className="p-6 text-right">Spent</th>
                                            <th className="p-6 text-right pr-12">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-white/5">
                                        {loading ? (
                                            <tr><td colSpan="5" className="p-10 text-center text-gray-500">Loading Community...</td></tr>
                                        ) : filteredCustomers.length === 0 ? (
                                            <tr><td colSpan="5" className="p-10 text-center text-gray-500">No members found.</td></tr>
                                        ) : (
                                            filteredCustomers.map((customer) => (
                                                <tr
                                                    key={customer.id}
                                                    onClick={() => {
                                                        setSelectedCustomer(customer);
                                                        setShowProfileModal(true);
                                                    }}
                                                    className="group hover:bg-white/[0.03] transition-all duration-300 cursor-pointer"
                                                >
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-black border border-white/10 shadow-xl group-hover:scale-110 duration-300">
                                                                {customer.initials}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="font-bold text-white group-hover:text-primary-light transition-colors truncate">{customer.name}</span>
                                                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-tight truncate">{customer.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">{getStatusBadge(customer.status)}</td>
                                                    <td className="p-6 text-gray-400 font-bold text-xs">{customer.joinedAt}</td>
                                                    <td className="p-6 text-right font-black text-white text-base">{formatPrice(customer.totalSpent)}</td>
                                                    <td className="p-6 text-right pr-8" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => handleDeleteCustomer(customer.id, customer.name, e)}
                                                            className="size-10 rounded-xl hover:bg-red-500/20 flex items-center justify-center text-gray-500 hover:text-red-500 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="p-6 border-t border-white/5 flex items-center justify-between bg-black/20">
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                    Displaying <span className="text-white">{filteredCustomers.length}</span> members
                                </span>
                                <div className="flex gap-2">
                                    <button className="size-9 rounded-xl border border-white/5 flex items-center justify-center text-gray-600 disabled:opacity-30" disabled>
                                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                                    </button>
                                    <button className="size-9 rounded-xl bg-primary text-white font-black text-[10px] shadow-xl shadow-primary/20">1</button>
                                    <button className="size-9 rounded-xl border border-white/5 flex items-center justify-center text-gray-500">
                                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
                        {/* Featured Member Card */}
                        {featuredCustomer && (
                            <div className="glossy-panel rounded-[2rem] p-8 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="absolute -bottom-8 -right-8 size-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                                <h3 className="text-white text-[10px] font-black uppercase tracking-[0.25em] mb-8">Top Shopper</h3>
                                <div className="flex flex-col items-center text-center">
                                    <div className="size-24 rounded-[2rem] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-3xl font-black border-2 border-white/10 shadow-2xl mb-4 group-hover:scale-105 transition-transform duration-500">
                                        {featuredCustomer.initials}
                                    </div>
                                    <h4 className="text-2xl font-black text-white mb-2 tracking-tighter">{featuredCustomer.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-8">Member Since {new Date(featuredCustomer.joinedAt).getFullYear()}</p>
                                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[9px] text-gray-600 uppercase font-black mb-1">Lifetime</p>
                                            <p className="text-lg font-black text-white">{formatPrice(featuredCustomer.totalSpent)}</p>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                            <p className="text-[9px] text-gray-600 uppercase font-black mb-1">Orders</p>
                                            <p className="text-lg font-black text-white">{featuredCustomer.ordersCount}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedCustomer(featuredCustomer);
                                            setShowProfileModal(true);
                                        }}
                                        className="w-full py-4 rounded-xl admin-button-primary text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                                    >
                                        View Profile
                                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Activity Log */}
                        <div className="glossy-panel rounded-[2rem] p-8 border border-white/5 bg-black/20 shadow-2xl flex-1 flex flex-col min-h-[400px]">
                            <h3 className="text-white text-[10px] font-black uppercase tracking-[0.25em] mb-8">Activity Log</h3>
                            <div className="space-y-6 overflow-y-auto max-h-[400px] scrollbar-hide">
                                {activities.map((activity, idx) => (
                                    <div key={idx} className="flex gap-4 items-start group">
                                        <div className={`size-10 rounded-xl bg-${activity.color}-500/10 text-${activity.color}-400 flex items-center justify-center flex-shrink-0 border border-${activity.color}-500/20 group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined text-[18px]">{activity.icon}</span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-xs text-gray-300 leading-relaxed font-medium">{activity.text}</p>
                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                {showAddModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
                        <div className="glossy-panel relative w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-black/90 p-8 md:p-10 shadow-2xl">
                            <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Add New User</h3>
                            <form onSubmit={handleAddMemberSubmit} className="flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <input name="firstName" value={newMember.firstName} onChange={handleAddMemberChange} required className="glossy-input w-full rounded-xl bg-black/40 border-white/5 h-12 px-5 text-sm outline-none focus:ring-1 focus:ring-primary/40 text-white font-bold" placeholder="First Name" />
                                    <input name="lastName" value={newMember.lastName} onChange={handleAddMemberChange} required className="glossy-input w-full rounded-xl bg-black/40 border-white/5 h-12 px-5 text-sm outline-none focus:ring-1 focus:ring-primary/40 text-white font-bold" placeholder="Last Name" />
                                </div>
                                <input type="email" name="email" value={newMember.email} onChange={handleAddMemberChange} required className="glossy-input w-full rounded-xl bg-black/40 border-white/5 h-12 px-5 text-sm outline-none focus:ring-1 focus:ring-primary/40 text-white font-bold" placeholder="Email Address" />
                                <input type="password" name="password" value={newMember.password} onChange={handleAddMemberChange} required className="glossy-input w-full rounded-xl bg-black/40 border-white/5 h-12 px-5 text-sm outline-none focus:ring-1 focus:ring-primary/40 text-white font-bold" placeholder="Temp Password" minLength={6} />
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="h-12 rounded-xl bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest">Cancel</button>
                                    <button type="submit" disabled={isAdding} className="h-12 rounded-xl admin-button-primary text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        {isAdding ? 'Creating...' : 'Register User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showProfileModal && selectedCustomer && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowProfileModal(false)}></div>
                        <div className="glossy-panel relative w-full max-w-4xl rounded-[2.5rem] border border-white/10 bg-black/90 p-8 md:p-10 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex gap-6 items-center">
                                    <div className="size-20 rounded-[1.5rem] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-2xl font-black border-2 border-white/10 shadow-2xl">
                                        {selectedCustomer.initials}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white tracking-tighter">{selectedCustomer.name}</h3>
                                        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">{selectedCustomer.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowProfileModal(false)} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Spent</p>
                                    <p className="text-2xl font-black text-white">{formatPrice(selectedCustomer.totalSpent)}</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Orders</p>
                                    <p className="text-2xl font-black text-white">{selectedCustomer.ordersCount}</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Tier</p>
                                    <p className="text-2xl font-black text-primary-light">{getLoyaltyTier(selectedCustomer.totalSpent)}</p>
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                                <h4 className="p-5 text-white text-[10px] font-black uppercase tracking-widest bg-white/5 border-b border-white/5">Order History</h4>
                                <div className="overflow-x-auto scrollbar-hide">
                                    <table className="w-full text-left">
                                        <thead className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                                            <tr>
                                                <th className="p-4">ID</th>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {selectedCustomer.orders?.map(order => (
                                                <tr key={order.id}>
                                                    <td className="p-4 text-white font-bold text-xs">#{order.id.slice(0, 8).toUpperCase()}</td>
                                                    <td className="p-4 text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                                                    <td className="p-4"><span className="text-[10px] font-black uppercase text-gray-400">{order.status}</span></td>
                                                    <td className="p-4 text-white font-black text-right text-sm">{formatPrice(order.total_amount)}</td>
                                                </tr>
                                            ))}
                                            {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) && (
                                                <tr><td colSpan="4" className="p-10 text-center text-gray-500">No order history found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </AdminLayout>
    );
};

export default CustomerManagementPage;
