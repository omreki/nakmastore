import React, { useState } from 'react';

const ProductMediaGallery = ({ images = [], productTitle, settings }) => {
    const s = settings.productImages || {};
    const [activeIndex, setActiveIndex] = useState(0);

    // Default helpers
    const getAspectRatioClass = (ratio) => {
        switch (ratio) {
            case '1:1': return 'aspect-square';
            case '3:4': return 'aspect-[3/4]';
            case '4:3': return 'aspect-[4/3]';
            case '16:9': return 'aspect-video';
            case '2:3': return 'aspect-[2/3]';
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

    const aspectRatioStyle = s.aspectRatio === 'free' ? {} : {}; // Tailwind handles aspect ratio classes well, usage depends on support

    // In Tailwind v3, aspect-ratio is standard.
    // However, if we need specific custom aspect ratio support not in standard classes, we might use inline style.

    const mainImageStyle = {
        // If 'contain', we show background
        backgroundColor: s.fit === 'contain' ? (s.backgroundColor || '#f5f5f5') : 'transparent',
    };

    const handleThumbnailClick = (idx) => setActiveIndex(idx);

    // Layout Logic
    // If layout is "Narrow Vertical", the main image might be smaller width.
    // The parent container in ProductDetailView controls the width of this whole component relative to the details.
    // BUT, within this component, we controlled the "Featured Image" vs "Gallery" layout.

    // Gallery Styles
    const renderGallery = () => {
        const layout = s.galleryLayout || 'grid';
        const gap = s.galleryGap || 8;
        const colCount = s.galleryColumns || 4;

        if (layout === 'scroll') {
            return (
                <div className="flex overflow-x-auto pb-2 scrollbar-hide snap-x" style={{ gap: `${gap}px` }}>
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleThumbnailClick(idx)}
                            className={`flex-shrink-0 snap-start relative overflow-hidden transition-all ${activeIndex === idx ? 'ring-2 ring-primary opacity-100' : 'opacity-70 hover:opacity-100'}`}
                            style={{
                                width: `${s.thumbnailSize || 100}px`,
                                borderRadius: `${s.thumbnailRadius || 0}px`
                            }}
                        >
                            <img src={img} alt={`${productTitle} view ${idx + 1}`} className="w-full h-full object-cover aspect-square" />
                        </button>
                    ))}
                </div>
            );
        }

        // Grid / Thumbnails
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
                        className={`relative overflow-hidden transition-all w-full ${activeIndex === idx ? 'ring-2 ring-primary' : 'hover:opacity-80'}`}
                        style={{ borderRadius: `${s.thumbnailRadius || 0}px` }}
                    >
                        <img
                            src={img}
                            alt={`${productTitle} - ${idx}`}
                            className="w-full h-full object-cover aspect-square"
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4 w-full h-full">
            {/* Main Featured Image */}
            <div
                className={`relative w-full overflow-hidden group ${getAspectRatioClass(s.aspectRatio)}`}
                style={{ borderRadius: `${s.mainImageRadius || 0}px` }}
            >
                <img
                    src={images[activeIndex] || 'https://via.placeholder.com/800'}
                    alt={productTitle}
                    className={`w-full h-full transition-transform duration-500 ${getObjectFitClass(s.fit)} ${s.zoom ? 'group-hover:scale-110 cursor-zoom-in' : ''}`}
                    style={mainImageStyle}
                />

                {/* Navigation Arrows (Optional, only if multiple images) */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
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
