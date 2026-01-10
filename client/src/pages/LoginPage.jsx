import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStoreSettings } from '../context/StoreSettingsContext';

const LoginPage = () => {
    const { settings } = useStoreSettings();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signIn(email, password);
                navigate('/');
            } else {
                await signUp(email, password, fullName);
                setError('Registration successful! Please check your email for verification.');
                // Optionally auto-login or redirect
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glossy-bg min-h-screen flex flex-col font-display text-white antialiased selection:bg-[#b82063] selection:text-white relative overflow-x-hidden">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>

            <nav className="w-full px-6 py-4 fixed top-0 left-0 z-50 flex justify-between items-center transition-all duration-300">
                <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                    {settings?.logoUrl ? (
                        <div className="h-8 flex items-center justify-center">
                            <img src={settings.logoUrl} alt={settings.storeName} className="h-full w-auto object-contain" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 text-white">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
                            </svg>
                        </div>
                    )}
                    <h1 className="text-xl font-bold tracking-tight text-white">{settings?.storeName || 'Nakma Store'}</h1>
                </Link>
                <Link to="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                    Need help?
                </Link>
            </nav>

            <div className="flex-1 flex items-center justify-center p-4 pt-24 md:pt-20 lg:p-8 z-10">
                <div className="w-full max-w-[1200px] min-h-[600px] md:min-h-[700px] glass-card shadow-gloss rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Panel: Hero Image */}
                    <div className="relative w-full lg:w-1/2 h-64 lg:h-auto overflow-hidden bg-[#1e0c42] group">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                            style={{
                                backgroundImage: settings?.loginPageSettings?.login_bg_url
                                    ? `url('${settings.loginPageSettings.login_bg_url}')`
                                    : (settings?.loginPageSettings?.login_bg_url === '' ? 'none' : "url('https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2070&auto=format&fit=crop')")
                            }}
                        ></div>
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#7a1542] via-[#b82063]/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-8 lg:p-12 text-white z-10">
                            <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg">
                                <span className="material-symbols-outlined text-2xl">stylus_note</span>
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4 tracking-tight drop-shadow-lg">
                                {settings?.loginPageSettings?.login_title ?? "Crafting African Heritage."}
                            </h2>
                            <p className="text-white/80 text-sm lg:text-base font-light leading-relaxed max-w-md drop-shadow-md">
                                {settings?.loginPageSettings?.login_subtitle ?? `Join the ${settings?.storeName ?? 'Nakma Store'} community to access exclusive prints, track your orders, and manage your profile.`}
                            </p>
                        </div>
                    </div>

                    {/* Right Panel: Form */}
                    <div className="w-full lg:w-1/2 p-6 md:p-8 lg:p-16 flex flex-col justify-center relative bg-gradient-to-br from-white/[0.03] to-transparent">
                        <div className="flex justify-center mb-8">
                            <div className="segmented-control flex p-1 w-full max-w-xs relative">
                                <button
                                    className={`flex-1 py-2.5 px-6 rounded-full text-sm font-semibold transition-all shadow-sm ${isLogin ? 'segment-active' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setIsLogin(true)}
                                >
                                    Sign In
                                </button>
                                <button
                                    className={`flex-1 py-2.5 px-6 rounded-full text-sm font-medium transition-all ${!isLogin ? 'segment-active font-semibold shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                    onClick={() => setIsLogin(false)}
                                >
                                    Register
                                </button>
                            </div>
                        </div>

                        <div className="max-w-[420px] mx-auto w-full">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-white tracking-tight">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
                                <p className="text-gray-400 text-sm mt-2">{isLogin ? 'Enter your details to access your account.' : 'Join us to start your journey.'}</p>
                                {error && (
                                    <div className={`mt-4 p-3 rounded-2xl text-xs font-bold uppercase tracking-widest ${error.includes('successful') ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#b82063]/20 text-[#d44a86] border border-[#b82063]/30'}`}>
                                        {error}
                                    </div>
                                )}
                            </div>

                            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                                {!isLogin && (
                                    <label className="flex flex-col gap-1.5 group">
                                        <span className="text-xs font-semibold text-gray-400 ml-4 group-focus-within:text-primary transition-colors">Full Name</span>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">person</span>
                                            </div>
                                            <input
                                                className="input-gloss w-full h-12 pl-11 pr-4 rounded-full text-sm outline-none focus:ring-0"
                                                placeholder="John Doe"
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required={!isLogin}
                                            />
                                        </div>
                                    </label>
                                )}
                                <label className="flex flex-col gap-1.5 group">
                                    <span className="text-xs font-semibold text-gray-400 ml-4 group-focus-within:text-primary transition-colors">Email Address</span>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">mail</span>
                                        </div>
                                        <input
                                            className="input-gloss w-full h-12 pl-11 pr-4 rounded-full text-sm outline-none focus:ring-0"
                                            placeholder="name@example.com"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </label>
                                <label className="flex flex-col gap-1.5 group">
                                    <span className="text-xs font-semibold text-gray-400 ml-4 group-focus-within:text-primary transition-colors">Password</span>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">lock</span>
                                        </div>
                                        <input
                                            className="input-gloss w-full h-12 pl-11 pr-4 rounded-full text-sm outline-none focus:ring-0"
                                            placeholder="••••••••"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors cursor-pointer" type="button">
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                    </div>
                                </label>

                                {isLogin && (
                                    <div className="flex items-center justify-between px-1">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input type="checkbox" className="peer h-4 w-4 rounded focus:ring-primary/20 cursor-pointer focus:ring-0 focus:ring-offset-0" />
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium group-hover:text-white transition-colors">Remember me</span>
                                        </label>
                                        <Link to="#" className="text-xs font-semibold text-primary hover:text-[#d44a86] hover:underline transition-colors">Forgot Password?</Link>
                                    </div>
                                )}

                                <button
                                    className={`mt-2 w-full h-12 bg-primary hover:bg-[#7a1542] text-white rounded-full font-bold text-sm tracking-wide shadow-[0_0_20px_-5px_rgba(5,150,105,0.5)] transition-all hover:shadow-[0_0_25px_-5px_rgba(5,150,105,0.7)] active:scale-[0.98] flex items-center justify-center gap-2 group ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    type="submit"
                                    disabled={loading}
                                >
                                    <span>{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</span>
                                    {!loading && <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-sm text-gray-500">
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                                    <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-primary hover:underline hover:text-[#d44a86] ml-1">
                                        {isLogin ? "Sign up for free" : "Sign In"}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-4 w-full text-center pointer-events-none z-0 hidden lg:block">
                    <p className="text-xs text-white/30">© {new Date().getFullYear()} {settings?.storeName || 'Nakma Store'}. All rights reserved.</p>
                </div>
            </div>
        </div >
    );
};

export default LoginPage;
