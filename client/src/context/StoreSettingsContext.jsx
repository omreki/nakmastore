import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_LOGIN_SETTINGS = {
    login_bg_url: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2070&auto=format&fit=crop",
    login_title: "Crafting African Heritage.",
    login_subtitle: "Join the community to access exclusive prints, track your orders, and manage your profile."
};

const StoreSettingsContext = createContext();

export const useStoreSettings = () => {
    return useContext(StoreSettingsContext);
};

const stripTimestamp = (url) => {
    if (!url) return '';
    return url.split('?t=')[0];
};

const addTimestamp = (url, timestamp) => {
    if (!url) return '';
    const cleanUrl = stripTimestamp(url);
    return `${cleanUrl}?t=${timestamp}`;
};

export const StoreSettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        storeName: 'Nakma Store',
        supportEmail: 'info@nakmastore.com',
        currency: 'KES',
        timezone: 'EAT',
        showDecimals: false,
        paymentGateways: { stripe: true, paypal: false, paystack: false, cod: true },
        logoUrl: '',
        heroImageUrl: '',
        shippingMethods: [
            { id: 'standard', name: 'Standard Shipping', description: 'Standard Delivery', deliveryTime: '3-5 Days', cost: 5, enabled: true },
            { id: 'express', name: 'Express Shipping', description: 'Priority Delivery', deliveryTime: '1-2 Days', cost: 15, enabled: true },
            { id: 'free', name: 'Free Shipping', description: 'Over KSh 10,000', deliveryTime: '5-7 Days', cost: 0, enabled: true }
        ],
        siteUrl: 'https://nakmastore.com',
        alertEmails: [],
        resendConfig: { apiKey: '', fromEmail: '', verifiedDomain: '' },
        taxesEnabled: true,
        brandSettings: {
            primaryColor: '#ff007f',
            secondaryColor: '#000000',
            labelColor: '#ffffff',
            secondaryTextColor: '#ffffff'
        },
        taxRates: [
            { id: 1, region: 'North America (Standard)', rate: 8.5, compound: false, active: true },
            { id: 2, region: 'European Union (VAT)', rate: 20.0, compound: false, active: true },
            { id: 3, region: 'Asia Pacific (GST)', rate: 10.0, compound: true, active: false }
        ],
        privacyPolicy: '',
        termsOfService: '',
        returnsPolicy: '',
        sizeGuide: '',
        contactPhone: '',
        contactAddress: '',
        operatingHours: { mon_fri: '', sat: '' },
        instagramUrl: '',
        twitterUrl: '',
        facebookUrl: '',
        paymentConfigs: {},
        homepageSettings: {
            hero: {
                subHeadline: "Collection 01",
                headlineLine1: "PRECISION",
                headlineLine2: "APPAREL.",
                descriptionLine1: "Premium African-inspired fashion.",
                descriptionLine2: "Where tradition meets contemporary silhouette. Crafted for the modern man.",
                imageUrl: "",
                hollowText: "",
                hollowTextOpacity: 20,
                hollowTextViewMode: 'fit',
                hollowTextStroke: 1,
                hollowTextPadding: 5
            },
            philosophy: {
                subHeadline: "The Nakma Philosophy",
                quote: "Your style is the reflection of your heritage and confidence.",
                descriptionLine1: "Crafted for the modern African man.",
                descriptionLine2: "Where tradition meets contemporary silhouette.",
                imageUrl: ""
            },
            categories: {
                prints: { title: "Vibrant Prints", subtitle: "Bold African Motifs", imageUrl: "" },
                plains: { title: "Classic Plains", subtitle: "Minimalist Elegance", imageUrl: "" }
            },
            seo: {
                metaTitle: "",
                metaDescription: ""
            }
        },
        navigationSettings: [
            { id: 'shop', label: 'Shop', path: '/shop', type: 'link', visible: true },

            { id: 'accessories', label: 'Accessories', path: '/accessories', type: 'link', visible: true },
            { id: 'about', label: 'About', path: '/about', type: 'link', visible: true },
            { id: 'community', label: 'Community', path: '/community', type: 'link', visible: true },
            { id: 'contact', label: 'Contact', path: '/contact', type: 'link', visible: true }
        ],
        aboutPageSettings: {
            hero: {
                bgImage: "",
                estText: "EST. 2024",
                title: "Beyond \n The Limits",
                subtitle: "Nakma Store is dedicated to blending African heritage with modern design for the contemporary man."
            },
            philosophy: {
                imageUrl: "",
                label: "OUR PHILOSOPHY",
                title: "Heritage Meets \n Modernity.",
                description: "At Nakma, we believe that true style lies in confidence, comfort, and cultural expression. Our collection is designed to empower men through vibrant identity and sophisticated silhouettes.",
                stats: [
                    { value: "100%", label: "Recycled Materials" },
                    { value: "0", label: "Compromise" }
                ]
            },
            coreValues: {
                label: "CORE VALUES",
                title: "Built On Precision",
                values: [
                    {
                        title: "Technical Innovation",
                        desc: "We push the boundaries of fabric science, sourcing materials that offer superior compression and thermal regulation.",
                        icon: "biotech"
                    },
                    {
                        title: "Sovereign Design",
                        desc: "Every seam, every pocket, and every cut is intentional. We strip away the unnecessary to reveal pure function.",
                        icon: "design_services"
                    },
                    {
                        title: "Ethical Craft",
                        desc: "Sustainability isn't a feature; it's our foundation. Our supply chain is as transparent as our vision.",
                        icon: "eco"
                    }
                ]
            },
            quote: {
                text: "We didn't set out to build another sportswear brand. We set out to create the gear that we wished existed—gear that respects the intelligence of the athlete.",
                author: "Charity Lopeyok",
                authorTitle: "Founder / Creative Director"
            },
            join: {
                bgImage: "",
                title: "Ready to Evolve?",
                subtitle: "Step into the next chapter of your athletic journey. Explore the full collection today.",
                buttonText: "Explore Store",
                buttonLink: "/shop"
            }
        },
        loginPageSettings: DEFAULT_LOGIN_SETTINGS,
        seoSettings: {
            metaTitle: "",
            metaDescription: "",
            keywords: "fashion, african prints, men's style, shirts, nakma",
            googleSiteVerification: ""
        },
        checkoutPageSettings: {
            giftMessage: "Exclusive print included with <br /> <span class=\"text-[#b82063]\">your first Nakma</span> purchase."
        },

    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('store_settings_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'store_settings' },
                (payload) => {
                    if (payload.new) {
                        const data = payload.new;
                        // Timestamp to force cache clear
                        const timestamp = new Date().getTime();

                        setSettings({
                            storeName: data.store_name,
                            supportEmail: data.support_email,
                            currency: data.currency,
                            timezone: data.timezone,
                            showDecimals: data.show_decimals !== undefined ? data.show_decimals : false,
                            paymentGateways: data.payment_gateways || { stripe: true, paypal: false, paystack: false, cod: true },
                            logoUrl: data.logo_url ? addTimestamp(data.logo_url, timestamp) : '',
                            heroImageUrl: data.hero_image_url ? addTimestamp(data.hero_image_url, timestamp) : '',
                            shippingMethods: data.shipping_methods || [], // Simplified fallbacks for brevity in update
                            siteUrl: data.site_url || 'https://nakmastore.com',
                            alertEmails: data.alert_emails || [],
                            resendConfig: data.resend_config || { apiKey: '', fromEmail: '', verifiedDomain: '' },
                            // Handle tax_rates legacy (array) vs new (object) format
                            taxesEnabled: Array.isArray(data.tax_rates) ? true : (data.tax_rates?.enabled ?? true),
                            taxRates: Array.isArray(data.tax_rates) ? data.tax_rates : (data.tax_rates?.rates || []),
                            taxConfig: data.tax_rates?.taxConfig || {
                                enabled: Array.isArray(data.tax_rates) ? true : (data.tax_rates?.enabled ?? true),
                                name: 'Tax',
                                type: 'percentage',
                                value: Array.isArray(data.tax_rates) ? (data.tax_rates[0]?.rate || 0) : (data.tax_rates?.rates?.[0]?.rate || 0),
                                showInCheckout: true
                            },
                            privacyPolicy: data.privacy_policy || '',
                            termsOfService: data.terms_of_service || '',
                            returnsPolicy: data.returns_policy || '',
                            sizeGuide: data.size_guide || '',
                            contactPhone: data.contact_phone || '',
                            contactAddress: data.contact_address || '',
                            operatingHours: data.operating_hours || { mon_fri: '', sat: '' },
                            instagramUrl: data.instagram_url || '',
                            twitterUrl: data.twitter_url || '',
                            facebookUrl: data.facebook_url || '',
                            paymentConfigs: data.payment_configs || {},
                            homepageSettings: data.homepage_settings ? {
                                ...data.homepage_settings,
                                hero: {
                                    ...data.homepage_settings.hero,
                                    imageUrl: data.homepage_settings.hero?.imageUrl ? addTimestamp(data.homepage_settings.hero.imageUrl, timestamp) : "",
                                    hollowText: data.homepage_settings.hero?.hollowText || ""
                                },
                                philosophy: {
                                    ...data.homepage_settings.philosophy,
                                    imageUrl: data.homepage_settings.philosophy?.imageUrl ? addTimestamp(data.homepage_settings.philosophy.imageUrl, timestamp) : ""
                                },
                                categories: data.homepage_settings.categories ? {
                                    prints: {
                                        ...data.homepage_settings.categories.prints,
                                        imageUrl: data.homepage_settings.categories.prints?.imageUrl ? addTimestamp(data.homepage_settings.categories.prints.imageUrl, timestamp) : ""
                                    },
                                    plains: {
                                        ...data.homepage_settings.categories.plains,
                                        imageUrl: data.homepage_settings.categories.plains?.imageUrl ? addTimestamp(data.homepage_settings.categories.plains.imageUrl, timestamp) : ""
                                    }
                                } : {
                                    prints: { title: "Vibrant Prints", subtitle: "Bold African Motifs", imageUrl: "" },
                                    plains: { title: "Classic Plains", subtitle: "Minimalist Elegance", imageUrl: "" }
                                },
                                seo: {
                                    metaTitle: data.homepage_settings.seo?.metaTitle || "",
                                    metaDescription: data.homepage_settings.seo?.metaDescription || ""
                                }
                            } : {
                                hero: {
                                    subHeadline: "Collection 01",
                                    headlineLine1: "PRECISION",
                                    headlineLine2: "APPAREL.",
                                    descriptionLine1: "Premium African-inspired fashion.",
                                    descriptionLine2: "Where tradition meets contemporary silhouette. Crafted for the modern man. Built for the cultural expression.",
                                    imageUrl: "/hero-clothes-bg.png",
                                    hollowText: ""
                                },
                                philosophy: {
                                    subHeadline: "The Nakma Philosophy",
                                    quote: "Your style is the reflection of your heritage and confidence.",
                                    descriptionLine1: "Crafted for the modern African man.",
                                    descriptionLine2: "Where tradition meets contemporary silhouette.",
                                    imageUrl: "/philosophy-bg.png"
                                },
                                categories: {
                                    prints: { title: "Vibrant Prints", subtitle: "Bold African Motifs", imageUrl: "" },
                                    plains: { title: "Classic Plains", subtitle: "Minimalist Elegance", imageUrl: "" }
                                },
                                seo: {
                                    metaTitle: "",
                                    metaDescription: ""
                                }
                            },
                            aboutPageSettings: data.about_page_settings ? {
                                ...data.about_page_settings,
                                hero: {
                                    ...data.about_page_settings.hero,
                                    bgImage: data.about_page_settings.hero?.bgImage ? addTimestamp(data.about_page_settings.hero.bgImage, timestamp) : ""
                                },
                                philosophy: {
                                    ...data.about_page_settings.philosophy,
                                    imageUrl: data.about_page_settings.philosophy?.imageUrl ? addTimestamp(data.about_page_settings.philosophy.imageUrl, timestamp) : ""
                                },
                                join: {
                                    ...data.about_page_settings.join,
                                    bgImage: data.about_page_settings.join?.bgImage ? addTimestamp(data.about_page_settings.join.bgImage, timestamp) : ""
                                }
                            } : {
                                hero: {
                                    bgImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop",
                                    estText: "EST. 2024",
                                    title: "Beyond \n The Limits",
                                    subtitle: "Nakma is more than apparel. It's a philosophy of constant evolution, engineered for the modern man."
                                },
                                philosophy: {
                                    imageUrl: "",
                                    label: "OUR PHILOSOPHY",
                                    title: "Heritage Meets \n Modernity.",
                                    description: "At Nakma, we believe that true style lies in confidence, comfort, and cultural expression. Our collection is designed to empower men through vibrant identity and sophisticated silhouettes.",
                                    stats: [
                                        { value: "100%", label: "Recycled Materials" },
                                        { value: "0", label: "Compromise" }
                                    ]
                                },
                                coreValues: {
                                    label: "CORE VALUES",
                                    title: "Built On Precision",
                                    values: [
                                        {
                                            title: "Technical Innovation",
                                            desc: "We push the boundaries of fabric science, sourcing materials that offer superior compression and thermal regulation.",
                                            icon: "biotech"
                                        },
                                        {
                                            title: "Sovereign Design",
                                            desc: "Every seam, every pocket, and every cut is intentional. We strip away the unnecessary to reveal pure function.",
                                            icon: "design_services"
                                        },
                                        {
                                            title: "Ethical Craft",
                                            desc: "Sustainability isn't a feature; it's our foundation. Our supply chain is as transparent as our vision.",
                                            icon: "eco"
                                        }
                                    ]
                                },
                                quote: {
                                    text: "We didn't set out to build another fashion brand. We set out to create the pieces that we wished existed—garments that respect the heritage of the modern man.",
                                    author: "Charity Lopeyok",
                                    authorTitle: "Founder / Creative Director"
                                },
                                join: {
                                    bgImage: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop",
                                    title: "Ready to Evolve?",
                                    subtitle: "Step into the next chapter of your athletic journey. Explore the full collection today.",
                                    buttonText: "Explore Store",
                                    buttonLink: "/shop"
                                }
                            },
                            loginPageSettings: data.login_page_settings ? { ...DEFAULT_LOGIN_SETTINGS, ...data.login_page_settings } : DEFAULT_LOGIN_SETTINGS,
                            seoSettings: data.seo_settings || {
                                metaTitle: "",
                                metaDescription: "",
                                keywords: "fashion, african prints, men's style, shirts, nakma",
                                googleSiteVerification: ""
                            },
                            checkoutPageSettings: data.checkout_page_settings || {
                                giftMessage: "Exclusive print included with <br /> <span class=\"text-[#b82063]\">your first Nakma</span> purchase."
                            }
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('store_settings')
                .select('*')
                .single();

            if (error) {
                console.log('Error fetching store settings (using defaults):', error.message);
            } else if (data) {
                const timestamp = new Date().getTime();
                setSettings({
                    storeName: data.store_name,
                    supportEmail: data.support_email,
                    currency: data.currency,
                    timezone: data.timezone,
                    showDecimals: data.show_decimals !== undefined ? data.show_decimals : false,
                    paymentGateways: data.payment_gateways || { stripe: true, paypal: false, paystack: false, cod: true },
                    logoUrl: data.logo_url ? addTimestamp(data.logo_url, timestamp) : '',
                    heroImageUrl: data.hero_image_url ? addTimestamp(data.hero_image_url, timestamp) : '',
                    shippingMethods: data.shipping_methods || [
                        { id: 'standard', name: 'Standard Ground', description: 'Primary Distribution', deliveryTime: '5-7 CYCLES', cost: 5, enabled: true },
                        { id: 'express', name: 'Exosphere Velocity', description: 'Priority Transit', deliveryTime: '2-3 CYCLES', cost: 15, enabled: true },
                        { id: 'free', name: 'Zero-Cost Yield', description: 'Volume Reward Tier', deliveryTime: '10+ CYCLES', cost: 0, enabled: true }
                    ],
                    siteUrl: data.site_url || 'https://nakmastore.com',
                    alertEmails: data.alert_emails || [],
                    resendConfig: data.resend_config || { apiKey: '', fromEmail: '', verifiedDomain: '' },
                    // Removed SMTP settings
                    // Handle tax_rates legacy (array) vs new (object) format
                    taxesEnabled: Array.isArray(data.tax_rates) ? true : (data.tax_rates?.enabled ?? true),
                    taxRates: Array.isArray(data.tax_rates) ? data.tax_rates : (data.tax_rates?.rates || []),
                    taxConfig: data.tax_rates?.taxConfig || {
                        enabled: Array.isArray(data.tax_rates) ? true : (data.tax_rates?.enabled ?? true),
                        name: 'Tax',
                        type: 'percentage',
                        value: Array.isArray(data.tax_rates) ? (data.tax_rates[0]?.rate || 0) : (data.tax_rates?.rates?.[0]?.rate || 0),
                        showInCheckout: true
                    },
                    privacyPolicy: data.privacy_policy || '',
                    termsOfService: data.terms_of_service || '',
                    returnsPolicy: data.returns_policy || '',
                    sizeGuide: data.size_guide || '',
                    contactPhone: data.contact_phone || '',
                    contactAddress: data.contact_address || '',
                    operatingHours: data.operating_hours || { mon_fri: '', sat: '' },
                    instagramUrl: data.instagram_url || '',
                    facebookUrl: data.facebook_url || '',
                    brandSettings: data.brand_settings || {
                        primaryColor: '#ff007f',
                        secondaryColor: '#000000',
                        labelColor: '#ffffff',
                        secondaryTextColor: '#ffffff'
                    },
                    paymentConfigs: data.payment_configs || {},
                    homepageSettings: data.homepage_settings ? {
                        ...data.homepage_settings,
                        hero: {
                            ...data.homepage_settings.hero,
                            imageUrl: data.homepage_settings.hero?.imageUrl ? addTimestamp(data.homepage_settings.hero.imageUrl, timestamp) : "",
                            hollowText: data.homepage_settings.hero?.hollowText || "",
                            hollowTextOpacity: data.homepage_settings.hero?.hollowTextOpacity ?? 20,
                            hollowTextViewMode: data.homepage_settings.hero?.hollowTextViewMode || 'fit',
                            hollowTextStroke: data.homepage_settings.hero?.hollowTextStroke ?? 1,
                            hollowTextPadding: data.homepage_settings.hero?.hollowTextPadding ?? 5
                        },
                        philosophy: {
                            ...data.homepage_settings.philosophy,
                            imageUrl: data.homepage_settings.philosophy?.imageUrl ? addTimestamp(data.homepage_settings.philosophy.imageUrl, timestamp) : ""
                        },
                        categories: data.homepage_settings.categories ? {
                            prints: {
                                ...data.homepage_settings.categories.prints,
                                imageUrl: data.homepage_settings.categories.prints?.imageUrl ? addTimestamp(data.homepage_settings.categories.prints.imageUrl, timestamp) : ""
                            },
                            plains: {
                                ...data.homepage_settings.categories.plains,
                                imageUrl: data.homepage_settings.categories.plains?.imageUrl ? addTimestamp(data.homepage_settings.categories.plains.imageUrl, timestamp) : ""
                            }
                        } : {
                            prints: { title: "Vibrant Prints", subtitle: "Bold African Motifs", imageUrl: "" },
                            plains: { title: "Classic Plains", subtitle: "Minimalist Elegance", imageUrl: "" }
                        },
                        seo: {
                            metaTitle: data.homepage_settings.seo?.metaTitle || "",
                            metaDescription: data.homepage_settings.seo?.metaDescription || ""
                        }
                    } : {
                        hero: {
                            subHeadline: "Collection 2024",
                            headlineLine1: "AFRICAN",
                            headlineLine2: "HERITAGE.",
                            descriptionLine1: "Premium African-inspired fashion.",
                            descriptionLine2: "Where tradition meets contemporary silhouette. Crafted for the modern man.",
                            imageUrl: "",
                            hollowText: "NAKMA"
                        },
                        philosophy: {
                            subHeadline: "The Nakma Philosophy",
                            quote: "Your style is the reflection of your heritage and confidence.",
                            descriptionLine1: "Crafted for the modern African man.",
                            descriptionLine2: "Where tradition meets contemporary silhouette.",
                            imageUrl: ""
                        },
                        categories: {
                            prints: { title: "Vibrant Prints", subtitle: "Bold African Motifs", imageUrl: "" },
                            plains: { title: "Classic Plains", subtitle: "Minimalist Elegance", imageUrl: "" }
                        },
                        seo: {
                            metaTitle: "Nakma Store | Modern African Fashion",
                            metaDescription: "Discover unique African-inspired men's fashion at Nakma Store. Blending heritage with modern design."
                        }
                    },
                    navigationSettings: data.navigation_settings || [
                        { id: 'shop', label: 'Shop', path: '/shop', type: 'link', visible: true, subtitle: 'Global archive' },

                        { id: 'accessories', label: 'Accessories', path: '/accessories', type: 'link', visible: true, subtitle: 'Final details' },
                        { id: 'about', label: 'About', path: '/about', type: 'link', visible: true, subtitle: 'Manifesto' },
                        { id: 'community', label: 'Community', path: '/community', type: 'link', visible: true, subtitle: 'Joined forces' },
                        { id: 'contact', label: 'Contact', path: '/contact', type: 'link', visible: true, subtitle: 'Support core' }
                    ],
                    aboutPageSettings: data.about_page_settings ? {
                        ...data.about_page_settings,
                        hero: {
                            ...data.about_page_settings.hero,
                            bgImage: data.about_page_settings.hero?.bgImage ? `${data.about_page_settings.hero.bgImage}?t=${timestamp}` : ""
                        },
                        philosophy: {
                            ...data.about_page_settings.philosophy,
                            imageUrl: data.about_page_settings.philosophy?.imageUrl ? `${data.about_page_settings.philosophy.imageUrl}?t=${timestamp}` : ""
                        },
                        join: {
                            ...data.about_page_settings.join,
                            bgImage: data.about_page_settings.join?.bgImage ? `${data.about_page_settings.join.bgImage}?t=${timestamp}` : ""
                        }
                    } : {
                        hero: {
                            bgImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop",
                            estText: "EST. 2024",
                            title: "Beyond \n The Limits",
                            subtitle: "Nakma Store is dedicated to blending African heritage with modern design for the contemporary man."
                        },
                        philosophy: {
                            imageUrl: "",
                            label: "OUR PHILOSOPHY",
                            title: "Intellect Meets \n Performance.",
                            description: "At Nakma, we believe that true style lies in confidence, comfort, and cultural expression. Our collection is designed to empower men through vibrant identity and sophisticated silhouettes.",
                            stats: [
                                { value: "100%", label: "Recycled Materials" },
                                { value: "0", label: "Compromise" }
                            ]
                        },
                        coreValues: {
                            label: "CORE VALUES",
                            title: "Built On Precision",
                            values: [
                                {
                                    title: "Technical Innovation",
                                    desc: "We push the boundaries of fabric science, sourcing materials that offer superior compression and thermal regulation.",
                                    icon: "biotech"
                                },
                                {
                                    title: "Sovereign Design",
                                    desc: "Every seam, every pocket, and every cut is intentional. We strip away the unnecessary to reveal pure function.",
                                    icon: "design_services"
                                },
                                {
                                    title: "Ethical Craft",
                                    desc: "Sustainability isn't a feature; it's our foundation. Our supply chain is as transparent as our vision.",
                                    icon: "eco"
                                }
                            ]
                        },
                        quote: {
                            text: "We didn't set out to build another sportswear brand. We set out to create the gear that we wished existed—gear that respects the intelligence of the athlete.",
                            author: "Charity Lopeyok",
                            authorTitle: "Founder / Creative Director"
                        },
                        join: {
                            bgImage: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop",
                            title: "Ready to Evolve?",
                            subtitle: "Step into the next chapter of your athletic journey. Explore the full collection today.",
                            buttonText: "Explore Store",
                            buttonLink: "/shop"
                        }
                    },
                    loginPageSettings: data.login_page_settings ? { ...DEFAULT_LOGIN_SETTINGS, ...data.login_page_settings } : DEFAULT_LOGIN_SETTINGS,
                    seoSettings: data.seo_settings || {
                        metaTitle: "",
                        metaDescription: "",
                        keywords: "fashion, african prints, men's style, shirts, nakma",
                        googleSiteVerification: ""
                    },
                    checkoutPageSettings: data.checkout_page_settings || {
                        giftMessage: "Exclusive print included with <br /> <span class=\"text-[#b82063]\">your first Nakma</span> purchase."
                    },
                    brandSettings: data.brand_settings || {
                        primaryColor: "#ff007f",
                        secondaryColor: "#000000",
                        accentColor: "#d86928",
                        backgroundColor: "#000000",
                        navbarBg: "rgba(0, 0, 0, 0.4)",
                        navbarText: "#ffffff",
                        textMain: "#ffffff",
                        textMuted: "#a1a1aa"
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings) => {
        try {
            setLoading(true);

            // Map camelCase to snake_case for DB
            const dbPayload = {
                store_name: newSettings.storeName,
                support_email: newSettings.supportEmail,
                currency: newSettings.currency,
                timezone: newSettings.timezone,
                payment_gateways: newSettings.paymentGateways,
                shipping_methods: newSettings.shippingMethods,
                show_decimals: newSettings.showDecimals,
                site_url: newSettings.siteUrl,
                alert_emails: newSettings.alertEmails || [],
                resend_config: newSettings.resendConfig || { apiKey: '', fromEmail: '', verifiedDomain: '' },
                logo_url: stripTimestamp(newSettings.logoUrl),
                hero_image_url: stripTimestamp(newSettings.heroImageUrl),
                // Pack tax settings into the tax_rates JSONB column
                tax_rates: {
                    enabled: newSettings.taxesEnabled,
                    rates: newSettings.taxRates || [],
                    taxConfig: newSettings.taxConfig
                },
                privacy_policy: newSettings.privacyPolicy,
                terms_of_service: newSettings.termsOfService,
                returns_policy: newSettings.returnsPolicy,
                size_guide: newSettings.sizeGuide,
                contact_phone: newSettings.contactPhone,
                contact_address: newSettings.contactAddress,
                operating_hours: newSettings.operatingHours,
                instagram_url: newSettings.instagramUrl,
                twitter_url: newSettings.twitterUrl,
                facebook_url: newSettings.facebookUrl,
                brand_settings: newSettings.brandSettings,
                payment_configs: newSettings.paymentConfigs,
                homepage_settings: newSettings.homepageSettings ? {
                    ...newSettings.homepageSettings,
                    hero: {
                        ...newSettings.homepageSettings.hero,
                        imageUrl: stripTimestamp(newSettings.homepageSettings.hero?.imageUrl)
                    },
                    philosophy: {
                        ...newSettings.homepageSettings.philosophy,
                        imageUrl: stripTimestamp(newSettings.homepageSettings.philosophy?.imageUrl)
                    },
                    categories: newSettings.homepageSettings.categories ? {
                        prints: {
                            ...newSettings.homepageSettings.categories.prints,
                            imageUrl: stripTimestamp(newSettings.homepageSettings.categories.prints?.imageUrl)
                        },
                        plains: {
                            ...newSettings.homepageSettings.categories.plains,
                            imageUrl: stripTimestamp(newSettings.homepageSettings.categories.plains?.imageUrl)
                        }
                    } : undefined
                } : undefined,
                about_page_settings: newSettings.aboutPageSettings ? {
                    ...newSettings.aboutPageSettings,
                    hero: {
                        ...newSettings.aboutPageSettings.hero,
                        bgImage: stripTimestamp(newSettings.aboutPageSettings.hero?.bgImage)
                    },
                    philosophy: {
                        ...newSettings.aboutPageSettings.philosophy,
                        imageUrl: stripTimestamp(newSettings.aboutPageSettings.philosophy?.imageUrl)
                    },
                    join: {
                        ...newSettings.aboutPageSettings.join,
                        bgImage: stripTimestamp(newSettings.aboutPageSettings.join?.bgImage)
                    }
                } : undefined,
                navigation_settings: newSettings.navigationSettings,
                login_page_settings: newSettings.loginPageSettings ? {
                    ...newSettings.loginPageSettings,
                    login_bg_url: stripTimestamp(newSettings.loginPageSettings.login_bg_url)
                } : undefined,
                seo_settings: newSettings.seoSettings,
                checkout_page_settings: newSettings.checkoutPageSettings
            };

            // Upsert the single row (id: 1)
            const { data, error } = await supabase
                .from('store_settings')
                .upsert({ id: 1, ...dbPayload, updated_at: new Date().toISOString() })
                .select()
                .single();

            if (error) {
                console.error('Full Supabase update error:', error);
                throw error;
            }

            if (data) {
                const timestamp = new Date().getTime();
                setSettings({
                    storeName: data.store_name,
                    supportEmail: data.support_email,
                    currency: data.currency,
                    timezone: data.timezone,
                    paymentGateways: data.payment_gateways,
                    shippingMethods: data.shipping_methods,
                    showDecimals: data.show_decimals,
                    siteUrl: data.site_url,
                    alertEmails: data.alert_emails || [],
                    resendConfig: data.resend_config || { apiKey: '', fromEmail: '', verifiedDomain: '' },
                    logoUrl: data.logo_url ? addTimestamp(data.logo_url, timestamp) : '',
                    heroImageUrl: data.hero_image_url ? addTimestamp(data.hero_image_url, timestamp) : '',
                    taxesEnabled: Array.isArray(data.tax_rates) ? true : (data.tax_rates?.enabled ?? newSettings.taxesEnabled),
                    taxRates: (Array.isArray(data.tax_rates) ? data.tax_rates : data.tax_rates?.rates) || newSettings.taxRates,
                    taxConfig: data.tax_rates?.taxConfig || newSettings.taxConfig,
                    privacyPolicy: data.privacy_policy || '',
                    termsOfService: data.terms_of_service || '',
                    returnsPolicy: data.returns_policy || '',
                    sizeGuide: data.size_guide || '',
                    contactPhone: data.contact_phone || '',
                    contactAddress: data.contact_address || '',
                    operatingHours: data.operating_hours || { mon_fri: '', sat: '' },
                    instagramUrl: data.instagram_url || '',
                    twitterUrl: data.twitter_url || '',
                    facebookUrl: data.facebook_url || '',
                    paymentConfigs: data.payment_configs || {},
                    homepageSettings: data.homepage_settings ? {
                        ...data.homepage_settings,
                        hero: {
                            ...data.homepage_settings.hero,
                            imageUrl: data.homepage_settings.hero?.imageUrl ? addTimestamp(data.homepage_settings.hero.imageUrl, timestamp) : "",
                        },
                        philosophy: {
                            ...data.homepage_settings.philosophy,
                            imageUrl: data.homepage_settings.philosophy?.imageUrl ? addTimestamp(data.homepage_settings.philosophy.imageUrl, timestamp) : ""
                        },
                        categories: data.homepage_settings.categories ? {
                            prints: {
                                ...data.homepage_settings.categories.prints,
                                imageUrl: data.homepage_settings.categories.prints?.imageUrl ? addTimestamp(data.homepage_settings.categories.prints.imageUrl, timestamp) : ""
                            },
                            plains: {
                                ...data.homepage_settings.categories.plains,
                                imageUrl: data.homepage_settings.categories.plains?.imageUrl ? addTimestamp(data.homepage_settings.categories.plains.imageUrl, timestamp) : ""
                            }
                        } : {
                            prints: { title: "Vibrant Prints", subtitle: "Bold African Motifs", imageUrl: "" },
                            plains: { title: "Classic Plains", subtitle: "Minimalist Elegance", imageUrl: "" }
                        }
                    } : newSettings.homepageSettings,
                    navigationSettings: data.navigation_settings || newSettings.navigationSettings,
                    aboutPageSettings: data.about_page_settings ? {
                        ...data.about_page_settings,
                        hero: {
                            ...data.about_page_settings.hero,
                            bgImage: data.about_page_settings.hero?.bgImage ? addTimestamp(data.about_page_settings.hero.bgImage, timestamp) : ""
                        },
                        philosophy: {
                            ...data.about_page_settings.philosophy,
                            imageUrl: data.about_page_settings.philosophy?.imageUrl ? addTimestamp(data.about_page_settings.philosophy.imageUrl, timestamp) : ""
                        },
                        join: {
                            ...data.about_page_settings.join,
                            bgImage: data.about_page_settings.join?.bgImage ? addTimestamp(data.about_page_settings.join.bgImage, timestamp) : ""
                        }
                    } : newSettings.aboutPageSettings,
                    loginPageSettings: data.login_page_settings ? { ...DEFAULT_LOGIN_SETTINGS, ...data.login_page_settings } : newSettings.loginPageSettings,
                    seoSettings: data.seo_settings || newSettings.seoSettings,
                    checkoutPageSettings: data.checkout_page_settings || newSettings.checkoutPageSettings,
                    brandSettings: data.brand_settings || newSettings.brandSettings
                });
            }
            return { success: true };
        } catch (error) {
            console.error('Error updating settings:', error);
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    };

    const getCurrencySymbol = (code) => {
        switch (code) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            case 'KES': return 'Ksh ';
            default: return code ? code + ' ' : '$';
        }
    };

    // Helper to format currency price based on settings
    const formatPrice = (amount) => {
        if (amount === null || amount === undefined) return '';
        const symbol = getCurrencySymbol(settings.currency);
        // Ensure amount is a number
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

        let formattedValue;
        if (settings.showDecimals) {
            formattedValue = numAmount.toFixed(2);
        } else {
            formattedValue = Math.round(numAmount).toString();
        }

        return `${symbol}${formattedValue}`;
    };

    const currencySymbol = getCurrencySymbol(settings.currency);

    // Dynamic SEO and Favicon updates
    useEffect(() => {
        if (settings.storeName) {
            document.title = `${settings.storeName} | Heritage & Modern Design`;
        }

        if (settings.logoUrl) {
            const favicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
            favicons.forEach(favicon => {
                favicon.href = settings.logoUrl;
            });
        }
    }, [settings.storeName, settings.logoUrl]);

    // Dynamic Brand Colors Injection
    useEffect(() => {
        if (settings.brandSettings) {
            const root = document.documentElement;
            // Helper to convert hex to rgb if needed, but hex works for variable replacement if tailwind uses var()

            // Primary Logic
            root.style.setProperty('--color-primary', settings.brandSettings.primaryColor);
            // We can generate variations here if we want, or just let them fallback
            // Simple lightening/darkening could be done with a small helper library or simple manipulation

            // Secondary / Black
            root.style.setProperty('--color-primary', settings.brandSettings.primaryColor);
            root.style.setProperty('--color-secondary', settings.brandSettings.secondaryColor);
            root.style.setProperty('--color-accent', settings.brandSettings.accentColor);

            // Backgrounds
            root.style.setProperty('--color-background-dark', settings.brandSettings.backgroundColor);
            root.style.setProperty('--color-navbar-bg', settings.brandSettings.navbarBg);
            root.style.setProperty('--color-navbar-text', settings.brandSettings.navbarText);
            root.style.setProperty('--color-text-main', settings.brandSettings.textMain);
            root.style.setProperty('--color-text-muted', settings.brandSettings.textMuted);
        }
    }, [settings.brandSettings]);

    // Calculate tax based on enabled settings and tax configuration
    const calculateTax = (amount) => {
        // New format: taxConfig object
        if (settings.taxConfig) {
            if (!settings.taxConfig.enabled || !amount) return 0;

            if (settings.taxConfig.type === 'percentage') {
                return amount * (settings.taxConfig.value / 100);
            } else if (settings.taxConfig.type === 'fixed') {
                return settings.taxConfig.value;
            }
            return 0;
        }

        // Legacy format: taxesEnabled + taxRates
        if (!settings.taxesEnabled || !amount) return 0;
        const activeRate = settings.taxRates?.find(r => r.active || r.status === 'active');
        if (!activeRate) return 0;
        return amount * (activeRate.rate / 100);
    };

    // Get tax display name
    const getTaxName = () => {
        if (settings.taxConfig?.name) return settings.taxConfig.name;
        const activeRate = settings.taxRates?.find(r => r.active || r.status === 'active');
        return activeRate?.region || 'Tax';
    };

    // Check if tax should be shown at checkout
    const shouldShowTax = () => {
        if (settings.taxConfig) {
            return settings.taxConfig.enabled && settings.taxConfig.showInCheckout;
        }
        return settings.taxesEnabled;
    };

    return (
        <StoreSettingsContext.Provider value={{ settings, updateSettings, loading, currencySymbol, formatPrice, calculateTax, getTaxName, shouldShowTax }}>
            {children}
        </StoreSettingsContext.Provider>
    );
};
