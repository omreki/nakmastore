import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import CategoriesDropdown from './CategoriesDropdown';

const NavBarDropdown = ({ item, triggerClass }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative group" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <div className={`cursor-pointer flex items-center gap-1 ${triggerClass}`}>
                {item.label}
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-xl flex flex-col gap-1 z-50"
                    >
                        {item.children?.map((child, idx) => (
                            <Link key={idx} to={child.path} className="block px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                {child.label}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Navbar = () => {
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const location = useLocation();
    const navigate = useNavigate();
    const { getCartCount, setIsCartOpen } = useCart();
    const { user, signOut, isAdmin, setIsLoginModalOpen } = useAuth();
    const { settings, loading } = useStoreSettings();
    const cartCount = getCartCount();
    const navItems = settings.navigationSettings?.filter(i => i.visible) || [];

    const isHomePage = location.pathname === '/';

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setIsMenuOpen(false);
        }
    };

    const MobileNavItem = ({ item, delay }) => {
        const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

        if (item.type === 'dropdown') {
            return (
                <div className="flex flex-col">
                    <button
                        onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
                        className="flex items-center justify-between py-3 border-b border-white/5"
                    >
                        <span className="text-xl font-bold tracking-tight text-white/90 uppercase">{item.label}</span>
                        <span className={`material-symbols-outlined transition-transform duration-300 ${isSubMenuOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    <AnimatePresence>
                        {isSubMenuOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden pl-4 border-l border-white/10 flex flex-col mt-2"
                            >
                                {item.children?.map((child, idx) => (
                                    <Link key={idx} to={child.path} onClick={() => setIsMenuOpen(false)} className="py-2 text-sm text-gray-400 hover:text-white transition-colors">
                                        {child.label}
                                    </Link>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }

        return (
            <Link
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between py-3 border-b border-white/5 group"
            >
                <span className="text-xl font-bold tracking-tight text-white/90 uppercase group-active:text-primary transition-colors">
                    {item.label}
                </span>
                <span className="material-symbols-outlined text-white/20 text-sm group-active:text-primary">arrow_forward_ios</span>
            </Link>
        );
    };

    if (isHomePage) {
        return (
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[1400px] mx-auto rounded-full backdrop-blur-md border border-white/10 shadow-2xl transition-all duration-300 navbar-gradient-bg">
                <div className="px-6 sm:px-10">
                    <div className="flex items-center justify-between h-14 md:h-16 relative">
                        {/* Logo */}
                        <div className="flex-1 flex justify-start">
                            <Link to="/" className="flex items-center gap-2 group">
                                {loading ? (
                                    <div className="h-8 md:h-9 w-32 bg-white/5 animate-pulse rounded-lg flex items-center"></div>
                                ) : settings.logoUrl ? (
                                    <div className="h-8 md:h-9 flex items-center">
                                        <img src={settings.logoUrl} alt={settings.storeName} className="h-full w-auto object-contain" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="size-6 md:size-7 text-primary transition-transform group-hover:scale-110">
                                            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"></path>
                                            </svg>
                                        </div>
                                        <span className="text-navbar-text text-lg md:text-xl font-bold tracking-tight">{settings.storeName}</span>
                                    </>
                                ))}
                            </Link>
                        </div>

                        {/* Centered Menu */}
                        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                            {navItems.map(item => (
                                item.type === 'dropdown' ? (
                                    <NavBarDropdown
                                        key={item.id}
                                        item={item}
                                        triggerClass="text-navbar-text/60 hover:text-navbar-text text-[13px] font-medium transition-colors uppercase tracking-widest"
                                    />
                                ) : (
                                    <Link
                                        key={item.id}
                                        to={item.path}
                                        className="text-navbar-text/60 hover:text-navbar-text text-[13px] font-medium transition-colors uppercase tracking-widest"
                                    >
                                        {item.label}
                                    </Link>
                                )
                            ))}
                        </div>

                        {/* Icons */}
                        <div className="flex-1 flex justify-end items-center gap-2">
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="p-2 text-white/50 hover:text-white transition-colors relative"
                            >
                                <span className="material-symbols-outlined text-[20px] font-light">shopping_bag</span>
                                {cartCount > 0 && (
                                    <span className="absolute top-[10px] right-[10px] size-1.5 bg-primary rounded-full"></span>
                                )}
                            </button>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2 text-white/50 hover:text-white transition-colors z-[60]"
                            >
                                <span className="material-symbols-outlined text-[24px]">
                                    {isMenuOpen ? 'close' : 'menu'}
                                </span>
                            </button>

                            <div className="hidden md:flex items-center gap-1 md:gap-3">
                                <div className={`relative flex items-center transition-all duration-300 ${isSearchFocused ? 'w-48' : 'w-10'}`}>
                                    <span className={`material-symbols-outlined absolute left-2 text-[20px] font-light transition-colors ${isSearchFocused ? 'text-primary' : 'text-white/50'}`}>search</span>
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleSearch}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => setIsSearchFocused(false)}
                                        className={`bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all ${isSearchFocused ? 'w-full opacity-100' : 'w-10 opacity-0 cursor-pointer'}`}
                                    />
                                </div>
                                {user ? (
                                    <div className="flex items-center gap-2">
                                        {isAdmin && (
                                            <Link to="/admin" className="p-2 text-primary hover:text-primary-light transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">dashboard_customize</span>
                                            </Link>
                                        )}
                                        <Link to="/account" className="p-2 text-white/50 hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[20px] font-light">account_circle</span>
                                        </Link>
                                        <button onClick={signOut} className="p-2 text-white/50 hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[20px] font-light">logout</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsLoginModalOpen(true)}
                                        className="p-2 text-white/50 hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px] font-light">account_circle</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-50 md:hidden flex flex-col h-[100dvh]"
                        >
                            <div className="flex flex-col h-full pt-20 pb-8 overflow-y-auto no-scrollbar">
                                <div className="px-8 mt-4 mb-8">
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">search</span>
                                        <input
                                            type="text"
                                            placeholder="Search heritage..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={handleSearch}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 px-8">
                                    {navItems.map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04, type: 'spring', stiffness: 100 }}
                                        >
                                            <MobileNavItem item={item} delay={i} />
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-auto px-8 space-y-4"
                                >
                                    {user ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <Link
                                                to="/account"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-primary">account_circle</span>
                                                <span className="text-[10px] font-black tracking-widest text-white/60">ACCOUNT</span>
                                            </Link>
                                            {isAdmin ? (
                                                <Link
                                                    to="/admin"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-primary">dashboard_customize</span>
                                                    <span className="text-[10px] font-black tracking-widest uppercase text-white/60">Admin</span>
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                                                    className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-gray-500">logout</span>
                                                    <span className="text-[10px] font-black tracking-widest text-white/60">LOGOUT</span>
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                                                    className="col-span-2 bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-center gap-2 text-gray-500"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                                    <span className="text-[10px] font-black tracking-widest">LOGOUT</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setIsLoginModalOpen(true); setIsMenuOpen(false); }}
                                            className="w-full bg-white text-black h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95"
                                        >
                                            Sign In
                                        </button>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        );
    }

    // Shop Layout Navbar (Full Width)
    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
            <div className="navbar-gradient-bg shadow-sm border-b border-white/10 backdrop-blur-md">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        <div className="flex items-center gap-8 md:gap-12">
                            <Link to="/" className="flex items-center gap-3 text-navbar-text group transition-opacity hover:opacity-80">
                                {loading ? (
                                    <div className="h-9 md:h-11 w-32 bg-white/5 animate-pulse rounded flex items-center"></div>
                                ) : settings.logoUrl ? (
                                    <div className="h-9 md:h-11 flex items-center">
                                        <img src={settings.logoUrl} alt={settings.storeName} className="h-full w-auto object-contain" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-8 h-8 text-primary">
                                            <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(5,150,105,0.6)]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
                                            </svg>
                                        </div>
                                        <span className="text-2xl font-bold tracking-tight text-navbar-text">Nakma Store</span>
                                    </>
                                )}
                            </Link>
                            <nav className="hidden md:flex items-center gap-6">
                                {navItems.map(item => (
                                    item.type === 'dropdown' ? (
                                        <NavBarDropdown
                                            key={item.id}
                                            item={item}
                                            triggerClass="text-navbar-text/60 hover:text-navbar-text text-sm font-medium transition-colors py-1"
                                        />
                                    ) : (
                                        <Link
                                            key={item.id}
                                            to={item.path}
                                            className={`text-sm font-medium transition-colors py-1 ${location.pathname === item.path ? 'text-primary border-b-2 border-primary' : 'text-navbar-text/60 hover:text-navbar-text'}`}
                                        >
                                            {item.label}
                                        </Link>
                                    )
                                ))}
                            </nav>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <div
                                className={`hidden lg:flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 w-64 transition-all shadow-inner backdrop-blur-sm ${isSearchFocused ? 'bg-white/10 ring-2 ring-primary/40 border-primary/50' : ''}`}
                            >
                                <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
                                <input
                                    className="bg-transparent border-none text-sm w-full focus:ring-0 text-gray-200 placeholder-gray-500 p-0 ml-2 focus:outline-none"
                                    placeholder="Search products..."
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearch}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                />
                            </div>
                            <div className="flex items-center gap-1 md:gap-2">
                                <button
                                    onClick={() => setIsMenuOpen(true)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors lg:hidden"
                                >
                                    <span className="material-symbols-outlined">search</span>
                                </button>
                                <button
                                    onClick={() => setIsCartOpen(true)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors relative"
                                >
                                    <span className="material-symbols-outlined">shopping_cart</span>
                                    {cartCount > 0 && (
                                        <span className="absolute top-1.5 right-1 bg-primary text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full shadow-sm">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-[60]"
                                >
                                    <span className="material-symbols-outlined">
                                        {isMenuOpen ? 'close' : 'menu'}
                                    </span>
                                </button>

                                <div className="hidden md:flex items-center gap-1">
                                    {user ? (
                                        <>
                                            {isAdmin && (
                                                <Link to="/admin" className="p-2 text-primary hover:text-primary-light transition-colors">
                                                    <span className="material-symbols-outlined">dashboard_customize</span>
                                                </Link>
                                            )}
                                            <Link to="/account" className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                <span className="material-symbols-outlined">account_circle</span>
                                            </Link>
                                            <button onClick={signOut} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                                <span className="material-symbols-outlined">logout</span>
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsLoginModalOpen(true)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <span className="material-symbols-outlined">account_circle</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay for Shop Style */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-50 md:hidden flex flex-col h-[100dvh]"
                        >
                            <div className="flex flex-col h-full pt-20 pb-8 overflow-y-auto no-scrollbar">
                                <div className="px-8 mt-4 mb-8">
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors">search</span>
                                        <input
                                            type="text"
                                            placeholder="Search heritage..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={handleSearch}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 px-8">
                                    {navItems.map((item, i) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                        >
                                            <MobileNavItem item={item} delay={i} />
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="mt-auto px-8 space-y-4"
                                >
                                    {user ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <Link
                                                to="/account"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-primary">account_circle</span>
                                                <span className="text-[10px] font-black tracking-widest text-white/60">MY PROFILE</span>
                                            </Link>
                                            {isAdmin ? (
                                                <Link
                                                    to="/admin"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-primary">dashboard_customize</span>
                                                    <span className="text-[10px] font-black tracking-widest text-white/60">ADMIN</span>
                                                </Link>
                                            ) : (
                                                <button
                                                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                                                    className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-gray-500">logout</span>
                                                    <span className="text-[10px] font-black tracking-widest text-white/60">LOGOUT</span>
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <button
                                                    onClick={() => { signOut(); setIsMenuOpen(false); }}
                                                    className="col-span-2 bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-center gap-2 text-gray-500"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                                    <span className="text-[10px] font-black tracking-widest">LOGOUT</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setIsLoginModalOpen(true); setIsMenuOpen(false); }}
                                            className="w-full bg-white text-black h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95"
                                        >
                                            Enter Store
                                        </button>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

export default Navbar;
