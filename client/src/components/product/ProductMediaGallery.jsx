import React, { useState } from 'react';

const ProductMediaGallery = ({ images = [], productTitle, settings, isNew }) => {
    const s = {
        ...(settings.productImages || {}),
        fit: settings.imageFit || settings.productImages?.fit || 'cover',
        galleryLayout: settings.galleryLayout || settings.productImages?.galleryLayout || 'grid',
        galleryColumns: settings.thumbnailColumns || settings.productImages?.galleryColumns || 4,
        thumbnailSize: settings.thumbnailSize || settings.productImages?.thumbnailSize || 100,
        mainImageRadius: settings.mainImageRadius !== undefined ? settings.mainImageRadius : (settings.productImages?.mainImageRadius !== undefined ? settings.productImages.mainImageRadius : 0),
        thumbnailRadius: settings.thumbnailRadius !== undefined ? settings.thumbnailRadius : (settings.productImages?.thumbnailRadius !== undefined ? settings.productImages.thumbnailRadius : 0)
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
        const gap = s.galleryGap || 8;
        const colCount = s.galleryColumns || 4;
        const radius = s.thumbnailRadius !== undefined ? s.thumbnailRadius : 12;

        if (layout === 'scroll') {
            return (
                <div className="flex overflow-x-auto pb-2 scrollbar-hide snap-x" style={{ gap: `${gap}px` }}>
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleThumbnailClick(idx)}
                            className={`flex-shrink-0 snap-start relative overflow-hidden transition-all ${activeIndex === idx ? 'ring-2 ring-primary opacity-100' : 'opacity-50 hover:opacity-100'}`}
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
                        className={`relative overflow-hidden transition-all w-full aspect-square ${activeIndex === idx ? 'ring-2 ring-primary opacity-100' : 'opacity-50 hover:opacity-100'}`}
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
        <div className="flex flex-col gap-4 w-full h-full">
            {/* Main Featured Image */}
            <div
                className={`relative w-full overflow-hidden group ${getAspectRatioClass(s.aspectRatio)}`}
                style={{ borderRadius: `${s.mainImageRadius !== undefined ? s.mainImageRadius : 24}px` }}
            >
                {/* Badge Overlay */}
                {isNew && (
                    <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        New
                    </div>
                )}
                {/* Zoom Icon (Optional) */}
                {s.zoom && (
                    <div className="absolute top-4 right-4 z-10 size-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md pointer-events-none">
                        <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                    </div>
                )}

                <img
                    src={images[activeIndex] || 'https://via.placeholder.com/800'}
                    alt={productTitle}
                    className={`w-full h-full transition-transform duration-700 ${getObjectFitClass(s.fit)} ${s.zoom ? 'cursor-zoom-in group-hover:scale-105' : ''}`}
                    style={mainImageStyle}
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110"
                        >
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveIndex(prev => prev === images.length - 1 ? 0 : prev + 1); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110"
                        >
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
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
