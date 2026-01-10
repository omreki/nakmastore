import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useStoreSettings } from '../context/StoreSettingsContext';

const SEO = ({
    title,
    description,
    keywords,
    image,
    type = 'website',
    articleData,
    productData,
    children
}) => {
    const { pathname } = useLocation();
    const { settings } = useStoreSettings();
    const siteUrl = settings?.siteUrl || 'https://nakma.co';
    const fullUrl = `${siteUrl}${pathname}`;

    const seoSettings = settings?.seoSettings || {};
    const siteName = settings?.storeName || 'Nakma Store';

    const defaultTitle = seoSettings.metaTitle || `${siteName} | Crafting Unique African Style`;
    const defaultDescription = seoSettings.metaDescription || 'Nakma Store is a premium fashion house dedicated to unique, high-quality African-inspired men’s shirts. Blending heritage with modern design.';
    const defaultKeywords = seoSettings.keywords || 'african fashion, men shirts, printed shirts, nakma, african tailoring';
    const defaultImage = `${siteUrl}/hero-bg.png`; // Fallback to hero background

    const metaTitle = title ? `${title} | ${siteName}` : defaultTitle;
    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords || defaultKeywords;
    const metaImage = image || defaultImage;

    // Handle Google Verification (extract content if full tag provided)
    let googleVerificationContent = seoSettings.googleSiteVerification;
    if (googleVerificationContent && googleVerificationContent.includes('<meta')) {
        const match = googleVerificationContent.match(/content="([^"]*)"/);
        if (match) googleVerificationContent = match[1];
    }

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={metaKeywords} />
            {googleVerificationContent && (
                <meta name="google-site-verification" content={googleVerificationContent} />
            )}
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph Tags */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter Card Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />

            {/* Structured Data (JSON-LD) */}
            {productData && (
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org/",
                        "@type": "Product",
                        "name": productData.name,
                        "image": productData.image,
                        "description": productData.description,
                        "brand": {
                            "@type": "Brand",
                            "name": siteName
                        },
                        "offers": {
                            "@type": "Offer",
                            "url": fullUrl,
                            "priceCurrency": productData.currency || "USD",
                            "price": productData.price,
                            "availability": productData.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                        }
                    })}
                </script>
            )}

            {children}
        </Helmet>
    );
};

export default SEO;
