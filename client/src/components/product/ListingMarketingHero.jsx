import React, { useEffect, useState } from 'react';
import { LISTING_HERO_SURFACE_CLASS, SHOP_MARKETING_MESSAGES } from '../../constants/productListingStyles';

const ListingMarketingHero = ({
    messages = SHOP_MARKETING_MESSAGES,
    imageUrl,
    imageAlt = 'Shop collection',
    eyebrow = 'Nakma collection',
    intervalMs = 5000,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (messages.length <= 1) return undefined;

        const rotateTimer = setInterval(() => {
            setIsVisible(false);
            window.setTimeout(() => {
                setActiveIndex((current) => (current + 1) % messages.length);
                setIsVisible(true);
            }, 280);
        }, intervalMs);

        return () => clearInterval(rotateTimer);
    }, [messages.length, intervalMs]);

    const activeMessage = messages[activeIndex] || messages[0];

    return (
        <div className="layout-container mb-8 md:mb-12">
            <div className={`${LISTING_HERO_SURFACE_CLASS} overflow-hidden bg-white/[0.02]`}>
                <div className="relative min-h-[200px] sm:min-h-[240px] md:min-h-[320px]">
                    {imageUrl && (
                        <div className="absolute inset-0">
                            <img
                                src={imageUrl}
                                alt={imageAlt}
                                className="h-full w-full object-cover object-center"
                            />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-center px-5 py-8 sm:px-8 md:px-14 md:py-12">
                        <div
                            className={`w-full max-w-3xl transition-all duration-300 ease-out ${
                                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                            }`}
                            aria-live="polite"
                        >
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-primary md:text-xs md:tracking-[0.35em]">
                                {eyebrow}
                            </p>
                            <h1 className="mb-3 text-xl font-black leading-tight tracking-tight text-white sm:text-2xl md:text-4xl lg:text-5xl">
                                {activeMessage.title}
                            </h1>
                            <p className="max-w-xl text-sm font-medium leading-relaxed text-white/75 sm:text-base md:text-lg md:leading-relaxed">
                                {activeMessage.subtitle}
                            </p>
                        </div>

                        {messages.length > 1 && (
                            <div className="relative z-10 mt-6 flex items-center gap-2 md:mt-8">
                                {messages.map((message, index) => (
                                    <button
                                        key={message.title}
                                        type="button"
                                        aria-label={`Show message ${index + 1}`}
                                        onClick={() => {
                                            setIsVisible(false);
                                            setTimeout(() => {
                                                setActiveIndex(index);
                                                setIsVisible(true);
                                            }, 180);
                                        }}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            index === activeIndex
                                                ? 'w-8 bg-primary'
                                                : 'w-2 bg-white/30 hover:bg-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingMarketingHero;
