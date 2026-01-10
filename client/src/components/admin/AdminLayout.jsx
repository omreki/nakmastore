import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { NavLink, Link } from 'react-router-dom';
import { useStoreSettings } from '../../context/StoreSettingsContext';

const AdminLayout = ({ children }) => {
    const { signOut, user, profile } = useAuth();
    const { settings } = useStoreSettings();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const userInitials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || 'AD';

    return (
        <div className="bg-[#30136a] text-white font-display selection:bg-primary/50 min-h-screen flex">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-[#30136a] via-[#1e0c42] to-[#000000]"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#30136a]/10 to-transparent rounded-full blur-[100px] mix-blend-screen"></div>
                <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-[#1e0c42]/10 rounded-full blur-[90px] mix-blend-screen"></div>
            </div>

            <AdminSidebar />

            <div id="admin-scroll-container" className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative scroll-smooth">
                {/* Mobile Header / Top Bar */}
                <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-20 bg-black/40 backdrop-blur-xl border-b border-white/5 lg:hidden">
                    <div className="flex items-center gap-3">
                        {settings?.logoUrl ? (
                            <div className="size-8 flex items-center justify-center">
                                <img src={settings.logoUrl} alt="" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="size-8 text-white">
                                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
                                </svg>
                            </div>
                        )}
                        <span className="text-xl font-bold">{settings?.storeName ? `${settings.storeName} Admin` : 'Admin'}</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 -mr-2 text-gray-400 hover:text-white"
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {isMobileMenuOpen ? 'close' : 'menu'}
                        </span>
                    </button>
                </header>

                {/* Main Content Area */}
                <main className="flex-grow p-6 md:p-10">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </main>

                {/* Footer (Optional, can be added later if needed) */}
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>
                    <div className="relative w-72 h-full bg-[#30136a] border-r border-white/5 shadow-2xl animate-slide-in-left flex flex-col">
                        <div className="p-6 flex items-center justify-between border-b border-white/5 h-20">
                            <span className="text-xl font-bold">{settings?.storeName ? `${settings.storeName} Admin` : 'Admin'}</span>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <nav className="flex-1 py-6 px-4 space-y-2">
                            <NavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <span className="material-symbols-outlined">dashboard</span> Dashboard
                            </NavLink>
                            <NavLink to="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <span className="material-symbols-outlined">shopping_bag</span> Orders
                            </NavLink>
                            <NavLink to="/admin/products" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <span className="material-symbols-outlined">inventory_2</span> Products
                            </NavLink>
                            <NavLink to="/admin/categories" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <span className="material-symbols-outlined">category</span> Categories
                            </NavLink>
                            <NavLink to="/admin/customers" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <span className="material-symbols-outlined">group</span> Customers
                            </NavLink>
                            <NavLink to="/admin/articles" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <span className="material-symbols-outlined">article</span> Articles
                            </NavLink>
                            <NavLink to="/admin/analytics" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <span className="material-symbols-outlined">analytics</span> Analytics
                            </NavLink>
                            <NavLink to="/admin/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                                <span className="material-symbols-outlined">settings</span> Settings
                            </NavLink>
                        </nav>
                        <div className="p-6 border-t border-white/5">
                            <button onClick={signOut} className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors w-full px-4">
                                <span className="material-symbols-outlined text-xl">logout</span>
                                <span className="font-bold text-sm tracking-wide">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLayout;
