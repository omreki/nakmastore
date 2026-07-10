export const NETWORK_DELIVERY_FLAT_RATE = 190;

export const DELIVERY_ROUTES = [
    {
        id: 'mombasa',
        name: 'Mombasa Route',
        locations: [
            'Mlolongo', 'Athi River', 'Kyumvi', 'Salama', 'Sultan Hamud', 'Emali', 'Kibwezi',
            'Voi', 'Mariakani', 'Mazeras', 'Miritini', 'Changawe', 'Mombasa Town',
        ],
    },
    {
        id: 'nakuru',
        name: 'Nakuru Route',
        locations: [
            'Limuru', 'Kimende', 'Mai Mahiu', 'Naivasha', 'Gilgil', 'Kikopey', 'Lanet', 'Nakuru Town',
        ],
    },
    {
        id: 'eldoret',
        name: 'Eldoret Route',
        locations: [
            'Nakuru', 'Salagaa', 'Mau Summit', 'Molo', 'Timboroa', 'Burnt Forest', 'Eldoret Town',
        ],
    },
    {
        id: 'kisumu',
        name: 'Kisumu Route',
        locations: [
            'Nakuru', 'Londiani', 'Chepseon', 'Kericho', 'Kapsoit', 'Awasi', 'Ahero', 'Kisumu Town',
        ],
    },
    {
        id: 'meru',
        name: 'Meru Route',
        locations: [
            'Thika', 'Kabati', 'Kenol', 'Makuyu', 'Makutano Junction', 'Mwea Town', 'Embu',
            'Runyenjes', 'Chuka', 'Chogoria', 'Nkubu', 'Meru Town',
        ],
    },
];

export const DELIVERY_NETWORK_LOCATIONS = DELIVERY_ROUTES.flatMap((route) =>
    route.locations.map((location) => ({
        id: `${route.id}-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        location,
        routeId: route.id,
        routeName: route.name,
    }))
);

export const findNetworkLocation = (query) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return null;

    return DELIVERY_NETWORK_LOCATIONS.find(
        (entry) => entry.location.toLowerCase() === normalized
    ) || null;
};

export const filterNetworkLocations = (query, limit = 12) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || normalized.length < 3) return [];

    return DELIVERY_NETWORK_LOCATIONS
        .filter((entry) => {
            const locationMatch = entry.location.toLowerCase().includes(normalized);
            const routeMatch = entry.routeName.toLowerCase().includes(normalized);
            return locationMatch || routeMatch;
        })
        .slice(0, limit);
};
