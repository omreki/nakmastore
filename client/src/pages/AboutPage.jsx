import React from 'react';
import { Link } from 'react-router-dom';
import philosophyImage from '../assets/philosophy_image.jpg';
import SEO from '../components/SEO';
import { useStoreSettings } from '../context/StoreSettingsContext';

const AboutPage = () => {
    const { settings, loading } = useStoreSettings();
    const aboutSettings = settings?.aboutPageSettings || {
        hero: { bgImage: '', estText: 'EST. 2024', title: 'Crafting \n African Style', subtitle: 'Nakma Store is a fashion house dedicated to blending heritage with modern design for the modern man.' },
        philosophy: { imageUrl: '', label: 'OUR IDENTITY', title: 'Confidence Meets \n Heritage.', description: 'At Nakma Store, we believe that true style lies in confidence, comfort, and cultural expression. Our collection is designed to empower men through vibrant cultural identity and sophisticated silhouettes.', stats: [{ value: '100%', label: 'Authentic' }, { value: '0', label: 'Compromise' }] },
        coreValues: {
            label: 'CORE VALUES', title: 'Built On Tradition', values: [
                { title: "Cultural Expression", desc: "We celebrate heritage through bold patterns and modern tailoring, ensuring every piece tells a story of identity.", icon: "stylus_note" },
                { title: "Modern Silhouette", desc: "Every cut is intentional, bridging the gap between traditional African tailoring and contemporary global style.", icon: "design_services" },
                { title: "Premium Quality", desc: "Quality isn't a feature; it's our foundation. We source the finest materials for lasting comfort and elegance.", icon: "auto_awesome" }
            ]
        },
        quote: { text: "We didn't set out to build another fashion brand. We set out to create the garments that reflect the soul and confidence of the modern African man.", author: 'Nakma Founders', authorTitle: 'Creative Direction' },
        join: { bgImage: '', title: 'Embrace Your Style', subtitle: 'Step into the next chapter of cultural elegance. Explore our latest collection of unique shirts today.', buttonText: 'Shop Collection', buttonLink: '/shop' }
    };

    return (
        <div className="bg-black min-h-screen text-white font-['Manrope'] pt-20 md:pt-24 pb-20 overflow-x-hidden">
            <SEO
                title="About Us"
                description={aboutSettings.hero.subtitle}
            />
            {/* Ambient Lighting */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-20%] right-[-10%] w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-black/10 rounded-full blur-[120px]"></div>
            </div>

            {/* Hero Section */}
            {aboutSettings.hero.bgImage && (
                <section className="relative w-full h-[500px] md:h-[800px] flex items-center justify-center text-center px-6 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-50"
                        style={{ backgroundImage: `url(${aboutSettings.hero.bgImage})` }}
                    ></div>
                    {/* Sleek Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-80"></div>
                    <div className="absolute inset-0 bg-black/20"></div>

                    <div className="relative z-10 max-w-4xl space-y-6 md:space-y-8">
                        <span className="text-[#b82063] text-xs md:text-sm font-bold uppercase tracking-[0.4em] md:tracking-[0.6em]">{aboutSettings.hero.estText}</span>
                        <h1 className="text-5xl md:text-9xl font-bold tracking-tight leading-[0.9] whitespace-pre-line">
                            {aboutSettings.hero.title.split('\\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <br />}
                                    {i % 2 === 1 ? <span className="text-white/20">{line}</span> : line}
                                </React.Fragment>
                            )) || aboutSettings.hero.title}
                        </h1>
                        <p className="text-white/60 text-base md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
                            {aboutSettings.hero.subtitle}
                        </p>
                    </div>
                </section>
            )}

            {/* Our Philosophy */}
            <section className="max-w-[1440px] mx-auto px-6 md:px-10 py-16 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
                <div className="space-y-10 order-2 lg:order-1">
                    <span className="text-[#b82063] text-sm font-bold uppercase tracking-[0.4em]">{aboutSettings.philosophy.label}</span>
                    <h2 className="text-3xl md:text-6xl font-bold tracking-tight leading-tight whitespace-pre-line">
                        {aboutSettings.philosophy.title.replace('\\n', '\n')}
                    </h2>
                    <p className="text-white/60 text-lg md:text-xl leading-relaxed font-medium">
                        {aboutSettings.philosophy.description}
                    </p>
                    <div className="grid grid-cols-2 gap-8 pt-6">
                        {aboutSettings.philosophy.stats.map((stat, idx) => (
                            <div key={idx} className="space-y-2">
                                <span className="text-4xl font-bold">{stat.value}</span>
                                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative order-1 lg:order-2">
                    <div className="aspect-[4/5] rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl skew-y-3 lg:skew-y-0 lg:rotate-3 hover:rotate-0 transition-transform duration-700">
                        <img
                            src={aboutSettings.philosophy.imageUrl || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=2070&auto=format&fit=crop'}
                            alt="Philosophy"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-black rounded-[32px] -z-10 blur-3xl opacity-20"></div>
                </div>
            </section>

            {/* Core Values */}
            <section className="bg-white/[0.02] border-y border-white/5 py-16 md:py-32">
                <div className="max-w-[1440px] mx-auto px-6 md:px-10">
                    <div className="text-center space-y-4 mb-12 md:mb-20">
                        <span className="text-[#b82063] text-sm font-bold uppercase tracking-[0.4em]">{aboutSettings.coreValues.label}</span>
                        <h2 className="text-3xl md:text-6xl font-bold tracking-tight italic">{aboutSettings.coreValues.title}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {aboutSettings.coreValues.values.map((value, idx) => (
                            <div key={idx} className="bg-white/[0.03] border border-white/10 p-8 md:p-12 rounded-[32px] md:rounded-[40px] hover:bg-primary/10 hover:border-[#b82063]/30 transition-all group">
                                <span className="material-symbols-outlined text-4xl text-[#b82063] mb-6 md:mb-8 group-hover:scale-110 transition-transform">{value.icon}</span>
                                <h3 className="text-xl md:text-2xl font-bold mb-4">{value.title}</h3>
                                <p className="text-white/50 text-sm md:text-base leading-relaxed font-medium">
                                    {value.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Founders Quote */}
            <section className="max-w-[1440px] mx-auto px-6 md:px-10 py-40 text-center">
                <div className="relative inline-block">
                    <span className="material-symbols-outlined text-6xl text-white/10 absolute -top-12 -left-12">format_quote</span>
                    <blockquote className="text-xl md:text-5xl font-bold tracking-tight leading-tight max-w-4xl mx-auto italic transition-all">
                        "{aboutSettings.quote.text}"
                    </blockquote>
                    <div className="mt-12 flex flex-col items-center">
                        <span className="text-[#b82063] font-bold tracking-widest uppercase text-xs">{aboutSettings.quote.author}</span>
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">{aboutSettings.quote.authorTitle}</span>
                    </div>
                </div>
            </section>

            {/* Join the Movement */}
            {aboutSettings.join.bgImage && (
                <section className="max-w-[1440px] mx-auto px-4 md:px-10 py-10">
                    <div className="relative w-full rounded-[32px] md:rounded-[40px] overflow-hidden bg-black p-8 md:p-24 text-center space-y-8 shadow-2xl group">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
                            style={{ backgroundImage: `url(${aboutSettings.join.bgImage})` }}
                        >
                            {/* Elegant Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent"></div>
                            <div className="absolute inset-0 bg-gradient-to-bl from-black/80 via-transparent to-black/80"></div>
                        </div>
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-4xl md:text-8xl font-bold tracking-tight italic">{aboutSettings.join.title}</h2>
                            <p className="text-white/80 text-lg md:text-xl font-medium max-w-xl mx-auto">
                                {aboutSettings.join.subtitle}
                            </p>
                            <div className="pt-6">
                                <Link to={aboutSettings.join.buttonLink} className="px-12 py-5 bg-white text-black rounded-full font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all inline-block shadow-xl">
                                    {aboutSettings.join.buttonText}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default AboutPage;
