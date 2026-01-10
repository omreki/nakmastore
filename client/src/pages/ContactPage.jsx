import React, { useState } from 'react';
import SEO from '../components/SEO';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { emailService } from '../services/emailService';
import { motion } from 'framer-motion';
import { Instagram, Twitter, Facebook } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const ContactPage = () => {
    const { settings } = useStoreSettings();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState({ loading: false, success: false, error: null });
    const { notify } = useNotification();

    const ensureAbsoluteUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, success: false, error: null });

        try {
            const result = await emailService.sendInquiryEmail(settings.supportEmail, formData);
            if (result.success) {
                setStatus({ loading: false, success: true, error: null });
                setFormData({ name: '', email: '', message: '' });
            } else {
                throw new Error(result.error || 'Failed to send message');
            }
        } catch (err) {
            setStatus({ loading: false, success: false, error: err.message });
        }
    };

    return (
        <div className="bg-[#30136a] min-h-screen text-white font-['Manrope'] pt-24 md:pt-32 pb-20">
            <SEO
                title={`Contact Us | ${settings.storeName}`}
                description={`Get in touch with ${settings.storeName} for support, inquiries, or feedback.`}
            />

            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Compact Info Section */}
                    <div className="space-y-12">
                        <div>
                            <span className="text-primary-light text-xs font-black uppercase tracking-[0.4em] mb-4 block">Contact us</span>
                            <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[0.9] mb-6">
                                Reach <span className="text-white/20 italic font-medium">Out</span>
                            </h1>
                            <p className="text-gray-500 text-lg font-medium max-w-md leading-relaxed">
                                Our dedicated team is here to assist you with elegance and care.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary-light group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-0.5">Email Address</p>
                                    <p className="text-lg font-bold">{settings.supportEmail}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary-light group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-[20px]">call</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-0.5">Direct Line</p>
                                    <p className="text-lg font-bold">{settings.contactPhone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary-light group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-[20px]">location_on</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-0.5">Our Studio</p>
                                    <p className="text-lg font-bold leading-tight">{settings.contactAddress || 'Nakma Store, Nairobi'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {settings.operatingHours && (
                                <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary-light mb-4">Hours of Operation</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm font-bold">
                                            <span className="text-gray-500 uppercase">Mon — Fri</span>
                                            <span className="text-white">{settings.operatingHours.mon_fri}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold">
                                            <span className="text-gray-500 uppercase">Saturday</span>
                                            <span className="text-white">{settings.operatingHours.sat || 'Closed'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(settings.instagramUrl || settings.twitterUrl || settings.facebookUrl) && (
                                <div className="flex gap-4">
                                    {settings.instagramUrl && (
                                        <a href={ensureAbsoluteUrl(settings.instagramUrl)} target="_blank" rel="noopener noreferrer" data-track="Social Link" data-track-meta={JSON.stringify({ platform: 'Instagram' })} className="size-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all group">
                                            <Instagram size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                                        </a>
                                    )}
                                    {settings.twitterUrl && (
                                        <a href={ensureAbsoluteUrl(settings.twitterUrl)} target="_blank" rel="noopener noreferrer" data-track="Social Link" data-track-meta={JSON.stringify({ platform: 'Twitter' })} className="size-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all group">
                                            <Twitter size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                                        </a>
                                    )}
                                    {settings.facebookUrl && (
                                        <a href={ensureAbsoluteUrl(settings.facebookUrl)} target="_blank" rel="noopener noreferrer" data-track="Social Link" data-track-meta={JSON.stringify({ platform: 'Facebook' })} className="size-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all group">
                                            <Facebook size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Inquiry Form */}
                    <div className="glossy-panel rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 bg-white/[0.02] border border-white/5 relative overflow-hidden ring-1 ring-white/10 shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32"></div>

                        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black italic tracking-tight">Direct Inquiry</h2>
                                <p className="text-gray-500 text-sm font-medium">Please provide your details and we will reach out to you shortly.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Name</label>
                                    <input
                                        required
                                        placeholder="Full Name"
                                        className="glossy-input w-full h-14 rounded-2xl bg-black/40 border-white/5 text-white px-6 outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-bold"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="Email Address"
                                        className="glossy-input w-full h-14 rounded-2xl bg-black/40 border-white/5 text-white px-6 outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-bold"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Message</label>
                                    <textarea
                                        required
                                        rows="4"
                                        placeholder="Briefly describe your inquiry..."
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white p-6 outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-bold resize-none"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                disabled={status.loading}
                                data-track="Contact Inquiry Sent"
                                className="w-full h-16 bg-primary text-white rounded-full font-black uppercase tracking-widest hover:bg-primary-light hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                            >
                                {status.loading ? (
                                    <>
                                        <div className="size-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Message
                                        <span className="material-symbols-outlined text-[18px]">east</span>
                                    </>
                                )}
                            </button>

                            {status.success && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-widest text-center"
                                >
                                    Message Sent. We'll reply shortly.
                                </motion.div>
                            )}

                            {status.error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest text-center"
                                >
                                    Failed to send: {status.error}
                                </motion.div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
