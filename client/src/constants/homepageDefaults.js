export const formatSectionTitle = (title = '') => title
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const PRODUCT_SOURCES = [
    { value: 'all', label: 'All products' },
    { value: 'new_arrivals', label: 'New arrivals only' },
    { value: 'category', label: 'Specific category' },
];

export const DEFAULT_HOMEPAGE_SECTIONS = [
    {
        id: 'new-arrivals',
        title: 'New Arrivals',
        subtitle: 'Elevated African style for the modern man.',
        columnsPerRow: 6,
        rows: 1,
        productSource: 'new_arrivals',
        categoryId: null,
    },
    {
        id: 'our-store',
        title: 'Our Store',
        subtitle: 'Discover our complete collection.',
        columnsPerRow: 6,
        rows: 1,
        productSource: 'all',
        categoryId: null,
    },
];

const migrateListingsToSections = (homepageSettings = {}) => {
    const listings = homepageSettings.listings;
    if (!listings) return null;

    return [
        {
            id: 'new-arrivals',
            title: listings.newArrivals?.title || DEFAULT_HOMEPAGE_SECTIONS[0].title,
            subtitle: listings.newArrivals?.subtitle || DEFAULT_HOMEPAGE_SECTIONS[0].subtitle,
            columnsPerRow: listings.newArrivals?.columnsPerRow ?? DEFAULT_HOMEPAGE_SECTIONS[0].columnsPerRow,
            rows: listings.newArrivals?.rows ?? DEFAULT_HOMEPAGE_SECTIONS[0].rows,
            productSource: 'new_arrivals',
            categoryId: null,
        },
        {
            id: 'our-store',
            title: listings.ourStore?.title || DEFAULT_HOMEPAGE_SECTIONS[1].title,
            subtitle: listings.ourStore?.subtitle || DEFAULT_HOMEPAGE_SECTIONS[1].subtitle,
            columnsPerRow: listings.ourStore?.columnsPerRow ?? DEFAULT_HOMEPAGE_SECTIONS[1].columnsPerRow,
            rows: listings.ourStore?.rows ?? DEFAULT_HOMEPAGE_SECTIONS[1].rows,
            productSource: 'all',
            categoryId: null,
        },
    ];
};

export const normalizeSection = (section = {}, index = 0) => {
    const columnsPerRow = Math.min(6, Math.max(2, Number(section.columnsPerRow) || 6));
    const rows = Math.min(6, Math.max(1, Number(section.rows) || 1));
    const productSource = PRODUCT_SOURCES.some((source) => source.value === section.productSource)
        ? section.productSource
        : 'all';

    return {
        id: section.id || `section-${index}`,
        title: section.title || '',
        subtitle: section.subtitle || '',
        columnsPerRow,
        rows,
        productSource,
        categoryId: section.categoryId ?? null,
        batchSize: columnsPerRow * rows,
    };
};

export const normalizeHomepageSections = (homepageSettings = {}) => {
    if (homepageSettings?.sections?.length) {
        return homepageSettings.sections.map((section, index) => normalizeSection(section, index));
    }

    const migrated = migrateListingsToSections(homepageSettings);
    if (migrated?.length) {
        return migrated.map((section, index) => normalizeSection(section, index));
    }

    return DEFAULT_HOMEPAGE_SECTIONS.map((section, index) => normalizeSection(section, index));
};

export const createHomepageSection = (overrides = {}) => normalizeSection({
    id: `section-${Date.now()}`,
    title: 'New Section',
    subtitle: '',
    columnsPerRow: 6,
    rows: 1,
    productSource: 'all',
    categoryId: null,
    ...overrides,
});

export const getSectionConfig = (section = {}) => normalizeSection(section);

export const mergeHomepageSettings = (homepageSettings = {}) => ({
    sections: normalizeHomepageSections(homepageSettings),
    seo: {
        metaTitle: homepageSettings.seo?.metaTitle || '',
        metaDescription: homepageSettings.seo?.metaDescription || '',
    },
    mobileColumns: Number(homepageSettings.mobileColumns) || 2,
});

export const getListingGridClass = (columnsPerRow, mobileColumns = 2) => {
    const mobileClass = Number(mobileColumns) === 1 ? 'grid-cols-1' : 'grid-cols-2';

    const map = {
        2: `${mobileClass}`,
        3: `${mobileClass} sm:grid-cols-3`,
        4: `${mobileClass} sm:grid-cols-3 md:grid-cols-4`,
        5: `${mobileClass} sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5`,
        6: `${mobileClass} sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`,
    };

    return map[columnsPerRow] || map[6];
};
