import React, { useState, useEffect } from 'react';

const OptimizedImage = ({
    src,
    alt,
    className = '',
    width,
    height,
    priority = false,
    fill = false,
    style = {},
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);

    // Helper to inject Supabase transformation params
    const getOptimizedUrl = (url, w, h) => {
        if (!url) return '';
        if (typeof url !== 'string') return url;

        // Skip data URLs or external blobs if appropriate
        if (url.startsWith('data:') || url.startsWith('blob:')) return url;

        // Check for Supabase Storage URL
        // Example: https://xyz.supabase.co/storage/v1/object/public/...
        if (url.includes('supabase') && url.includes('/storage/v1/object/public')) {
            const hasParams = url.includes('?');
            const separator = hasParams ? '&' : '?';

            // Define transformation
            let params = `width=${w}&quality=80&format=webp`;
            if (h) params += `&height=${h}`;

            // Avoid duplicating params if they exist (naive check)
            if (url.includes('format=webp')) return url;

            return `${url}${separator}${params}`;
        }

        return url; // Return original if not optimizable storage
    };

    const finalSrc = (width && !error) ? getOptimizedUrl(src, width, height) : src;

    // Handle initial cache check
    useEffect(() => {
        const img = new Image();
        img.src = finalSrc;
        if (img.complete) {
            setIsLoaded(true);
        }
    }, [finalSrc]);

    return (
        <img
            src={finalSrc}
            alt={alt}
            className={`${className} transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            onLoad={() => setIsLoaded(true)}
            onError={() => setError(true)}
            width={width}
            height={height}
            style={fill ? { ...style, position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'cover' } : style}
            {...props}
        />
    );
};

export default OptimizedImage;
