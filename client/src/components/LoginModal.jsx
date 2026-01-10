import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useStoreSettings } from '../context/StoreSettingsContext';

const LoginModal = () => {
    const { isLoginModalOpen, setIsLoginModalOpen, signIn, signUp } = useAuth();
    const { settings } = useStoreSettings();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset state when modal closes/opens
    useEffect(() => {
        if (!isLoginModalOpen) {
            setError('');
            setEmail('');
            setPassword('');
            setFullName('');
            setLoading(false);
        }
    }, [isLoginModalOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signIn(email, password);
                setIsLoginModalOpen(false);
            } else {
                await signUp(email, password, fullName);
                // Close modal immediately after successful signup - no email verification required
                setIsLoginModalOpen(false);
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isLoginModalOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsLoginModalOpen(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-[1000px] min-h-[600px] glass-panel shadow-2xl rounded-[40px] overflow-hidden flex flex-col lg:flex-row border border-white/10"
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setIsLoginModalOpen(false)}
                        className="absolute top-6 right-6 z-50 size-10 flex items-center justify-center rounded-full bg-black/20 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>

                    {/* Left Panel: Hero Image (Hidden on small screens) */}
                    <div className="relative w-full lg:w-5/12 hidden lg:block overflow-hidden bg-black">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] hover:scale-110"
                            style={{
                                backgroundImage: settings?.loginPageSettings?.login_bg_url
                                    ? `url('${settings.loginPageSettings.login_bg_url}')`
                                    : (settings?.loginPageSettings?.login_bg_url === '' ? 'none' : "url('/hero-clothes-bg.png')")
                            }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-[#1e0c42]/40 to-transparent"></div>
                        <div className="absolute inset-0 bg-black/20"></div>

                        <div className="absolute bottom-0 left-0 p-12 text-white z-10 w-full">
                            <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white">
                                {settings?.logoUrl ? (
                                    <div className="size-8 flex items-center justify-center">
                                        <img src={settings.logoUrl} alt="" className="w-full h-full object-contain" />
                                    </div>
                                ) : (
                                    <span className="material-symbols-outlined text-xl">apparel</span>
                                )}
                            </div>
                            <h2 className="text-3xl font-black leading-tight mb-4 tracking-tighter uppercase italic">
                                {settings?.loginPageSettings?.login_title ?? (settings?.storeName ? `${settings.storeName} Precision.` : 'Store Precision.')}
                            </h2>
                            <p className="text-white/60 text-sm font-medium leading-relaxed max-w-xs uppercase tracking-widest">
                                {settings?.loginPageSettings?.login_subtitle ?? 'High-performance engineered wear. Designed for the relentless.'}
                            </p>
                        </div>
                    </div>

                    {/* Right Panel: Form */}
                    <div className="w-full lg:w-7/12 p-8 lg:p-12 flex flex-col justify-center relative bg-black">
                        <div className="max-w-[400px] mx-auto w-full">
                            {/* Toggle Sign In / Register */}
                            <div className="flex justify-center mb-10">
                                <div className="bg-white/5 p-1 rounded-full flex w-full border border-white/5 relative">
                                    <button
                                        className={`flex-1 py-3 px-6 rounded-full text-[10px] uppercase tracking-[0.2em] font-black transition-all ${isLogin ? 'bg-black text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        onClick={() => setIsLogin(true)}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        className={`flex-1 py-3 px-6 rounded-full text-[10px] uppercase tracking-[0.2em] font-black transition-all ${!isLogin ? 'bg-black text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                                        onClick={() => setIsLogin(false)}
                                    >
                                        Register
                                    </button>
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-black text-white tracking-widest uppercase italic">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
                                {error && (
                                    <div className={`mt-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${error.includes('successful') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-primary/10 text-[#30136a] border border-[#30136a]/20'}`}>
                                        {error}
                                    </div>
                                )}
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                {!isLogin && (
                                    <div className="group">
                                        <input
                                            className="w-full h-14 px-6 bg-white/[0.03] border border-white/[0.08] rounded-full text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-[#30136a] transition-colors"
                                            placeholder="FULL NAME"
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required={!isLogin}
                                        />
                                    </div>
                                )}
                                <div className="group">
                                    <input
                                        className="w-full h-14 px-6 bg-white/[0.03] border border-white/[0.08] rounded-full text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-[#30136a] transition-colors"
                                        placeholder="EMAIL ADDRESS"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="group">
                                    <input
                                        className="w-full h-14 px-6 bg-white/[0.03] border border-white/[0.08] rounded-full text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-[#30136a] transition-colors"
                                        placeholder="PASSWORD"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                {isLogin && (
                                    <div className="flex items-center justify-end px-2">
                                        <button type="button" className="text-[10px] font-black uppercase tracking-widest text-[#30136a] hover:text-[#ff334b] transition-colors">Forgot Password?</button>
                                    </div>
                                )}

                                <button
                                    className={`mt-4 w-full h-14 bg-white text-black hover:bg-black hover:text-white rounded-full font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 shadow-xl active:scale-95 flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    type="submit"
                                    disabled={loading}
                                >
                                    <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</span>
                                    {!loading && <span className="material-symbols-outlined text-[18px]">east</span>}
                                </button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LoginModal;
