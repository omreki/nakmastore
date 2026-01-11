export const PRODUCT_PAGE_PRESETS = {
    noesis: {
        theme: 'noesis',
        name: 'Noesis Essential',
        productImages: {
            fit: 'cover',
            aspectRatio: '1:1',
            desktopWidth: 50,
            mobileWidth: 100,
            position: 'center',
            height: 'auto',
            galleryLayout: 'grid',
            galleryColumns: 4,
            galleryGap: 16,
            thumbnailSize: 100,
            thumbnailRadius: 16,
            mainImageRadius: 32,
            lazyLoad: true,
            zoom: true
        },
        layout: {
            style: 'classic',
            contentRatio: '50/50',
            sectionSpacing: 'comfortable',
            stickyElements: { addToCart: true, images: true, info: true }
        },
        typography: {
            productTitle: { fontFamily: 'Inter', fontSize: 40, fontWeight: 900, color: '#ffffff', letterSpacing: -1, textTransform: 'uppercase' },
            price: { fontSize: 24, color: '#b02e3b', saleColor: '#b02e3b', currencyPosition: 'left' },
            description: { fontFamily: 'Manrope', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 },
        },
        addToCart: {
            position: 'inline',
            alignment: 'stretch',
            verticalPosition: 'after-quantity',
            paddingVertical: 18,
            paddingHorizontal: 0,
            marginTop: 32,
            marginBottom: 24,
            width: '100%',
            height: 60,
            borderRadius: 50,
            borderWidth: 0,
            showIcon: true,
            iconPosition: 'right',
            styling: {
                background: '#7f1d1d', // Dark Red 900
                text: '#ffffff',
                hoverBackground: '#991b1b', // Red 800
                hoverText: '#ffffff',
                fontSize: 14,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 2
            }
        },
        mobile: {
            separateSettings: true,
            layout: 'scroll',
            stickyButton: true,
            featuredWidth: 100,
            galleryColumns: 1
        },
        advanced: {
            showTrustBadges: true,
            accordionMode: true
        }
    },
    modern: {
        theme: 'modern',
        name: 'Modern Sleek',
        productImages: {
            fit: 'cover',
            aspectRatio: '3:4',
            desktopWidth: 50, // %
            mobileWidth: 100, // %
            position: 'center',
            height: 'auto',
            galleryLayout: 'grid', // grid, scroll, thumbnails
            galleryColumns: 2,
            galleryGap: 4,
            thumbnailSize: 100,
            lazyLoad: true,
            zoom: true
        },
        layout: {
            style: 'classic', // classic, narrow, full, magazine
            contentRatio: '50/50', // 50/50, 60/40, 40/60
            sectionSpacing: 'comfortable', // compact, comfortable, spacious
            stickyInfo: true
        },
        typography: {
            productTitle: { fontFamily: 'Manrope', fontSize: 48, fontWeight: 800, color: '#ffffff', letterSpacing: -1, textTransform: 'uppercase' },
            price: { fontSize: 32, color: '#ffffff', saleColor: '#b82063', currencyPosition: 'left' },
            description: { fontFamily: 'Manrope', fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 },
        },
        addToCart: {
            position: 'inline', // inline, sticky-bottom (mobile)
            alignment: 'stretch', // left, center, right, stretch
            verticalPosition: 'after-variants', // after-price, etc.
            paddingVertical: 16,
            paddingHorizontal: 32,
            marginTop: 24,
            marginBottom: 24,
            width: '100%',
            height: 56,
            borderRadius: 12,
            borderWidth: 0,
            showIcon: true,
            iconPosition: 'left',
            styling: {
                background: '#ff007f',
                text: '#ffffff',
                hoverBackground: '#d10068',
                hoverText: '#ffffff',
                fontSize: 16,
                fontWeight: 700,
                textTransform: 'uppercase'
            }
        },
        mobile: {
            separateSettings: true,
            layout: 'scroll',
            stickyButton: true,
            featuredWidth: 100,
            galleryColumns: 1
        },
        advanced: {
            showTrustBadges: true,
            accordionMode: true
        }
    },
    minimal: {
        theme: 'minimal',
        name: 'Minimal Clean',
        productImages: {
            fit: 'contain',
            aspectRatio: '1:1',
            desktopWidth: 60,
            mobileWidth: 100,
            position: 'center',
            galleryLayout: 'thumbnails',
            galleryColumns: 5,
            galleryGap: 16,
            thumbnailSize: 80,
            lazyLoad: true,
            zoom: true
        },
        layout: {
            style: 'narrow',
            contentRatio: '60/40',
            sectionSpacing: 'spacious',
            stickyInfo: false
        },
        typography: {
            productTitle: { fontFamily: 'Inter', fontSize: 32, fontWeight: 500, color: '#ffffff', letterSpacing: 0, textTransform: 'none' },
            price: { fontSize: 24, color: '#ffffff', saleColor: '#ffffff' },
            description: { fontFamily: 'Inter', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }
        },
        addToCart: {
            position: 'inline',
            alignment: 'stretch',
            verticalPosition: 'after-description',
            paddingVertical: 14,
            paddingHorizontal: 0,
            marginTop: 32,
            marginBottom: 16,
            width: '100%',
            height: 48,
            borderRadius: 0,
            borderWidth: 1,
            showIcon: false,
            styling: {
                background: 'transparent',
                text: '#ffffff',
                border: '#ffffff',
                hoverBackground: '#ffffff',
                hoverText: '#000000',
                fontSize: 13,
                fontWeight: 600,
                textTransform: 'uppercase'
            }
        },
        mobile: {
            separateSettings: true,
            layout: 'grid',
            stickyButton: false,
            featuredWidth: 100
        },
        advanced: {
            showTrustBadges: false,
            accordionMode: false
        }
    },
    bold: {
        theme: 'bold',
        name: 'Bold Magazine',
        productImages: {
            fit: 'cover',
            aspectRatio: '2:3',
            desktopWidth: 45,
            mobileWidth: 100,
            position: 'center',
            galleryLayout: 'grid',
            galleryColumns: 2,
            galleryGap: 8,
            thumbnailSize: 100,
            lazyLoad: true,
            zoom: false
        },
        layout: {
            style: 'magazine',
            contentRatio: '50/50',
            sectionSpacing: 'compact',
            stickyInfo: true
        },
        typography: {
            productTitle: { fontFamily: 'Outfit', fontSize: 64, fontWeight: 900, color: '#ffffff', letterSpacing: -2, textTransform: 'uppercase' },
            price: { fontSize: 48, color: '#d86928', saleColor: '#ff0000' },
            description: { fontFamily: 'Outfit', fontSize: 18, color: '#ffffff', lineHeight: 1.4 }
        },
        addToCart: {
            position: 'inline',
            alignment: 'center',
            verticalPosition: 'after-variants',
            paddingVertical: 20,
            paddingHorizontal: 48,
            marginTop: 40,
            marginBottom: 40,
            width: 'auto',
            height: 64,
            borderRadius: 999,
            borderWidth: 0,
            showIcon: true,
            iconPosition: 'right',
            styling: {
                background: '#d86928',
                text: '#000000',
                hoverBackground: '#ffffff',
                hoverText: '#000000',
                fontSize: 16,
                fontWeight: 900,
                textTransform: 'uppercase'
            }
        },
        mobile: {
            separateSettings: true,
            layout: 'scroll',
            stickyButton: true,
            featuredWidth: 100
        },
        advanced: {
            showTrustBadges: true,
            accordionMode: true
        }
    },
    elegant: {
        theme: 'elegant',
        name: 'Luxury Boutique',
        productImages: {
            fit: 'contain',
            aspectRatio: '3:4',
            desktopWidth: 55,
            mobileWidth: 100,
            position: 'center',
            galleryLayout: 'scroll',
            galleryColumns: 3,
            galleryGap: 24,
            thumbnailSize: 120,
            lazyLoad: true,
            zoom: true
        },
        layout: {
            style: 'classic',
            contentRatio: '50/50',
            sectionSpacing: 'spacious',
            stickyInfo: true
        },
        typography: {
            productTitle: { fontFamily: 'Playfair Display', fontSize: 42, fontWeight: 400, color: '#f0f0f0', letterSpacing: 0, textTransform: 'none' },
            price: { fontSize: 28, color: '#d4af37', saleColor: '#d4af37' },
            description: { fontFamily: 'Montserrat', fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }
        },
        addToCart: {
            position: 'inline',
            alignment: 'right',
            verticalPosition: 'after-price',
            paddingVertical: 12,
            paddingHorizontal: 40,
            marginTop: 24,
            marginBottom: 24,
            width: 'auto',
            height: 48,
            borderRadius: 4,
            borderWidth: 1,
            showIcon: false,
            styling: {
                background: 'transparent',
                text: '#d4af37',
                border: '#d4af37',
                hoverBackground: '#d4af37',
                hoverText: '#000000',
                fontSize: 12,
                fontWeight: 500,
                textTransform: 'uppercase'
            }
        },
        mobile: {
            separateSettings: true,
            layout: 'scroll',
            stickyButton: false,
            featuredWidth: 100
        },
        advanced: {
            showTrustBadges: false,
            accordionMode: true
        }
    }
};
