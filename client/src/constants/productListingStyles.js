export const formatListingProductName = (name = '') => {
    const trimmed = String(name).trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export const LISTING_SURFACE_CLASS = 'border border-white/20 rounded-2xl';

export const LISTING_HERO_SURFACE_CLASS = 'border border-white/20 rounded-2xl md:rounded-[40px]';

export const LISTING_PRODUCT_NAME =
    'text-white font-medium text-sm md:text-base group-hover:text-primary transition-colors tracking-normal normal-case';

export const LISTING_PRICE_WRAPPER =
    `${LISTING_SURFACE_CLASS} inline-flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-2.5 md:py-1.5 w-fit max-w-full`;

export const LISTING_PRODUCT_PRICE =
    'text-white font-bold italic text-xs md:text-sm whitespace-nowrap leading-none';

export const LISTING_PRODUCT_SALE_PRICE =
    'text-primary font-bold italic text-xs md:text-sm whitespace-nowrap leading-none';

export const LISTING_PRODUCT_COMPARE_PRICE =
    'text-white/30 font-medium text-[10px] md:text-xs line-through decoration-1 whitespace-nowrap leading-none';

export const SHOP_MARKETING_MESSAGES = [
    {
        title: 'Timeless African elegance',
        subtitle: 'Discover pieces crafted to celebrate heritage with modern sophistication.',
    },
    {
        title: 'New arrivals every week',
        subtitle: 'Fresh drops designed for comfort, culture, and everyday confidence.',
    },
    {
        title: 'Limited edition collections',
        subtitle: 'Exclusive styles made in small batches — once they sell out, they are gone.',
    },
    {
        title: 'Styled for every occasion',
        subtitle: 'From casual days to statement evenings, find your perfect fit.',
    },
    {
        title: 'Shop the Nakma edit',
        subtitle: 'Curated looks blending bold African inspiration with refined tailoring.',
    },
];
