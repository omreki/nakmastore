import React, { useState } from 'react';

const ProductMediaGallery = ({ images = [], productTitle, settings, isNew }) => {
    const isSharp = settings.roundingStyle === 'sharp';
    const s = {
        ...(settings.productImages || {}),
        fit: settings.imageFit || settings.productImages?.fit || 'cover',
        galleryLayout: settings.galleryLayout || settings.productImages?.galleryLayout || 'grid',
        galleryColumns: settings.thumbnailColumns || settings.productImages?.galleryColumns || 4,
        thumbnailSize: settings.thumbnailSize || settings.productImages?.thumbnailSize || 100,
        mainImageRadius: isSharp ? 0 : (settings.mainImageRadius !== undefined ? settings.mainImageRadius : (settings.productImages?.mainImageRadius !== undefined ? settings.productImages.mainImageRadius : 40)),
        thumbnailRadius: isSharp ? 0 : (settings.thumbnailRadius !== undefined ? settings.thumbnailRadius : (settings.productImages?.thumbnailRadius !== undefined ? settings.productImages.thumbnailRadius : 24))
    };
    const [activeIndex, setActiveIndex] = useState(0);

    // Default helpers
    const getAspectRatioClass = (ratio) => {
        switch (ratio) {
            case '1:1': return 'aspect-square';
            case '3:4': return 'aspect-[3/4]';
            case '4:3': return 'aspect-[4/3]';
            case '16:9': return 'aspect-video';
            case '2:3': return 'aspect-[2/3]';
            case '4:5': return 'aspect-[4/5]';
            default: return 'aspect-[3/4]'; // Default
        }
    };

    const getObjectFitClass = (fit) => {
        switch (fit) {
            case 'contain': return 'object-contain';
            case 'cover': return 'object-cover';
            case 'fill': return 'object-fill';
            case 'scale-down': return 'object-scale-down';
            default: return 'object-cover';
        }
    };

    const mainImageStyle = {
        backgroundColor: s.fit === 'contain' ? (s.backgroundColor || '#f5f5f5') : 'transparent',
    };

    const handleThumbnailClick = (idx) => setActiveIndex(idx);

    const renderGallery = () => {
        const layout = s.galleryLayout || 'grid';
        const gap = s.galleryGap || 16;
        const colCount = s.galleryColumns || 4;
        const radius = s.thumbnailRadius !== undefined ? s.thumbnailRadius : 24;

        if (layout === 'scroll') {
            return (
                <div className="flex overflow-x-auto pb-4 scrollbar-hide snap-x" style={{ gap: `${gap}px` }}>
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleThumbnailClick(idx)}
                            className={`flex-shrink-0 snap-start relative overflow-hidden transition-all border ${activeIndex === idx ? 'border-primary ring-2 ring-primary/30 opacity-100 scale-95' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                            style={{
                                width: `${s.thumbnailSize || 100}px`,
                                borderRadius: `${radius}px`
                            }}
                        >
                            <img src={img} alt={`${productTitle} view ${idx + 1}`} className="w-full h-full object-cover aspect-square" />
                        </button>
                    ))}
                </div>
            );
        }

        if (layout === 'magazine') {
            // Pattern: 1 large, 2 small, 1 wide...
            return (
                <div className="flex flex-col gap-6">
                    {/* First image is handled by the main featured view, so we skip it if we want to follow the exactly-like-image pattern */}
                    {/* Actually, in the image, the featured image IS the first one. */}
                    {/* The small ones are the 2nd and 3rd. */}
                    {/* The wide one is the 4th. */}

                    {images.length > 1 && (
                        <div className="grid grid-cols-2 gap-6">
                            {images.slice(1, 3).map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.02]">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}

                    {images.length > 3 && (
                        <div className="aspect-[21/9] rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.02]">
                            <img src={images[3]} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Remaining images in a standard grid */}
                    {images.length > 4 && (
                        <div className="grid grid-cols-3 gap-6">
                            {images.slice(4).map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.02]">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Standard Grid / Thumbnails
        return (
            <div
                className="grid"
                style={{
                    gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                    gap: `${gap}px`
                }}
            >
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleThumbnailClick(idx)}
                        className={`relative overflow-hidden transition-all w-full aspect-square border ${activeIndex === idx ? 'border-primary ring-2 ring-primary/30 opacity-100' : 'border-white/5 opacity-50 hover:opacity-100'}`}
                        style={{ borderRadius: `${radius}px` }}
                    >
                        <img
                            src={img}
                            alt={`${productTitle} - ${idx}`}
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 w-full h-full">
            {/* Main Featured Image */}
            <div
                className={`relative w-full overflow-hidden group ${getAspectRatioClass(s.aspectRatio)}`}
                style={{ borderRadius: `${s.mainImageRadius !== undefined ? s.mainImageRadius : 40}px` }}
            >
                {/* Badge Overlay */}
                <div className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-2xl">
                    Best Seller
                </div>

                {isNew && (
                    <div className="absolute top-6 right-6 z-10 px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-2xl">
                        New Arrivals
                    </div>
                )}

                <img
                    src={images[activeIndex] || 'https://via.placeholder.com/800'}
                    alt={productTitle}
                    className={`w-full h-full transition-transform duration-1000 ${getObjectFitClass(s.fit)} group-hover:scale-105`}
                    style={mainImageStyle}
                />

                {/* Navigation Arrows */}
                {images.length > 1 && s.galleryLayout !== 'magazine' && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
                            className="absolute left-6 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110 flex items-center justify-center border border-white/10"
                        >
                            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
                            className="absolute right-6 top-1/2 -translate-y-1/2 size-12 rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110 flex items-center justify-center border border-white/10"
                        >
                            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                        </button>
                    </>
                )}
            </div>

            {/* Gallery Below */}
            {images.length > 1 && (
                <div className="w-full">
                    {renderGallery()}
                </div>
            )}
        </div>
    );
};

export default ProductMediaGallery;
