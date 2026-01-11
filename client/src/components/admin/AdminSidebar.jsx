import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { supabase } from '../../lib/supabase';

const AdminSidebar = () => {
    const { signOut, user, profile } = useAuth();
    const { settings } = useStoreSettings();

    const [unreadOrdersCount, setUnreadOrdersCount] = React.useState(0);

    React.useEffect(() => {
        const fetchUnreadCount = async () => {
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('is_viewed', false);

            if (!error) setUnreadOrdersCount(count || 0);
        };

        fetchUnreadCount();

        const channel = supabase
            .channel('unread_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchUnreadCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const menuItems = [
        { name: 'Dashboard', icon: 'dashboard', path: '/admin' },
        { name: 'Orders', icon: 'shopping_bag', path: '/admin/orders', badge: unreadOrdersCount },
        { name: 'Products', icon: 'inventory_2', path: '/admin/products' },
        { name: 'Categories', icon: 'category', path: '/admin/categories' },
        { name: 'Customers', icon: 'group', path: '/admin/customers' },
        { name: 'Articles', icon: 'article', path: '/admin/articles' },
        { name: 'Analytics', icon: 'analytics', path: '/admin/analytics' },
    ];

    const settingsItems = [
        { name: 'General', icon: 'settings', path: '/admin/settings' },
    ];

    const userInitials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || 'AD';

    return (
        <aside className="w-64 hidden lg:flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl h-screen sticky top-0 z-40">
            <div className="p-6 flex items-center gap-3 border-b border-white/5 h-20">
                <Link to="/" className="flex items-center gap-3 group">
                    {settings?.logoUrl ? (
                        <div className="h-8 flex items-center justify-center">
                            <img src={settings.logoUrl} alt={settings.storeName} className="h-full w-auto object-contain" />
                        </div>
                    ) : (
                        <div className="size-8 text-white group-hover:scale-110 transition-transform">
                            <svg className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
                            </svg>
                        </div>
                    )}
                    <span className="text-xl font-bold tracking-tight text-white group-hover:text-primary-light transition-colors">{settings?.storeName ? `${settings.storeName} Admin` : 'Admin'}</span>
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                ? 'bg-primary/20 text-white font-medium shadow-[0_0_15px_rgba(255,0,127,0.2)] border border-primary/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined transition-colors group-hover:text-primary">
                            {item.icon}
                        </span>
                        <span className="flex-1">{item.name}</span>
                        {item.badge > 0 && (
                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-[10px] font-black text-white shadow-[0_0_10px_rgba(255,0,127,0.5)]">
                                {item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}

                <div className="pt-6 mt-6 border-t border-white/5">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Settings</p>
                    {settingsItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? 'bg-primary/20 text-white font-medium shadow-[0_0_15px_rgba(255,0,127,0.2)] border border-primary/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined transition-colors group-hover:text-primary">
                                {item.icon}
                            </span>
                            {item.name}
                        </NavLink>
                    ))}
                </div>
            </nav>

            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="size-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold ring-1 ring-white/20 text-white shadow-inner">
                        {userInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{profile?.full_name || user?.email?.split('@')[0] || 'Admin'}</p>
                        <p className="text-[10px] text-gray-500 truncate uppercase mt-0.5 tracking-wider font-bold">Administrator</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="text-gray-500 hover:text-primary-light transition-colors"
                        title="Sign Out"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
