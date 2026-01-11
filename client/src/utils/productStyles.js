export const generateProductStyles = (settings) => {
    if (!settings) return {};
    const { typography, layout, visual } = settings;

    // Safety checks
    const safeTypography = typography || {};
    const safeLayout = layout || {};
    const safeVisual = visual || {};

    return {
        // Typography
        titleStyle: {
            fontFamily: safeTypography.productTitle?.fontFamily || 'Manrope',
            fontSize: `${safeTypography.productTitle?.fontSize || 36}px`,
            fontWeight: safeTypography.productTitle?.fontWeight || 900,
            color: safeTypography.productTitle?.color || '#ffffff',
            letterSpacing: `${safeTypography.productTitle?.letterSpacing || 0}px`,
            textTransform: safeTypography.productTitle?.textTransform || 'uppercase',
            lineHeight: 1.1
        },
        priceStyle: {
            fontSize: `${safeTypography.price?.fontSize || 24}px`,
            color: safeTypography.price?.color || '#ffffff',
            fontWeight: 700
        },
        salePriceStyle: {
            fontSize: `${safeTypography.price?.fontSize || 24}px`,
            color: safeTypography.price?.saleColor || '#b82063',
            fontWeight: 700
        },
        descriptionStyle: {
            fontFamily: safeTypography.description?.fontFamily || 'Manrope',
            fontSize: `${safeTypography.description?.fontSize || 16}px`,
            color: safeTypography.description?.color || 'rgba(255,255,255,0.6)',
            lineHeight: safeTypography.description?.lineHeight || 1.6
        },

        // Layout
        containerClass: `flex flex-col ${safeLayout.imagePosition === 'right' ? 'lg:flex-row-reverse' : safeLayout.imagePosition === 'top' ? 'flex-col' : 'lg:flex-row'} gap-8 lg:gap-16 items-start`,

        galleryClass: safeLayout.imagePosition === 'top' ? 'w-full' : (safeLayout.contentRatio === '60/40' ? 'lg:w-[60%]' : safeLayout.contentRatio === '40/60' ? 'lg:w-[40%]' : 'lg:w-[50%]'),

        detailsClass: safeLayout.imagePosition === 'top' ? 'w-full' : (safeLayout.contentRatio === '60/40' ? 'lg:w-[40%]' : safeLayout.contentRatio === '40/60' ? 'lg:w-[60%]' : 'lg:w-[50%]'),

        sectionSpacing: safeLayout.sectionSpacing === 'compact' ? 'space-y-4' : safeLayout.sectionSpacing === 'spacious' ? 'space-y-10' : 'space-y-6',

        // Visual
        primaryColor: safeVisual.primaryColor || '#ff007f',
        borderRadius: safeVisual.borderRadius === 'sharp' ? '0px' : safeVisual.borderRadius === 'pill' ? '9999px' : safeVisual.borderRadius === 'subtle' ? '4px' : '16px',

        buttonStyle: {
            backgroundColor: safeVisual.buttonStyle === 'outline' ? 'transparent' : (safeVisual.primaryColor || '#ff007f'),
            border: safeVisual.buttonStyle === 'outline' ? `2px solid ${safeVisual.primaryColor || '#ff007f'}` : 'none',
            color: safeVisual.buttonStyle === 'outline' ? (safeVisual.primaryColor || '#ff007f') : '#ffffff',
            borderRadius: safeVisual.borderRadius === 'sharp' ? '0px' : safeVisual.borderRadius === 'pill' ? '9999px' : safeVisual.borderRadius === 'subtle' ? '4px' : '16px',
            textTransform: safeTypography.button?.textTransform || 'uppercase',
            fontFamily: safeTypography.button?.fontFamily || 'Manrope',
            fontWeight: safeTypography.button?.fontWeight || 700,
            fontSize: `${safeTypography.button?.fontSize || 14}px`,
            boxShadow: safeVisual.buttonHover === 'glow' ? `0 0 20px ${safeVisual.primaryColor || '#ff007f'}40` : 'none'
        }
    };
};
