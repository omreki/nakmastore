export const PRODUCT_PAGE_PRESETS = {
    modern: {
        theme: 'modern',
        typography: {
            productTitle: { fontFamily: 'Manrope', fontSize: 48, fontWeight: 900, color: '#ffffff', letterSpacing: -1, textTransform: 'uppercase' },
            price: { fontSize: 32, color: '#ffffff', saleColor: '#b82063', currencyPosition: 'left' },
            description: { fontFamily: 'Manrope', fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 },
            button: { fontFamily: 'Manrope', fontSize: 14, fontWeight: 700, textTransform: 'uppercase' }
        },
        layout: {
            galleryType: 'grid',
            imagePosition: 'left',
            contentRatio: '50/50',
            stickyElements: { addToCart: true, images: true },
            sectionSpacing: 'comfortable'
        },
        visual: {
            primaryColor: '#ff007f',
            backgroundColor: '#000000',
            buttonStyle: 'solid',
            buttonHover: 'lift',
            borderRadius: 'rounded',
            badges: { show: true, position: 'top-left', style: 'solid' }
        },
        sections: {
            visibility: {
                title: true, price: true, description: true, variants: true,
                quantity: true, addToCart: true, specs: true, reviews: true, shipping: true
            },
            accordionMode: true
        }
    },
    minimal: {
        theme: 'minimal',
        typography: {
            productTitle: { fontFamily: 'Inter', fontSize: 32, fontWeight: 500, color: '#ffffff', letterSpacing: 0, textTransform: 'none' },
            price: { fontSize: 24, color: '#ffffff', saleColor: '#ffffff' },
            description: { fontFamily: 'Inter', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 },
            button: { fontFamily: 'Inter', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }
        },
        layout: {
            galleryType: 'single',
            imagePosition: 'left',
            contentRatio: '60/40',
            stickyElements: { addToCart: false, images: true },
            sectionSpacing: 'spacious'
        },
        visual: {
            primaryColor: '#ffffff',
            backgroundColor: '#0a0a0a',
            buttonStyle: 'outline',
            buttonHover: 'darken',
            borderRadius: 'sharp',
            badges: { show: false, position: 'top-left', style: 'solid' }
        },
        sections: {
            visibility: {
                title: true, price: true, description: true, variants: true,
                quantity: true, addToCart: true, specs: true, reviews: false, shipping: false
            },
            accordionMode: false
        }
    },
    bold: {
        theme: 'bold',
        typography: {
            productTitle: { fontFamily: 'Outfit', fontSize: 64, fontWeight: 900, color: '#ffffff', letterSpacing: -2, textTransform: 'uppercase' },
            price: { fontSize: 48, color: '#d86928', saleColor: '#ff0000' },
            description: { fontFamily: 'Outfit', fontSize: 18, color: '#ffffff', lineHeight: 1.4 },
            button: { fontFamily: 'Outfit', fontSize: 16, fontWeight: 900, textTransform: 'uppercase' }
        },
        layout: {
            galleryType: 'carousel',
            imagePosition: 'right',
            contentRatio: '40/60',
            stickyElements: { addToCart: true, images: false },
            sectionSpacing: 'compact'
        },
        visual: {
            primaryColor: '#d86928',
            backgroundColor: '#000000',
            buttonStyle: 'solid',
            buttonHover: 'glow',
            borderRadius: 'pill',
            badges: { show: true, position: 'top-right', style: 'solid' }
        },
        sections: {
            visibility: {
                title: true, price: true, description: true, variants: true,
                quantity: true, addToCart: true, specs: true, reviews: true, shipping: true
            },
            accordionMode: true
        }
    },
    elegant: {
        theme: 'elegant',
        typography: {
            productTitle: { fontFamily: 'Playfair Display', fontSize: 42, fontWeight: 400, color: '#f0f0f0', letterSpacing: 0, textTransform: 'none' },
            price: { fontSize: 28, color: '#d4af37', saleColor: '#d4af37' },
            description: { fontFamily: 'Montserrat', fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 },
            button: { fontFamily: 'Montserrat', fontSize: 12, fontWeight: 500, textTransform: 'uppercase' }
        },
        layout: {
            galleryType: 'grid',
            imagePosition: 'left',
            contentRatio: '50/50',
            stickyElements: { addToCart: false, images: true },
            sectionSpacing: 'spacious'
        },
        visual: {
            primaryColor: '#d4af37',
            backgroundColor: '#121212',
            buttonStyle: 'ghost',
            buttonHover: 'lift',
            borderRadius: 'subtle',
            badges: { show: false, position: 'top-left', style: 'solid' }
        },
        sections: {
            visibility: {
                title: true, price: true, description: true, variants: true,
                quantity: true, addToCart: true, specs: true, reviews: true, shipping: true
            },
            accordionMode: true
        }
    }
};
