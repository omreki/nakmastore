import React from 'react';
import { Link } from 'react-router-dom';
import { useStoreSettings } from '../context/StoreSettingsContext';

const Footer = () => {
    const { settings, loading } = useStoreSettings();

    return (
        <footer className="bg-[#1e0c42] text-white pt-24 pb-12 border-t border-white/5">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center gap-2 mb-8 h-8">
                            {loading ? (
                                <div className="h-8 w-32 bg-white/5 animate-pulse rounded lg:w-40"></div>
                            ) : settings.logoUrl ? (
                                <img src={settings.logoUrl} alt={settings.storeName} className="h-10 w-auto object-contain" />
                            ) : (
                                <>
                                    <div className="size-6 text-primary">
                                        <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"></path>
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">{settings.storeName}</h2>
                                </>
                            )}
                        </div>
                        <p className="text-white/50 text-base leading-relaxed mb-8 max-w-sm">
                            Crafting unique, high-quality African-inspired men’s shirts that seamlessly blend heritage with modern design. Confidence, comfort, and cultural expression.
                        </p>
                        <div className="flex gap-6">
                            <Link to="#" className="text-white/40 hover:text-white transition-colors transition-transform hover:scale-110">
                                <span className="material-symbols-outlined text-[24px]">public</span>
                            </Link>
                            <Link to="#" className="text-white/40 hover:text-white transition-colors transition-transform hover:scale-110">
                                <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                            </Link>
                        </div>
                    </div>

                    {/* Shop Column */}
                    <div>
                        <h3 className="text-xl font-bold mb-8">Shop</h3>
                        <ul className="space-y-4">
                            <li><Link to="/category/vibrant-prints" className="text-white/50 hover:text-white transition-colors text-base font-medium">Vibrant Prints</Link></li>
                            <li><Link to="/category/classic-plains" className="text-white/50 hover:text-white transition-colors text-base font-medium">Classic Plains</Link></li>
                            <li><Link to="/shop" className="text-white/50 hover:text-white transition-colors text-base font-medium">Shop All</Link></li>
                            <li><Link to="/shop" className="text-white/50 hover:text-white transition-colors text-base font-medium">New Arrivals</Link></li>
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h3 className="text-xl font-bold mb-8">Support</h3>
                        <ul className="space-y-4">
                            <li><Link to="/account" className="text-white/50 hover:text-white transition-colors text-base font-medium">My Account</Link></li>
                            <li><Link to="/returns-policy" className="text-white/50 hover:text-white transition-colors text-base font-medium">Returns & Exchanges</Link></li>
                            <li><Link to="/size-guide" className="text-white/50 hover:text-white transition-colors text-base font-medium">Size Guide</Link></li>
                            <li><Link to="/contact" className="text-white/50 hover:text-white transition-colors text-base font-medium">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div>
                        <h3 className="text-xl font-bold mb-8">Join the Inner Circle</h3>
                        <p className="text-white/50 mb-6 text-base font-medium">Subscribe to receive 10% off your first order and exclusive access to new drops.</p>
                        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-base text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all font-medium"
                                placeholder="Enter your email"
                                type="email"
                            />
                            <button className="w-full bg-white text-black font-bold rounded-2xl px-6 py-4 text-base hover:bg-white/90 transition-all transform active:scale-[0.98]" type="submit">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-sm text-white/30 font-medium">© {new Date().getFullYear()} {settings.storeName || 'Nakma Store'}. All rights reserved.</p>
                    <div className="flex gap-10 text-sm text-white/30 font-medium">
                        <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
