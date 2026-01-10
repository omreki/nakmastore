import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import ShippingMethodForm from '../../components/admin/ShippingMethodForm';
import TaxSettingsForm from '../../components/admin/TaxSettingsForm';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useAuth } from '../../context/AuthContext';
import { emailService } from '../../services/emailService';
import { supabase } from '../../lib/supabase';
import { useNotification } from '../../context/NotificationContext';

const StoreSettingsPage = () => {
    const { settings: contextSettings, updateSettings, loading: contextLoading, currencySymbol, formatPrice } = useStoreSettings();
    const { user, profile, refreshProfile } = useAuth();
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState('account');
    const [isSaving, setIsSaving] = useState(false);
    const [showAddMethodModal, setShowAddMethodModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [paymentConfig, setPaymentConfig] = useState({});
    const [showAddShippingModal, setShowAddShippingModal] = useState(false);
    const [showEditShippingModal, setShowEditShippingModal] = useState(false);
    const [editingShipping, setEditingShipping] = useState(null);
    const [showEditTaxModal, setShowEditTaxModal] = useState(false);
    const [showAddTaxModal, setShowAddTaxModal] = useState(false);
    const [editingTax, setEditingTax] = useState(null);

    // Local state for form handling
    const [settings, setSettings] = useState({
        storeName: '',
        supportEmail: '',
        currency: 'USD',
        timezone: 'EST',
        showDecimals: true,
        siteUrl: '',
        logoUrl: '',
        heroImageUrl: '',
        taxRates: [],
        taxConfig: {
            enabled: true,
            name: 'Tax',
            type: 'percentage',
            value: 0,
            showInCheckout: true
        },
        alertEmails: [],
        resendConfig: { apiKey: '', fromEmail: '', verifiedDomain: '' },
        privacyPolicy: '',
        termsOfService: '',
        returnsPolicy: '',
        sizeGuide: '',
        homepageSettings: {
            hero: {
                subHeadline: "Collection 01",
                headlineLine1: "HANDCRAFTED",
                headlineLine2: "HERITAGE.",
                descriptionLine1: "Premium African-inspired fashion.",
                descriptionLine2: "Where tradition meets contemporary silhouette. Crafted for the modern man.",
                imageUrl: ""
            },
            philosophy: {
                subHeadline: "The Nakma Philosophy",
                quote: "Your style is the reflection of your heritage and confidence.",
                descriptionLine1: "Crafted for the modern African man.",
                descriptionLine2: "Where tradition meets contemporary silhouette.",
                imageUrl: ""
            },
            categories: {
                men: { title: "Men", subtitle: "Heritage Cuts", imageUrl: "" },
                women: { title: "Women", subtitle: "Modern Silhouettes", imageUrl: "" }
            }
        },
        navigationSettings: [],
        aboutPageSettings: {
            hero: { bgImage: '', estText: '', title: '', subtitle: '' },
            philosophy: { imageUrl: '', label: '', title: '', description: '', stats: [] },
            coreValues: { label: '', title: '', values: [] },
            quote: { text: '', author: '', authorTitle: '' },
            join: { bgImage: '', title: '', subtitle: '', buttonText: '', buttonLink: '' }
        },
        loginPageSettings: {
            login_bg_url: '',
            login_title: '',
            login_subtitle: ''
        },
        checkoutPageSettings: {
            giftMessage: ''
        },
        seoSettings: {
            metaTitle: "",
            metaDescription: "",
            keywords: "",
            googleSiteVerification: ""
        },
        brandSettings: {
            primaryColor: "#30136a",
            secondaryColor: "#000000",
            accentColor: "#d86928",
            backgroundColor: "#000000"
        }
    });

    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [heroFile, setHeroFile] = useState(null);
    const [heroPreview, setHeroPreview] = useState(null);

    // About Page Images State
    const [aboutHeroFile, setAboutHeroFile] = useState(null);
    const [aboutHeroPreview, setAboutHeroPreview] = useState(null);
    const [aboutPhilosophyFile, setAboutPhilosophyFile] = useState(null);
    const [aboutPhilosophyPreview, setAboutPhilosophyPreview] = useState(null);
    const [aboutJoinFile, setAboutJoinFile] = useState(null);
    const [aboutJoinPreview, setAboutJoinPreview] = useState(null);

    // Homepage Images State
    const [homepageHeroFile, setHomepageHeroFile] = useState(null);
    const [homepageHeroPreview, setHomepageHeroPreview] = useState(null);

    const [homepagePhilosophyFile, setHomepagePhilosophyFile] = useState(null);
    const [homepagePhilosophyPreview, setHomepagePhilosophyPreview] = useState(null);

    const [homepageMenFile, setHomepageMenFile] = useState(null);
    const [homepageMenPreview, setHomepageMenPreview] = useState(null);

    const [homepageWomenFile, setHomepageWomenFile] = useState(null);
    const [homepageWomenPreview, setHomepageWomenPreview] = useState(null);

    const [loginFile, setLoginFile] = useState(null);
    const [loginPreview, setLoginPreview] = useState(null);

    const [paymentGateways, setPaymentGateways] = useState({
        paystack: false,
        cod: false,
        stripe: false,
        paypal: false
    });

    const [shippingMethods, setShippingMethods] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', fullName: '', role: 'editor' });

    // Pages State
    const [pages, setPages] = useState([]);
    const [loadingPages, setLoadingPages] = useState(false);
    const [showPageModal, setShowPageModal] = useState(false);
    const [editingPageId, setEditingPageId] = useState(null);
    const [activePageModalTab, setActivePageModalTab] = useState('general'); // Added for tab switching inside modal
    const [pageForm, setPageForm] = useState({
        title: '',
        slug: '',
        hero_title: '',
        hero_subtitle: '',
        hero_image_url: '',
        content_category_slug: '',
        is_system: false,
        status: 'published',
        meta_title: '',
        meta_description: '',
        custom_css: ''
    });

    const [editingMemberId, setEditingMemberId] = useState(null);

    const fetchTeamMembers = async () => {
        try {
            setLoadingTeam(true);
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Check if current admin user's email needs to be synced
            if (user?.email && profile?.role === 'admin') {
                const adminMember = (data || []).find(m => m.role === 'admin');

                // If there's an admin in team_members with a different email, update it
                if (adminMember && adminMember.email !== user.email) {
                    await supabase
                        .from('team_members')
                        .update({ email: user.email })
                        .eq('id', adminMember.id);

                    // Update the local data
                    const updatedData = (data || []).map(member => {
                        if (member.id === adminMember.id) {
                            return { ...member, email: user.email };
                        }
                        return member;
                    });
                    setTeamMembers(updatedData);
                    return;
                }
            }

            // Sync current user's email if they are in the list
            const updatedData = (data || []).map(member => {
                if (user && member.email === user.email) {
                    return { ...member, email: user.email };
                }
                return member;
            });

            setTeamMembers(updatedData);
        } catch (error) {
            console.error('Error fetching team:', error);
            notify('Failed to load team members', 'error');
        } finally {
            setLoadingTeam(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'team') {
            fetchTeamMembers();
        }
    }, [activeTab]);
    const [pageSearchQuery, setPageSearchQuery] = useState('');
    const [selectedPages, setSelectedPages] = useState([]);
    const [pageStatusFilter, setPageStatusFilter] = useState('all');
    const [pageHeroFile, setPageHeroFile] = useState(null);
    const [pageHeroPreview, setPageHeroPreview] = useState(null);

    // Navigation State
    const [showAddNavItemModal, setShowAddNavItemModal] = useState(false);
    const [editingNavItem, setEditingNavItem] = useState(null);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [navItemForm, setNavItemForm] = useState({
        id: '',
        label: '',
        type: 'link',
        path: '',
        visible: true,
        children: []
    });

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categories').select('id, name, slug');
            if (data) setAvailableCategories(data);
        };
        fetchCategories();
    }, []);

    const [accountForm, setAccountForm] = useState({
        fullName: '',
        email: '',
        currentPassword: '',
        password: '',
        confirmPassword: ''
    });

    // Populate account form
    useEffect(() => {
        if (user && profile) {
            setAccountForm(prev => ({
                ...prev,
                fullName: profile.full_name || user.user_metadata?.full_name || '',
                email: user.email || ''
            }));
        }
    }, [user, profile]);

    // Sync local state with context settings on load
    useEffect(() => {
        if (contextSettings) {
            setSettings({
                storeName: contextSettings.storeName,
                supportEmail: contextSettings.supportEmail,
                currency: contextSettings.currency,
                timezone: contextSettings.timezone,
                showDecimals: contextSettings.showDecimals,
                siteUrl: contextSettings.siteUrl || '',
                alertEmails: contextSettings.alertEmails || [],
                resendConfig: contextSettings.resendConfig || { apiKey: '', fromEmail: '', verifiedDomain: '' },
                logoUrl: contextSettings.logoUrl || '',
                heroImageUrl: contextSettings.heroImageUrl || '',
                taxRates: contextSettings.taxRates || [],
                taxConfig: contextSettings.taxConfig || {
                    enabled: contextSettings.taxesEnabled ?? true,
                    name: 'Tax',
                    type: 'percentage',
                    value: 0,
                    showInCheckout: true
                },
                privacyPolicy: contextSettings.privacyPolicy || '',
                termsOfService: contextSettings.termsOfService || '',
                returnsPolicy: contextSettings.returnsPolicy || '',
                sizeGuide: contextSettings.sizeGuide || '',
                contactPhone: contextSettings.contactPhone || '',
                contactAddress: contextSettings.contactAddress || '',
                operatingHours: contextSettings.operatingHours || { mon_fri: '', sat: '' },
                instagramUrl: contextSettings.instagramUrl || '',
                twitterUrl: contextSettings.twitterUrl || '',
                facebookUrl: contextSettings.facebookUrl || '',
                homepageSettings: contextSettings.homepageSettings || {
                    hero: {
                        subHeadline: "Collection 01",
                        headlineLine1: "HANDCRAFTED",
                        headlineLine2: "HERITAGE.",
                        descriptionLine1: "Premium African-inspired fashion.",
                        descriptionLine2: "Where tradition meets contemporary silhouette. Crafted for the modern man.",
                        imageUrl: ""
                    },
                    philosophy: {
                        subHeadline: "The Nakma Philosophy",
                        quote: "Your style is the reflection of your heritage and confidence.",
                        descriptionLine1: "Crafted for the modern African man.",
                        descriptionLine2: "Where tradition meets contemporary silhouette.",
                        imageUrl: ""
                    },
                    categories: {
                        men: { title: "Men", subtitle: "Heritage Cuts", imageUrl: "" },
                        women: { title: "Women", subtitle: "Modern Silhouettes", imageUrl: "" }
                    }
                },
                navigationSettings: contextSettings.navigationSettings || [],
                aboutPageSettings: contextSettings.aboutPageSettings || {
                    hero: { bgImage: '', estText: '', title: '', subtitle: '' },
                    philosophy: { imageUrl: '', label: '', title: '', description: '', stats: [] },
                    coreValues: { label: '', title: '', values: [] },
                    quote: { text: '', author: '', authorTitle: '' },
                    join: { bgImage: '', title: '', subtitle: '', buttonText: '', buttonLink: '' }
                },
                loginPageSettings: contextSettings.loginPageSettings || {
                    login_bg_url: '',
                    login_title: '',
                    login_subtitle: ''
                },
                checkoutPageSettings: contextSettings.checkoutPageSettings || {
                    giftMessage: ''
                },
                seoSettings: contextSettings.seoSettings || {
                    metaTitle: "",
                    metaDescription: "",
                    keywords: "",
                    googleSiteVerification: ""
                },
                brandSettings: contextSettings.brandSettings || {
                    primaryColor: "#30136a",
                    secondaryColor: "#000000",
                    accentColor: "#d86928",
                    backgroundColor: "#000000"
                }
            });

            if (contextSettings.logoUrl) {
                setLogoPreview(contextSettings.logoUrl);
            }
            if (contextSettings.heroImageUrl) {
                setHeroPreview(contextSettings.heroImageUrl);
            }

            // Sync Homepage Previews
            if (contextSettings.homepageSettings) {
                if (contextSettings.homepageSettings.hero?.imageUrl) {
                    setHomepageHeroPreview(contextSettings.homepageSettings.hero.imageUrl);
                }
                if (contextSettings.homepageSettings.philosophy?.imageUrl) {
                    setHomepagePhilosophyPreview(contextSettings.homepageSettings.philosophy.imageUrl);
                }
                if (contextSettings.homepageSettings.categories?.men?.imageUrl) {
                    setHomepageMenPreview(contextSettings.homepageSettings.categories.men.imageUrl);
                }
                if (contextSettings.homepageSettings.categories?.women?.imageUrl) {
                    setHomepageWomenPreview(contextSettings.homepageSettings.categories.women.imageUrl);
                }
            }

            // Sync About Page Previews
            if (contextSettings.aboutPageSettings) {
                if (contextSettings.aboutPageSettings.hero?.bgImage) {
                    setAboutHeroPreview(contextSettings.aboutPageSettings.hero.bgImage);
                }
                if (contextSettings.aboutPageSettings.philosophy?.imageUrl) {
                    setAboutPhilosophyPreview(contextSettings.aboutPageSettings.philosophy.imageUrl);
                }
                if (contextSettings.aboutPageSettings.join?.bgImage) {
                    setAboutJoinPreview(contextSettings.aboutPageSettings.join.bgImage);
                }
            }

            if (contextSettings.loginPageSettings) {
                setSettings(prev => ({ ...prev, loginPageSettings: contextSettings.loginPageSettings }));
                if (contextSettings.loginPageSettings.login_bg_url) {
                    setLoginPreview(contextSettings.loginPageSettings.login_bg_url);
                }
            }

            if (contextSettings.shippingMethods && Array.isArray(contextSettings.shippingMethods)) {
                setShippingMethods(contextSettings.shippingMethods);
            }
            if (contextSettings.paymentGateways && typeof contextSettings.paymentGateways === 'object') {
                setPaymentGateways(contextSettings.paymentGateways);
            }
        }
    }, [contextSettings]);

    useEffect(() => {
        if (activeTab === 'team') {
            fetchTeamMembers();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'pages' || showAddNavItemModal) {
            fetchPages();
        }
    }, [activeTab, showAddNavItemModal]);

    // Real-time Brand Settings Preview
    useEffect(() => {
        if (settings.brandSettings) {
            const root = document.documentElement;
            root.style.setProperty('--color-primary', settings.brandSettings.primaryColor);
            root.style.setProperty('--color-secondary', settings.brandSettings.secondaryColor);
            root.style.setProperty('--color-accent', settings.brandSettings.accentColor);
            root.style.setProperty('--color-background-dark', settings.brandSettings.backgroundColor);
            root.style.setProperty('--color-navbar-bg', settings.brandSettings.navbarBg || 'rgba(0, 0, 0, 0.4)');
            root.style.setProperty('--color-navbar-text', settings.brandSettings.navbarText || '#ffffff');
            root.style.setProperty('--color-text-main', settings.brandSettings.textMain || '#ffffff');
            root.style.setProperty('--color-text-muted', settings.brandSettings.textMuted || '#a1a1aa');
        }

        // Cleanup: revert to saved context settings on unmount
        return () => {
            if (contextSettings.brandSettings) {
                const root = document.documentElement;
                root.style.setProperty('--color-primary', contextSettings.brandSettings.primaryColor || '#30136a');
                root.style.setProperty('--color-secondary', contextSettings.brandSettings.secondaryColor || '#000000');
                root.style.setProperty('--color-accent', contextSettings.brandSettings.accentColor || '#d86928');
                root.style.setProperty('--color-background-dark', contextSettings.brandSettings.backgroundColor || '#000000');
                root.style.setProperty('--color-navbar-bg', contextSettings.brandSettings.navbarBg || 'rgba(0, 0, 0, 0.4)');
                root.style.setProperty('--color-navbar-text', contextSettings.brandSettings.navbarText || '#ffffff');
                root.style.setProperty('--color-text-main', contextSettings.brandSettings.textMain || '#ffffff');
                root.style.setProperty('--color-text-muted', contextSettings.brandSettings.textMuted || '#a1a1aa');
            }
        };
    }, [settings.brandSettings, contextSettings.brandSettings]);

    const fetchPages = async () => {
        setLoadingPages(true);
        try {
            const { data, error } = await supabase.from('pages').select('*').order('created_at', { ascending: false });
            if (error) throw error;

            let allPages = data || [];

            // Ensure community page is in the list
            const hasCommunity = allPages.some(p => p.slug === 'community');
            if (!hasCommunity) {
                // Add a "virtual" entry that will be saved to DB if edited
                allPages.push({
                    id: 'community-init',
                    title: 'Community',
                    slug: 'community',
                    hero_title: 'KNOWLEDGE HUB',
                    hero_subtitle: 'Articles, insights, and stories from the world of African-inspired fashion and cultural heritage.',
                    hero_image_url: '',
                    status: 'published',
                    is_system: true,
                    created_at: new Date().toISOString()
                });
            }

            setPages(allPages);
        } catch (error) {
            console.error('Error fetching pages:', error);
            notify('Failed to load pages', 'error');
        } finally {
            setLoadingPages(false);
        }
    };

    const handlePageFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPageHeroFile(file);
            setPageHeroPreview(URL.createObjectURL(file));
        }
    };

    const handleEditPage = (page) => {
        setPageForm({
            title: page.title || '',
            slug: page.slug || '',
            hero_title: page.hero_title || '',
            hero_subtitle: page.hero_subtitle || '',
            hero_image_url: page.hero_image_url || '',
            content_category_slug: page.content_category_slug || '',
            is_system: page.is_system || false,
            status: page.status || 'published',
            meta_title: page.meta_title || '',
            meta_description: page.meta_description || '',
            custom_css: page.custom_css || ''
        });
        setPageHeroPreview(page.hero_image_url || null);
        setPageHeroFile(null);
        setEditingPageId(page.id);
        setShowPageModal(true);
        setActivePageModalTab('general'); // Reset to general tab when opening modal
    };

    const handleTogglePageSelection = (id) => {
        setSelectedPages(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleSelectAllPages = (filteredPages) => {
        if (selectedPages.length === filteredPages.length && filteredPages.length > 0) {
            setSelectedPages([]);
        } else {
            setSelectedPages(filteredPages.map(p => p.id));
        }
    };

    const handleBulkDeletePages = async () => {
        if (!selectedPages.length) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedPages.length} pages?`)) return;

        try {
            const { error } = await supabase.from('pages').delete().in('id', selectedPages);
            if (error) throw error;
            setPages(prev => prev.filter(p => !selectedPages.includes(p.id)));
            setSelectedPages([]);
            notify('Selected pages deleted successfully', 'success');
        } catch (error) {
            notify('Error deleting pages', 'error');
        }
    };

    const handleAddPage = () => {
        setPageForm({
            title: '',
            slug: '',
            hero_title: '',
            hero_subtitle: '',
            hero_image_url: '',
            content_category_slug: '',
            is_system: false,
            status: 'published',
            meta_title: '',
            meta_description: '',
            custom_css: ''
        });
        setPageHeroPreview(null);
        setPageHeroFile(null);
        setEditingPageId(null);
        setShowPageModal(true);
        setActivePageModalTab('general'); // Reset to general tab when opening modal
    };

    const handleDeletePage = async (id) => {
        if (!window.confirm('Are you sure you want to delete this page?')) return;
        try {
            const { error } = await supabase.from('pages').delete().eq('id', id);
            if (error) throw error;
            setPages(prev => prev.filter(p => p.id !== id));
            notify('Page deleted successfully', 'success');
        } catch (error) {
            notify('Error deleting page', 'error');
        }
    };

    const handleSavePage = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let imageUrl = pageForm.hero_image_url;

            if (pageHeroFile) {
                const fileName = `page-hero-${Date.now()}-${pageHeroFile.name.replace(/\s/g, '-')}`;
                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, pageHeroFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);
                imageUrl = urlData.publicUrl;
            }

            // Simple slug generation if empty
            let slug = pageForm.slug;
            if (!slug && pageForm.title) {
                slug = pageForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            // Handle explicit removal of image
            if (pageForm.removeImage) {
                imageUrl = '';
            }

            const payload = {
                title: pageForm.title,
                slug: slug,
                hero_title: pageForm.hero_title,
                hero_subtitle: pageForm.hero_subtitle,
                hero_image_url: imageUrl,
                content_category_slug: pageForm.content_category_slug,
                is_system: pageForm.is_system,
                status: pageForm.status,
                meta_title: pageForm.meta_title,
                meta_description: pageForm.meta_description,
                custom_css: pageForm.custom_css
            };

            if (editingPageId && editingPageId !== 'community-init') {
                const { data, error } = await supabase
                    .from('pages')
                    .update(payload)
                    .eq('id', editingPageId)
                    .select()
                    .single();
                if (error) throw error;
                setPages(prev => prev.map(p => p.id === editingPageId ? data : p));
                notify('Page updated successfully', 'success');
            } else {
                const { data, error } = await supabase
                    .from('pages')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                setPages(prev => [data, ...prev.filter(p => p.id !== 'community-init')]);
                notify('Page created successfully', 'success');
            }
            setShowPageModal(false);
        } catch (error) {
            console.error('Error saving page:', error);
            notify(error.message || 'Failed to save page', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const settingsTabs = [
        { id: 'account', label: 'Admin Identity', icon: 'badge' },
        { id: 'branding', label: 'Branding', icon: 'palette' },
        { id: 'general', label: 'General', icon: 'tune' },
        { id: 'seo', label: 'General SEO', icon: 'search' },
        { id: 'notifications', label: 'Email Alerts', icon: 'mail' },
        { id: 'homepage', label: 'Homepage', icon: 'web' },
        { id: 'about', label: 'About Us', icon: 'info' },
        { id: 'navigation', label: 'Navigation', icon: 'menu' },
        { id: 'contact', label: 'Contact Details', icon: 'contact_support' },
        { id: 'shipping', label: 'Shipping', icon: 'local_shipping' },
        { id: 'payments', label: 'Payments', icon: 'payments' },
        { id: 'taxes', label: 'Taxes', icon: 'receipt_long' },
        { id: 'policies', label: 'Policies', icon: 'policy' },
        { id: 'team', label: 'Team Management', icon: 'group' },
        { id: 'pages', label: 'Pages', icon: 'layers' },
        { id: 'login', label: 'Login Page', icon: 'login' },
        { id: 'checkout', label: 'Checkout Page', icon: 'shopping_bag' }
    ];

    const handleInputChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdateAccount = async () => {
        // Safety check
        if (!user || !profile) {
            notify('User not loaded. Please try again.', 'error');
            return;
        }

        // Validation: Check if passwords match
        if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
            notify('Passwords do not match.', 'error');
            return;
        }

        // Check if email or password is being changed
        const isEmailChange = accountForm.email !== user.email;
        const isPasswordChange = accountForm.password && accountForm.password.trim() !== '';

        // Require current password for email or password changes
        if ((isEmailChange || isPasswordChange) && !accountForm.currentPassword) {
            notify('Current password is required to change email or password.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            // Verify current password if email or password is being changed
            if (isEmailChange || isPasswordChange) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: accountForm.currentPassword
                });

                if (signInError) {
                    throw new Error('Current password is incorrect.');
                }
            }

            const updates = {};
            if (isEmailChange) updates.email = accountForm.email;
            if (isPasswordChange) updates.password = accountForm.password;
            if (accountForm.fullName !== (profile.full_name || user.user_metadata?.full_name)) {
                updates.data = { full_name: accountForm.fullName };
            }

            if (Object.keys(updates).length === 0) {
                notify('No changes detected.', 'error');
                setIsSaving(false);
                return;
            }

            const { error } = await supabase.auth.updateUser(updates);
            if (error) throw error;

            const profileUpdates = {};
            if (updates.data?.full_name) profileUpdates.full_name = updates.data.full_name;
            if (isEmailChange) profileUpdates.email = accountForm.email;

            if (Object.keys(profileUpdates).length > 0) {
                await supabase.from('profiles').update(profileUpdates).eq('id', user.id);
                await refreshProfile();
            }

            // Handle logout scenarios
            if (isEmailChange) {
                notify('Email update initiated. Check both your old and new email for confirmation links. You will be logged out in 3 seconds...', 'success');
                setTimeout(async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                }, 3000);
            } else if (isPasswordChange) {
                notify('Password updated successfully. Logging out for security in 2 seconds...', 'success');
                setTimeout(async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                }, 2000);
            } else {
                notify('Profile updated successfully.', 'success');
                setAccountForm(prev => ({ ...prev, currentPassword: '' }));
                setIsSaving(false);
            }

        } catch (error) {
            console.error(error);
            notify(error.message || 'Update failed', 'error');
            setIsSaving(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleHeroChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setHeroFile(file);
            setHeroPreview(URL.createObjectURL(file));
        }
    };

    const handleHomepageImageChange = (section, e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (section === 'hero') {
                setHomepageHeroFile(file);
                setHomepageHeroPreview(previewUrl);
            } else if (section === 'philosophy') {
                setHomepagePhilosophyFile(file);
                setHomepagePhilosophyPreview(previewUrl);
            } else if (section === 'men') {
                setHomepageMenFile(file);
                setHomepageMenPreview(previewUrl);
            } else if (section === 'women') {
                setHomepageWomenFile(file);
                setHomepageWomenPreview(previewUrl);
            }
        }
    };

    const handleAboutImageChange = (section, e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (section === 'hero') {
                setAboutHeroFile(file);
                setAboutHeroPreview(previewUrl);
            } else if (section === 'philosophy') {
                setAboutPhilosophyFile(file);
                setAboutPhilosophyPreview(previewUrl);
            } else if (section === 'join') {
                setAboutJoinFile(file);
                setAboutJoinPreview(previewUrl);
            }
        }
    };

    const handleLoginImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLoginFile(file);
            setLoginPreview(URL.createObjectURL(file));
        }
    };

    const togglePaymentGateway = (gateway) => {
        setPaymentGateways(prev => ({ ...prev, [gateway]: !prev[gateway] }));
    };

    const toggleShippingMethod = (id) => {
        setShippingMethods(prev => prev.map(method =>
            method.id === id ? { ...method, enabled: !method.enabled } : method
        ));
    };

    const handleEditShipping = (method) => {
        setEditingShipping({ ...method });
        setShowEditShippingModal(true);
    };

    const handleAddShipping = (newMethod) => {
        const id = `${newMethod.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
        setShippingMethods(prev => [...prev, { ...newMethod, id, enabled: false }]);
        setShowAddShippingModal(false);
        notify('Shipping method added successfully.', 'success');
    };

    const handleDeleteShipping = (id) => {
        setShippingMethods(prev => prev.filter(method => method.id !== id));
        notify('Shipping method deleted successfully.', 'success');
    };

    const handleEditTax = (tax) => {
        setEditingTax({ ...tax });
        setShowEditTaxModal(true);
    };

    const handleAddTax = (newTax) => {
        const maxId = settings.taxRates.length > 0 ? Math.max(...settings.taxRates.map(t => t.id)) : 0;
        const id = maxId + 1;
        const updatedRates = [...settings.taxRates, { ...newTax, id, status: 'active' }];
        handleInputChange('taxRates', updatedRates);
        setShowAddTaxModal(false);
        notify('Tax jurisdiction added successfully.', 'success');
    };

    const handleUpdateTax = (updatedTax) => {
        const updatedRates = settings.taxRates.map(t => t.id === updatedTax.id ? updatedTax : t);
        handleInputChange('taxRates', updatedRates);
        setShowEditTaxModal(false);
        notify('Tax jurisdiction updated.', 'success');
    };

    const handleDeleteTax = (id) => {
        const updatedRates = settings.taxRates.filter(t => t.id !== id);
        handleInputChange('taxRates', updatedRates);
        notify('Tax jurisdiction removed.', 'success');
    };

    const toggleTaxStatus = (id) => {
        const updatedRates = settings.taxRates.map(t => {
            if (t.id === id) {
                return { ...t, active: !t.active, status: !t.active ? 'active' : 'inactive' };
            }
            return t;
        });
        handleInputChange('taxRates', updatedRates);
    };

    const handleAddMethod = () => {
        setShowAddMethodModal(true);
    };

    const handleConfigurePayment = (method) => {
        setSelectedPaymentMethod(method);
        const existingConfig = contextSettings?.paymentConfigs?.[method] || {};
        setPaymentConfig(existingConfig);
        setShowConfigModal(true);
    };

    const handleSavePaymentConfig = async () => {
        const updatedConfigs = {
            ...contextSettings?.paymentConfigs,
            [selectedPaymentMethod]: paymentConfig
        };

        const result = await updateSettings({
            ...settings,
            paymentGateways,
            shippingMethods,
            paymentConfigs: updatedConfigs
        });

        if (result.success) {
            notify('Payment configuration saved successfully.', 'success');
            setShowConfigModal(false);
        } else {
            notify('Failed to save configuration.', 'error');
        }
    };

    const handleAddNewMethod = (methodKey) => {
        setPaymentGateways(prev => ({ ...prev, [methodKey]: false }));
        setShowAddMethodModal(false);
        notify(`${methodKey} added successfully. Toggle to enable.`, 'success');
    };

    const handleSave = async () => {
        setIsSaving(true);

        const newSettings = {
            ...settings,
            taxesEnabled: settings.taxConfig.enabled, // Synchronize top-level field for DB
            paymentGateways,
            shippingMethods,
            navigationSettings: settings.navigationSettings,
            homepageSettings: JSON.parse(JSON.stringify(settings.homepageSettings)), // Deep copy
            aboutPageSettings: JSON.parse(JSON.stringify(settings.aboutPageSettings)) // Deep copy
        };

        if (logoFile) {
            const fileName = `store-logo-${Date.now()}-${logoFile.name.replace(/\s/g, '-')}`;
            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(fileName, logoFile);

            if (!error) {
                const { data: UrlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);
                newSettings.logoUrl = UrlData.publicUrl;
            }
        }

        if (heroFile) {
            const fileName = `hero-image-${Date.now()}-${heroFile.name.replace(/\s/g, '-')}`;
            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(fileName, heroFile);

            if (!error) {
                const { data: UrlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);
                newSettings.heroImageUrl = UrlData.publicUrl;
            }
        }

        // Upload Homepage Images
        if (homepageHeroFile) {
            const fileName = `hp-hero-${Date.now()}-${homepageHeroFile.name.replace(/\s/g, '-')}`;
            const { error } = await supabase.storage.from('product-images').upload(fileName, homepageHeroFile);
            if (!error) {
                const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
                newSettings.homepageSettings.hero.imageUrl = data.publicUrl;
            }
        }

        if (homepagePhilosophyFile) {
            const fileName = `hp-phil-${Date.now()}-${homepagePhilosophyFile.name.replace(/\s/g, '-')}`;
            const { error } = await supabase.storage.from('product-images').upload(fileName, homepagePhilosophyFile);
            if (!error) {
                const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
                newSettings.homepageSettings.philosophy.imageUrl = data.publicUrl;
            }
        }

        if (homepageMenFile) {
            const fileName = `hp-men-${Date.now()}-${homepageMenFile.name.replace(/\s/g, '-')}`;
            const { error } = await supabase.storage.from('product-images').upload(fileName, homepageMenFile);
            if (!error) {
                const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
                newSettings.homepageSettings.categories.men.imageUrl = data.publicUrl;
            }
        }

        if (homepageWomenFile) {
            const fileName = `hp-women-${Date.now()}-${homepageWomenFile.name.replace(/\s/g, '-')}`;
            const { error } = await supabase.storage.from('product-images').upload(fileName, homepageWomenFile);
            if (!error) {
                const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
                newSettings.homepageSettings.categories.women.imageUrl = data.publicUrl;
            }
        }

        // Upload About Page Images
        if (aboutHeroFile) {
            const fileName = `about-hero-${Date.now()}-${aboutHeroFile.name.replace(/\s/g, '-')}`;
            const { error } = await supabase.storage.from('product-images').upload(fileName, aboutHeroFile);
            if (!error) {
                const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
                newSettings.aboutPageSettings.hero.bgImage = data.publicUrl;
            }
        }

        if (aboutPhilosophyFile) {
            const fileName = `about-phil-${Date.now()}-${aboutPhilosophyFile.name.replace(/\s/g, '-')}`;
            const { error } = await supabase.storage.from('product-images').upload(fileName, aboutPhilosophyFile);
            if (!error) {
                const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
                newSettings.aboutPageSettings.philosophy.imageUrl = data.publicUrl;
            }
        }

        if (aboutJoinFile) {
            const fileName = `about-join-${Date.now()}-${aboutJoinFile.name.replace(/\s/g, '-')}`;
            const { error } = await supabase.storage.from('product-images').upload(fileName, aboutJoinFile);
            if (!error) {
                const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
                newSettings.aboutPageSettings.join.bgImage = data.publicUrl;
            }
        }

        if (loginFile) {
            const fileName = `login-bg-${Date.now()}-${loginFile.name.replace(/\s/g, '-')}`;
            const { error } = await supabase.storage.from('product-images').upload(fileName, loginFile);
            if (!error) {
                const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
                newSettings.loginPageSettings.login_bg_url = data.publicUrl;
            }
        }

        const result = await updateSettings(newSettings);

        if (result.success) {
            notify('Store configurations successfully updated.', 'success');
        } else {
            console.error('Update failed:', result.error);
            notify('Failed to update settings. Please try again.', 'error');
        }
        setIsSaving(false);
    };




    // Navigation Handlers
    const handleAddNavItemClick = () => {
        setNavItemForm({ id: '', label: '', type: 'link', path: '', visible: true, children: [] });
        setEditingNavItem(null);
        setShowAddNavItemModal(true);
    };

    const handleEditNavItem = (item) => {
        setNavItemForm({ ...item, children: item.children || [] });
        setEditingNavItem(item);
        setShowAddNavItemModal(true);
    };

    const handleDeleteNavItem = (index) => {
        if (!window.confirm('Are you sure you want to remove this item?')) return;
        const newItems = [...settings.navigationSettings];
        newItems.splice(index, 1);
        setSettings(prev => ({ ...prev, navigationSettings: newItems }));
        notify('Navigation item removed', 'success');
    };

    const handleMoveNavItem = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === settings.navigationSettings.length - 1)) return;
        const newItems = [...settings.navigationSettings];
        const temp = newItems[index];
        newItems[index] = newItems[index + direction];
        newItems[index + direction] = temp;
        setSettings(prev => ({ ...prev, navigationSettings: newItems }));
    };

    const handleSaveNavItemSubmit = () => {
        if (!navItemForm.label) {
            notify('Label is required', 'error');
            return;
        }

        const newItem = {
            ...navItemForm,
            id: navItemForm.id || `nav_${Date.now()}`
        };

        let newItems = [...(settings.navigationSettings || [])];
        if (editingNavItem) {
            const index = newItems.findIndex(i => i.id === editingNavItem.id);
            if (index !== -1) newItems[index] = newItem;
        } else {
            newItems.push(newItem);
        }

        setSettings(prev => ({ ...prev, navigationSettings: newItems }));
        setShowAddNavItemModal(false);
        notify(editingNavItem ? 'Item updated' : 'Item added', 'success');
    };

    const addSubItem = () => {
        setNavItemForm(prev => ({
            ...prev,
            children: [...prev.children, { label: 'New Link', path: '/' }]
        }));
    };

    const updateSubItem = (idx, field, val) => {
        const newChildren = [...navItemForm.children];
        newChildren[idx] = { ...newChildren[idx], [field]: val };
        setNavItemForm(prev => ({ ...prev, children: newChildren }));
    };

    const removeSubItem = (idx) => {
        const newChildren = [...navItemForm.children];
        newChildren.splice(idx, 1);
        setNavItemForm(prev => ({ ...prev, children: newChildren }));
    };

    const handleDiscard = () => {
        if (!contextSettings) return;
        setSettings({
            storeName: contextSettings.storeName,
            supportEmail: contextSettings.supportEmail,
            currency: contextSettings.currency,
            timezone: contextSettings.timezone,
            showDecimals: contextSettings.showDecimals,
            siteUrl: contextSettings.siteUrl,
            alertEmails: contextSettings.alertEmails || [],
            resendConfig: contextSettings.resendConfig || { apiKey: '', fromEmail: '', verifiedDomain: '' },
            logoUrl: contextSettings.logoUrl || '',
            heroImageUrl: contextSettings.heroImageUrl || '',
            taxRates: contextSettings.taxRates || [],
            taxConfig: contextSettings.taxConfig || {
                enabled: contextSettings.taxesEnabled ?? true,
                name: 'Tax',
                type: 'percentage',
                value: 0,
                showInCheckout: true
            },
            privacyPolicy: contextSettings.privacyPolicy || '',
            termsOfService: contextSettings.termsOfService || '',
            returnsPolicy: contextSettings.returnsPolicy || '',
            sizeGuide: contextSettings.sizeGuide || '',
            contactPhone: contextSettings.contactPhone || '',
            contactAddress: contextSettings.contactAddress || '',
            operatingHours: contextSettings.operatingHours || { mon_fri: '', sat: '' },
            instagramUrl: contextSettings.instagramUrl || '',
            twitterUrl: contextSettings.twitterUrl || '',
            facebookUrl: contextSettings.facebookUrl || '',
            aboutPageSettings: contextSettings.aboutPageSettings || {
                hero: { bgImage: '', estText: '', title: '', subtitle: '' },
                philosophy: { imageUrl: '', label: '', title: '', description: '', stats: [] },
                coreValues: { label: '', title: '', values: [] },
                quote: { text: '', author: '', authorTitle: '' },
                join: { bgImage: '', title: '', subtitle: '', buttonText: '', buttonLink: '' }
            },
            loginPageSettings: contextSettings.loginPageSettings || {
                login_bg_url: '',
                login_title: '',
                login_subtitle: ''
            }
        });
        if (contextSettings.logoUrl) setLogoPreview(contextSettings.logoUrl);
        else setLogoPreview(null);
        setLogoFile(null);

        if (contextSettings.heroImageUrl) setHeroPreview(contextSettings.heroImageUrl);
        else setHeroPreview(null);
        setHeroFile(null);

        // Reset Homepage Files
        setHomepageHeroFile(null);
        setHomepagePhilosophyFile(null);
        setHomepageMenFile(null);
        setHomepageWomenFile(null);

        // Reset About Files
        setAboutHeroFile(null);
        setAboutPhilosophyFile(null);
        setAboutJoinFile(null);

        if (contextSettings.aboutPageSettings) {
            setAboutHeroPreview(contextSettings.aboutPageSettings.hero?.bgImage || null);
            setAboutPhilosophyPreview(contextSettings.aboutPageSettings.philosophy?.imageUrl || null);
            setAboutJoinPreview(contextSettings.aboutPageSettings.join?.bgImage || null);
        } else {
            setAboutHeroPreview(null);
            setAboutPhilosophyPreview(null);
            setAboutJoinPreview(null);
        }

        if (contextSettings.loginPageSettings) {
            setLoginPreview(contextSettings.loginPageSettings.login_bg_url || null);
        } else {
            setLoginPreview(null);
        }
        setLoginFile(null);

        if (contextSettings.homepageSettings) {
            setHomepageHeroPreview(contextSettings.homepageSettings.hero?.imageUrl || null);
            setHomepagePhilosophyPreview(contextSettings.homepageSettings.philosophy?.imageUrl || null);
            setHomepageMenPreview(contextSettings.homepageSettings.categories?.men?.imageUrl || null);
            setHomepageWomenPreview(contextSettings.homepageSettings.categories?.women?.imageUrl || null);
        } else {
            setHomepageHeroPreview(null);
            setHomepagePhilosophyPreview(null);
            setHomepageMenPreview(null);
            setHomepageWomenPreview(null);
        }
        if (contextSettings.shippingMethods) setShippingMethods(contextSettings.shippingMethods);
        if (contextSettings.paymentGateways) setPaymentGateways(contextSettings.paymentGateways);
        notify('Changes discarded.', 'info');
    };

    // Show loading state until user and profile are loaded
    if (!user || !profile) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                        <p className="text-gray-400 text-sm font-medium">Loading admin settings...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex flex-col gap-8 pb-10">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm">
                                Core Configuration
                            </span>
                            <span className="text-gray-500 text-sm font-medium">/ System Registry</span>
                        </div>
                        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            Store <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 font-black">Settings</span>
                        </h1>
                        <p className="text-gray-400 text-base font-medium mt-2 max-w-xl">
                            Architect your store preferences, global parameters, shipping protocols, and payment gateways.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleDiscard}
                            className="hidden md:flex items-center justify-center rounded-xl h-12 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white gap-2 text-sm font-bold tracking-wide px-6 transition-all border border-white/10 group">
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || contextLoading}
                            className="bg-white hover:bg-primary-light h-12 px-8 rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-[0.2em] text-black hover:text-white shadow-2xl transition-all border border-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest">
                            {isSaving ? 'Updating...' : 'Update Registry'}
                        </button>
                    </div>
                </div>



                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-3">
                        <div className="glossy-panel rounded-[2.5rem] p-4 border border-white/5 bg-black/20 shadow-2xl sticky top-24">
                            <nav className="flex flex-col gap-1">
                                {settingsTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all text-left group ${activeTab === tab.id
                                            ? 'bg-white/10 text-white border border-white/5 shadow-inner'
                                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-[20px] transition-colors ${activeTab === tab.id ? 'text-primary' : 'group-hover:text-primary-light'}`}>{tab.icon}</span>
                                        <span className="font-black text-[10px] uppercase tracking-widest">{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    <div className="lg:col-span-9 flex flex-col gap-8">
                        {activeTab === 'navigation' && (
                            <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                            <span className="material-symbols-outlined text-primary-light text-[24px]">menu</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Navigation</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage Navbar Links</p>
                                        </div>
                                    </div>
                                    <button onClick={handleAddNavItemClick} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors">
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-4 relative z-10">
                                    {(!settings.navigationSettings || settings.navigationSettings.length === 0) && (
                                        <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl">
                                            <p className="text-gray-500">No navigation items configured.</p>
                                        </div>
                                    )}
                                    {settings.navigationSettings?.map((item, index) => (
                                        <div key={item.id} className="group p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between transition-all hover:bg-white/[0.02]">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {item.type === 'dropdown' ? 'expand_more' : item.type === 'category' ? 'category' : 'link'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-sm tracking-wide">{item.label}</h4>
                                                    <p className="text-xs text-gray-500 font-mono mt-0.5 max-w-[200px] truncate">
                                                        {item.type === 'dropdown' ? `${item.children?.length || 0} sub-items` : item.path}
                                                    </p>
                                                </div>
                                                {!item.visible && <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 uppercase font-black tracking-widest">Hidden</span>}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleMoveNavItem(index, -1)} disabled={index === 0} className="p-2 text-gray-500 hover:text-white disabled:opacity-30">
                                                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                                                </button>
                                                <button onClick={() => handleMoveNavItem(index, 1)} disabled={index === settings.navigationSettings.length - 1} className="p-2 text-gray-500 hover:text-white disabled:opacity-30">
                                                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                                                </button>
                                                <button onClick={() => handleEditNavItem(item)} className="p-2 text-blue-400 hover:text-blue-300">
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button onClick={() => handleDeleteNavItem(index)} className="p-2 text-red-500 hover:text-red-400">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Navigation Modal */}
                        {showAddNavItemModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                                <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-y-auto max-h-[90vh]">
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6">
                                        {editingNavItem ? 'Edit Item' : 'Add Item'}
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Label</label>
                                                <input
                                                    className="glossy-input w-full mt-2"
                                                    value={navItemForm.label}
                                                    onChange={(e) => setNavItemForm({ ...navItemForm, label: e.target.value })}
                                                    placeholder="e.g. Shop"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Subtitle (Mobile)</label>
                                                <input
                                                    className="glossy-input w-full mt-2"
                                                    value={navItemForm.subtitle || ''}
                                                    onChange={(e) => setNavItemForm({ ...navItemForm, subtitle: e.target.value })}
                                                    placeholder="e.g. Global archive"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Type</label>
                                                <select
                                                    className="glossy-input w-full mt-2"
                                                    value={navItemForm.type}
                                                    onChange={(e) => setNavItemForm({ ...navItemForm, type: e.target.value })}
                                                >
                                                    <option value="link">Page / Link</option>
                                                    <option value="dropdown">Dropdown</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Visibility</label>
                                                <div className="flex items-center h-[50px] mt-2 px-4 rounded-xl bg-white/5 border border-white/5">
                                                    <input
                                                        type="checkbox"
                                                        checked={navItemForm.visible}
                                                        onChange={(e) => setNavItemForm({ ...navItemForm, visible: e.target.checked })}
                                                        className="mr-3"
                                                    />
                                                    <span className="text-sm text-gray-300">Visible</span>
                                                </div>
                                            </div>
                                        </div>

                                        {navItemForm.type !== 'dropdown' && (
                                            <div>
                                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Path</label>
                                                <div className="flex gap-2 mt-2">
                                                    <input
                                                        className="glossy-input flex-1"
                                                        value={navItemForm.path}
                                                        onChange={(e) => setNavItemForm({ ...navItemForm, path: e.target.value })}
                                                        placeholder="/page or https://..."
                                                    />
                                                    <select
                                                        className="bg-black/50 border border-white/10 rounded-xl text-gray-400 px-2 text-xs w-24"
                                                        onChange={(e) => {
                                                            if (e.target.value) setNavItemForm({ ...navItemForm, path: e.target.value });
                                                        }}
                                                    >
                                                        <option value="">Quick Select</option>
                                                        <option value="/">Home</option>
                                                        <option value="/shop">Shop</option>
                                                        <option value="/men">Men</option>
                                                        <option value="/women">Women</option>
                                                        <option value="/accessories">Accessories</option>
                                                        <option value="/about">About</option>
                                                        <option value="/contact">Contact</option>
                                                        <option disabled>--- Categories ---</option>
                                                        {availableCategories.map(cat => (
                                                            <option key={cat.id} value={`/category/${cat.slug || cat.id}`}>
                                                                {cat.name}
                                                            </option>
                                                        ))}
                                                        <option disabled>--- Custom Pages ---</option>
                                                        {pages.map(page => (
                                                            <option key={page.id} value={`/${page.slug}`}>
                                                                {page.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {navItemForm.type === 'dropdown' && (
                                            <div className="border-t border-white/10 pt-4 mt-4">
                                                <div className="flex justify-between items-center mb-4">
                                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Submenu Items</label>
                                                    <button type="button" onClick={addSubItem} className="text-primary text-xs font-bold hover:text-white transition-colors">
                                                        + Add Link
                                                    </button>
                                                </div>
                                                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                                                    {navItemForm.children?.map((child, idx) => (
                                                        <div key={idx} className="flex gap-2 items-center">
                                                            <input
                                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white flex-1"
                                                                value={child.label}
                                                                onChange={(e) => updateSubItem(idx, 'label', e.target.value)}
                                                                placeholder="Label"
                                                            />
                                                            <input
                                                                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white flex-1"
                                                                value={child.path}
                                                                onChange={(e) => updateSubItem(idx, 'path', e.target.value)}
                                                                placeholder="Path"
                                                            />
                                                            <button onClick={() => removeSubItem(idx)} className="text-red-500 hover:text-red-400">
                                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {navItemForm.children?.length === 0 && (
                                                        <p className="text-xs text-gray-600 italic text-center py-2">No sub-items</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => setShowAddNavItemModal(false)}
                                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveNavItemSubmit}
                                                className="flex-1 py-3 bg-white hover:bg-gray-200 rounded-xl text-black text-xs font-black uppercase tracking-widest transition-colors shadow-lg"
                                            >
                                                {editingNavItem ? 'Save Changes' : 'Add Item'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'account' && (
                            <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">badge</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Admin Identity</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage Personal Access Credentials</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Full Name</label>
                                        <input
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                                            value={accountForm.fullName}
                                            onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                                            value={accountForm.email}
                                            onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex flex-col gap-2.5 mt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-yellow-500 text-[16px]">lock</span>
                                            <label className="text-gray-400 text-[10px] font-black tracking-[0.2em] uppercase">Security Verification</label>
                                        </div>
                                        <p className="text-gray-500 text-xs mb-3">Enter your current password to change email or password</p>
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Current Password</label>
                                        <input
                                            type="password"
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                                            placeholder="Required for email/password changes"
                                            value={accountForm.currentPassword}
                                            onChange={(e) => setAccountForm({ ...accountForm, currentPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">New Password</label>
                                        <input
                                            type="password"
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                                            placeholder="Leave empty to keep current"
                                            value={accountForm.password}
                                            onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                                            placeholder="Leave empty to keep current"
                                            value={accountForm.confirmPassword}
                                            onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 pt-4">
                                        <button
                                            onClick={handleUpdateAccount}
                                            disabled={isSaving}
                                            className="w-full h-14 bg-white text-black rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-light hover:text-white transition-all shadow-xl disabled:opacity-50"
                                        >
                                            {isSaving ? 'Updating...' : 'Update Identity'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'branding' && (
                            <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">palette</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Brand Identity</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage Brand Colors</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Primary Color</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={settings.brandSettings?.primaryColor || '#30136a'}
                                                onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, primaryColor: e.target.value } })}
                                                className="size-12 rounded-xl border border-white/10 bg-transparent cursor-pointer p-1"
                                            />
                                            <input
                                                type="text"
                                                value={settings.brandSettings?.primaryColor || '#30136a'}
                                                onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, primaryColor: e.target.value } })}
                                                className="glossy-input flex-1 rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Secondary Color</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={settings.brandSettings?.secondaryColor || '#000000'}
                                                onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, secondaryColor: e.target.value } })}
                                                className="size-12 rounded-xl border border-white/10 bg-transparent cursor-pointer p-1"
                                            />
                                            <input
                                                type="text"
                                                value={settings.brandSettings?.secondaryColor || '#000000'}
                                                onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, secondaryColor: e.target.value } })}
                                                className="glossy-input flex-1 rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Accent Color</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={settings.brandSettings?.accentColor || '#d86928'}
                                                onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, accentColor: e.target.value } })}
                                                className="size-12 rounded-xl border border-white/10 bg-transparent cursor-pointer p-1"
                                            />
                                            <input
                                                type="text"
                                                value={settings.brandSettings?.accentColor || '#d86928'}
                                                onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, accentColor: e.target.value } })}
                                                className="glossy-input flex-1 rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Background Color (Dark)</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="color"
                                                value={settings.brandSettings?.backgroundColor || '#000000'}
                                                onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, backgroundColor: e.target.value } })}
                                                className="size-12 rounded-xl border border-white/10 bg-transparent cursor-pointer p-1"
                                            />
                                            <input
                                                type="text"
                                                value={settings.brandSettings?.backgroundColor || '#000000'}
                                                onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, backgroundColor: e.target.value } })}
                                                className="glossy-input flex-1 rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Navbar Background (RGBA/Hex)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="text"
                                            value={settings.brandSettings?.navbarBg || 'rgba(0, 0, 0, 0.4)'}
                                            onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, navbarBg: e.target.value } })}
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 uppercase"
                                            placeholder="rgba(0,0,0,0.4) or #000000"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Navbar Text Color</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="color"
                                            value={settings.brandSettings?.navbarText || '#ffffff'}
                                            onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, navbarText: e.target.value } })}
                                            className="size-12 rounded-xl border border-white/10 bg-transparent cursor-pointer p-1"
                                        />
                                        <input
                                            type="text"
                                            value={settings.brandSettings?.navbarText || '#ffffff'}
                                            onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, navbarText: e.target.value } })}
                                            className="glossy-input flex-1 rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 uppercase"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Primary Text Color</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="color"
                                            value={settings.brandSettings?.textMain || '#ffffff'}
                                            onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, textMain: e.target.value } })}
                                            className="size-12 rounded-xl border border-white/10 bg-transparent cursor-pointer p-1"
                                        />
                                        <input
                                            type="text"
                                            value={settings.brandSettings?.textMain || '#ffffff'}
                                            onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, textMain: e.target.value } })}
                                            className="glossy-input flex-1 rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 uppercase"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Secondary Text Color</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="color"
                                            value={settings.brandSettings?.textMuted || '#a1a1aa'}
                                            onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, textMuted: e.target.value } })}
                                            className="size-12 rounded-xl border border-white/10 bg-transparent cursor-pointer p-1"
                                        />
                                        <input
                                            type="text"
                                            value={settings.brandSettings?.textMuted || '#a1a1aa'}
                                            onChange={(e) => setSettings({ ...settings, brandSettings: { ...settings.brandSettings, textMuted: e.target.value } })}
                                            className="glossy-input flex-1 rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                            </div>
                        )}

                    {activeTab === 'homepage' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[24px]">web</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Frontend Dynamics</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Hero, Philosophy & Category Displays</p>
                                </div>
                            </div>

                            <div className="space-y-12 relative z-10">
                                {/* Hero Section */}
                                <div className="space-y-6">
                                    <h4 className="text-white text-sm font-bold border-b border-white/10 pb-2">Hero Section Metrics</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Sub-Headline</label>
                                            <input
                                                type="text"
                                                value={settings.homepageSettings.hero.subHeadline}
                                                onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, hero: { ...settings.homepageSettings.hero, subHeadline: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner placeholder-white/20"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Background Hollow Text</label>
                                            <input
                                                type="text"
                                                value={settings.homepageSettings.hero.hollowText || ''}
                                                onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, hero: { ...settings.homepageSettings.hero, hollowText: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner placeholder-white/20"
                                                placeholder="Leave empty to hide"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Hero Image</label>
                                            <div className="flex items-center gap-4">
                                                <div className="relative group size-24 flex-shrink-0">
                                                    <div className="w-full h-full rounded-2xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-black/60">
                                                        {homepageHeroPreview ? (
                                                            <img src={homepageHeroPreview} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-white/20 text-3xl group-hover:text-primary transition-colors">image</span>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleHomepageImageChange('hero', e)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Recommended: 1920x1080px</p>
                                                    <div className="flex gap-2">
                                                        <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-1 w-fit">
                                                            Upload
                                                            <input type="file" accept="image/*" onChange={(e) => handleHomepageImageChange('hero', e)} className="hidden" />
                                                        </label>
                                                        {homepageHeroPreview && (
                                                            <button onClick={() => {
                                                                setHomepageHeroFile(null);
                                                                setHomepageHeroPreview(null);
                                                                setSettings(prev => ({ ...prev, homepageSettings: { ...prev.homepageSettings, hero: { ...prev.homepageSettings.hero, imageUrl: '' } } }));
                                                            }} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-[9px] font-black uppercase tracking-widest text-red-500 transition-all">
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Headline Line 1</label>
                                            <input
                                                type="text"
                                                value={settings.homepageSettings.hero.headlineLine1}
                                                onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, hero: { ...settings.homepageSettings.hero, headlineLine1: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner placeholder-white/20"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Headline Line 2</label>
                                            <input
                                                type="text"
                                                value={settings.homepageSettings.hero.headlineLine2}
                                                onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, hero: { ...settings.homepageSettings.hero, headlineLine2: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner placeholder-white/20"
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Description</label>
                                            <input
                                                type="text"
                                                value={settings.homepageSettings.hero.descriptionLine1}
                                                onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, hero: { ...settings.homepageSettings.hero, descriptionLine1: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner placeholder-white/20 mb-2"
                                                placeholder="Line 1"
                                            />
                                            <input
                                                type="text"
                                                value={settings.homepageSettings.hero.descriptionLine2}
                                                onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, hero: { ...settings.homepageSettings.hero, descriptionLine2: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner placeholder-white/20"
                                                placeholder="Line 2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Philosophy Section */}
                                <div className="space-y-6">
                                    <h4 className="text-white text-sm font-bold border-b border-white/10 pb-2">Philosophy Section Metrics</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Sub-Headline</label>
                                            <input
                                                type="text"
                                                value={settings.homepageSettings.philosophy.subHeadline}
                                                onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, philosophy: { ...settings.homepageSettings.philosophy, subHeadline: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner placeholder-white/20"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Bg Image</label>
                                            <div className="flex items-center gap-4">
                                                <div className="relative group size-24 flex-shrink-0">
                                                    <div className="w-full h-full rounded-2xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-black/60">
                                                        {homepagePhilosophyPreview ? (
                                                            <img src={homepagePhilosophyPreview} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-white/20 text-3xl group-hover:text-primary transition-colors">image</span>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleHomepageImageChange('philosophy', e)}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Recommended: 1920x800px</p>
                                                    <div className="flex gap-2">
                                                        <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-1 w-fit">
                                                            Upload
                                                            <input type="file" accept="image/*" onChange={(e) => handleHomepageImageChange('philosophy', e)} className="hidden" />
                                                        </label>
                                                        {homepagePhilosophyPreview && (
                                                            <button onClick={() => {
                                                                setHomepagePhilosophyFile(null);
                                                                setHomepagePhilosophyPreview(null);
                                                                setSettings(prev => ({ ...prev, homepageSettings: { ...prev.homepageSettings, philosophy: { ...prev.homepageSettings.philosophy, imageUrl: '' } } }));
                                                            }} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-[9px] font-black uppercase tracking-widest text-red-500 transition-all">
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Main Quote</label>
                                            <textarea
                                                value={settings.homepageSettings.philosophy.quote}
                                                onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, philosophy: { ...settings.homepageSettings.philosophy, quote: e.target.value } } })}
                                                className="w-full h-24 pt-3 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner placeholder-white/20"
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Description</label>
                                            <input
                                                type="text"
                                                value={settings.homepageSettings.philosophy.descriptionLine1}
                                                onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, philosophy: { ...settings.homepageSettings.philosophy, descriptionLine1: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner placeholder-white/20 mb-2"
                                                placeholder="Line 1"
                                            />
                                            <input
                                                type="text"
                                                value={settings.homepageSettings.philosophy.descriptionLine2}
                                                onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, philosophy: { ...settings.homepageSettings.philosophy, descriptionLine2: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner placeholder-white/20"
                                                placeholder="Line 2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Categories Section */}
                                <div className="space-y-6">
                                    <h4 className="text-white text-sm font-bold border-b border-white/10 pb-2">Category Display Metrics</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Men */}
                                        <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <h5 className="text-white text-xs font-bold uppercase tracking-widest text-[#a14550]">Men's Card</h5>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Title</label>
                                                <input
                                                    type="text"
                                                    value={settings.homepageSettings.categories.men.title}
                                                    onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, categories: { ...settings.homepageSettings.categories, men: { ...settings.homepageSettings.categories.men, title: e.target.value } } } })}
                                                    className="w-full h-10 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-xs font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Subtitle</label>
                                                <input
                                                    type="text"
                                                    value={settings.homepageSettings.categories.men.subtitle}
                                                    onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, categories: { ...settings.homepageSettings.categories, men: { ...settings.homepageSettings.categories.men, subtitle: e.target.value } } } })}
                                                    className="w-full h-10 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-xs font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Image</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative group size-20 flex-shrink-0">
                                                        <div className="w-full h-full rounded-2xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-black/60">
                                                            {homepageMenPreview ? (
                                                                <img src={homepageMenPreview} alt="Preview" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-white/20 text-3xl group-hover:text-primary transition-colors">image</span>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleHomepageImageChange('men', e)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">800x1200px</p>
                                                        <div className="flex gap-2">
                                                            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-1 w-fit">
                                                                Upload
                                                                <input type="file" accept="image/*" onChange={(e) => handleHomepageImageChange('men', e)} className="hidden" />
                                                            </label>
                                                            {homepageMenPreview && (
                                                                <button onClick={() => {
                                                                    setHomepageMenFile(null);
                                                                    setHomepageMenPreview(null);
                                                                    setSettings(prev => ({ ...prev, homepageSettings: { ...prev.homepageSettings, categories: { ...prev.homepageSettings.categories, men: { ...prev.homepageSettings.categories.men, imageUrl: '' } } } }));
                                                                }} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-[9px] font-black uppercase tracking-widest text-red-500 transition-all">
                                                                    Clear
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Women */}
                                        <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <h5 className="text-white text-xs font-bold uppercase tracking-widest text-[#a14550]">Women's Card</h5>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Title</label>
                                                <input
                                                    type="text"
                                                    value={settings.homepageSettings.categories.women.title}
                                                    onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, categories: { ...settings.homepageSettings.categories, women: { ...settings.homepageSettings.categories.women, title: e.target.value } } } })}
                                                    className="w-full h-10 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-xs font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Subtitle</label>
                                                <input
                                                    type="text"
                                                    value={settings.homepageSettings.categories.women.subtitle}
                                                    onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, categories: { ...settings.homepageSettings.categories, women: { ...settings.homepageSettings.categories.women, subtitle: e.target.value } } } })}
                                                    className="w-full h-10 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-xs font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Image</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative group size-20 flex-shrink-0">
                                                        <div className="w-full h-full rounded-2xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-black/60">
                                                            {homepageWomenPreview ? (
                                                                <img src={homepageWomenPreview} alt="Preview" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-white/20 text-3xl group-hover:text-primary transition-colors">image</span>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleHomepageImageChange('women', e)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">800x1200px</p>
                                                        <div className="flex gap-2">
                                                            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-1 w-fit">
                                                                Upload
                                                                <input type="file" accept="image/*" onChange={(e) => handleHomepageImageChange('women', e)} className="hidden" />
                                                            </label>
                                                            {homepageWomenPreview && (
                                                                <button onClick={() => {
                                                                    setHomepageWomenFile(null);
                                                                    setHomepageWomenPreview(null);
                                                                    setSettings(prev => ({ ...prev, homepageSettings: { ...prev.homepageSettings, categories: { ...prev.homepageSettings.categories, women: { ...prev.homepageSettings.categories.women, imageUrl: '' } } } }));
                                                                }} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-[9px] font-black uppercase tracking-widest text-red-500 transition-all">
                                                                    Clear
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* SEO Section */}
                                    <div className="space-y-6">
                                        <h4 className="text-white text-sm font-bold border-b border-white/10 pb-2">Search Engine Optimization (SEO)</h4>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Meta Title</label>
                                                <input
                                                    type="text"
                                                    value={settings.homepageSettings.seo?.metaTitle || ''}
                                                    onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, seo: { ...settings.homepageSettings.seo, metaTitle: e.target.value } } })}
                                                    className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                                    placeholder="Homepage SEO Title (e.g. Noesis | Premium Fitness Apparel)"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Meta Description</label>
                                                <textarea
                                                    value={settings.homepageSettings.seo?.metaDescription || ''}
                                                    onChange={(e) => setSettings({ ...settings, homepageSettings: { ...settings.homepageSettings, seo: { ...settings.homepageSettings.seo, metaDescription: e.target.value } } })}
                                                    className="w-full h-24 pt-3 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                                    placeholder="Homepage SEO Description..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || contextLoading}
                                        className="h-14 bg-primary hover:bg-primary-light text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 px-8"
                                    >
                                        {isSaving ? 'Synchronizing...' : 'Synchronize Dynamics'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'about' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[24px]">info</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">About Us Narrative</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage brand story, mission, and philosophy</p>
                                </div>
                            </div>

                            <div className="space-y-12 relative z-10">
                                {/* About Hero Section */}
                                <div className="space-y-6">
                                    <h4 className="text-white text-sm font-bold border-b border-white/10 pb-2">Hero Narrative</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">EST Text (e.g. EST. 2024)</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.hero.estText}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, hero: { ...settings.aboutPageSettings.hero, estText: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Background Image</label>
                                            <div className="flex items-center gap-4">
                                                <div className="relative group size-12 flex-shrink-0">
                                                    <div className="w-full h-full rounded-xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                                                        {aboutHeroPreview ? (
                                                            <img src={aboutHeroPreview} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-white/20 text-xl">image</span>
                                                        )}
                                                    </div>
                                                    <input type="file" accept="image/*" onChange={(e) => handleAboutImageChange('hero', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Recommended: 1920x1080px</p>
                                                    <div className="flex gap-2">
                                                        <label className="cursor-pointer text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary-light transition-all">
                                                            Upload <input type="file" accept="image/*" onChange={(e) => handleAboutImageChange('hero', e)} className="hidden" />
                                                        </label>
                                                        {aboutHeroPreview && (
                                                            <button onClick={() => { setAboutHeroFile(null); setAboutHeroPreview(null); setSettings(prev => ({ ...prev, aboutPageSettings: { ...prev.aboutPageSettings, hero: { ...prev.aboutPageSettings.hero, bgImage: '' } } })); }} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400">Clear</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Hero Title</label>
                                            <textarea
                                                value={settings.aboutPageSettings.hero.title}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, hero: { ...settings.aboutPageSettings.hero, title: e.target.value } } })}
                                                className="w-full h-20 pt-3 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                                placeholder="Use \n for line breaks"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Hero Subtitle</label>
                                            <textarea
                                                value={settings.aboutPageSettings.hero.subtitle}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, hero: { ...settings.aboutPageSettings.hero, subtitle: e.target.value } } })}
                                                className="w-full h-20 pt-3 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Philosophy Section */}
                                <div className="space-y-6">
                                    <h4 className="text-white text-sm font-bold border-b border-white/10 pb-2">Philosophy Section</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Section Label</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.philosophy.label}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, philosophy: { ...settings.aboutPageSettings.philosophy, label: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Main Image</label>
                                            <div className="flex items-center gap-4">
                                                <div className="relative group size-12 flex-shrink-0">
                                                    <div className="w-full h-full rounded-xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                                                        {aboutPhilosophyPreview ? (
                                                            <img src={aboutPhilosophyPreview} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-white/20 text-xl">image</span>
                                                        )}
                                                    </div>
                                                    <input type="file" accept="image/*" onChange={(e) => handleAboutImageChange('philosophy', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Recommended: 1200x1600px</p>
                                                    <div className="flex gap-2">
                                                        <label className="cursor-pointer text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary-light transition-all">
                                                            Upload <input type="file" accept="image/*" onChange={(e) => handleAboutImageChange('philosophy', e)} className="hidden" />
                                                        </label>
                                                        {aboutPhilosophyPreview && (
                                                            <button onClick={() => { setAboutPhilosophyFile(null); setAboutPhilosophyPreview(null); setSettings(prev => ({ ...prev, aboutPageSettings: { ...prev.aboutPageSettings, philosophy: { ...prev.aboutPageSettings.philosophy, imageUrl: '' } } })); }} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400">Clear</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Section Title</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.philosophy.title}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, philosophy: { ...settings.aboutPageSettings.philosophy, title: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Philosophy Description</label>
                                            <textarea
                                                value={settings.aboutPageSettings.philosophy.description}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, philosophy: { ...settings.aboutPageSettings.philosophy, description: e.target.value } } })}
                                                className="w-full h-32 pt-3 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-medium leading-relaxed focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        {/* Stats Management */}
                                        {settings.aboutPageSettings.philosophy.stats.map((stat, idx) => (
                                            <div key={idx} className="flex flex-col gap-2.5 p-4 rounded-xl bg-white/5 border border-white/5">
                                                <label className="text-gray-500 text-[9px] font-black tracking-[0.2em] uppercase">Stat {idx + 1}</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        value={stat.value}
                                                        placeholder="Value (e.g. 100%)"
                                                        onChange={(e) => {
                                                            const newStats = [...settings.aboutPageSettings.philosophy.stats];
                                                            newStats[idx].value = e.target.value;
                                                            setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, philosophy: { ...settings.aboutPageSettings.philosophy, stats: newStats } } });
                                                        }}
                                                        className="h-10 bg-black/40 border border-white/5 rounded-lg px-3 text-white text-xs font-bold focus:border-primary/50 focus:outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={stat.label}
                                                        placeholder="Label"
                                                        onChange={(e) => {
                                                            const newStats = [...settings.aboutPageSettings.philosophy.stats];
                                                            newStats[idx].label = e.target.value;
                                                            setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, philosophy: { ...settings.aboutPageSettings.philosophy, stats: newStats } } });
                                                        }}
                                                        className="h-10 bg-black/40 border border-white/5 rounded-lg px-3 text-white text-xs font-bold focus:border-primary/50 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Core Values */}
                                <div className="space-y-6">
                                    <h4 className="text-white text-sm font-bold border-b border-white/10 pb-2">Core Values Section</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Section Label</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.coreValues.label}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, coreValues: { ...settings.aboutPageSettings.coreValues, label: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Section Title</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.coreValues.title}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, coreValues: { ...settings.aboutPageSettings.coreValues, title: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        {/* Core Value Blocks */}
                                        {settings.aboutPageSettings.coreValues.values.map((val, idx) => (
                                            <div key={idx} className="md:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-gray-500 text-[9px] font-black tracking-[0.2em] uppercase">Value Block {idx + 1}</label>
                                                    <span className="material-symbols-outlined text-primary text-sm">{val.icon}</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-gray-600 text-[8px] font-black uppercase">Title</label>
                                                        <input
                                                            type="text"
                                                            value={val.title}
                                                            onChange={(e) => {
                                                                const newValues = [...settings.aboutPageSettings.coreValues.values];
                                                                newValues[idx].title = e.target.value;
                                                                setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, coreValues: { ...settings.aboutPageSettings.coreValues, values: newValues } } });
                                                            }}
                                                            className="h-10 bg-black/40 border border-white/5 rounded-lg px-3 text-white text-xs font-bold focus:border-primary/50 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-gray-600 text-[8px] font-black uppercase">Material Icon Name</label>
                                                        <input
                                                            type="text"
                                                            value={val.icon}
                                                            onChange={(e) => {
                                                                const newValues = [...settings.aboutPageSettings.coreValues.values];
                                                                newValues[idx].icon = e.target.value;
                                                                setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, coreValues: { ...settings.aboutPageSettings.coreValues, values: newValues } } });
                                                            }}
                                                            className="h-10 bg-black/40 border border-white/5 rounded-lg px-3 text-white text-xs font-bold focus:border-primary/50 focus:outline-none"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 flex flex-col gap-2">
                                                        <label className="text-gray-600 text-[8px] font-black uppercase">Description</label>
                                                        <textarea
                                                            value={val.desc}
                                                            onChange={(e) => {
                                                                const newValues = [...settings.aboutPageSettings.coreValues.values];
                                                                newValues[idx].desc = e.target.value;
                                                                setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, coreValues: { ...settings.aboutPageSettings.coreValues, values: newValues } } });
                                                            }}
                                                            className="h-20 py-2 bg-black/40 border border-white/5 rounded-lg px-3 text-white text-xs font-medium focus:border-primary/50 focus:outline-none shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Quote Section */}
                                <div className="space-y-6">
                                    <h4 className="text-white text-sm font-bold border-b border-white/10 pb-2">Manifesto Quote</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2 flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Quote Text</label>
                                            <textarea
                                                value={settings.aboutPageSettings.quote.text}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, quote: { ...settings.aboutPageSettings.quote, text: e.target.value } } })}
                                                className="w-full h-24 pt-3 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-medium italic focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Author Name</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.quote.author}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, quote: { ...settings.aboutPageSettings.quote, author: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Author Title</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.quote.authorTitle}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, quote: { ...settings.aboutPageSettings.quote, authorTitle: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Join Section */}
                                <div className="space-y-6">
                                    <h4 className="text-white text-sm font-bold border-b border-white/10 pb-2">Call to Evolution (Join Section)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Section Title</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.join.title}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, join: { ...settings.aboutPageSettings.join, title: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Background Image</label>
                                            <div className="flex items-center gap-4">
                                                <div className="relative group size-12 flex-shrink-0">
                                                    <div className="w-full h-full rounded-xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                                                        {aboutJoinPreview ? (
                                                            <img src={aboutJoinPreview} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-white/20 text-xl">image</span>
                                                        )}
                                                    </div>
                                                    <input type="file" accept="image/*" onChange={(e) => handleAboutImageChange('join', e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Recommended: 1920x800px</p>
                                                    <div className="flex gap-2">
                                                        <label className="cursor-pointer text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary-light transition-all">
                                                            Upload <input type="file" accept="image/*" onChange={(e) => handleAboutImageChange('join', e)} className="hidden" />
                                                        </label>
                                                        {aboutJoinPreview && (
                                                            <button onClick={() => { setAboutJoinFile(null); setAboutJoinPreview(null); setSettings(prev => ({ ...prev, aboutPageSettings: { ...prev.aboutPageSettings, join: { ...prev.aboutPageSettings.join, bgImage: '' } } })); }} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400">Clear</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Section Subtitle</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.join.subtitle}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, join: { ...settings.aboutPageSettings.join, subtitle: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Button Text</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.join.buttonText}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, join: { ...settings.aboutPageSettings.join, buttonText: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Button Link</label>
                                            <input
                                                type="text"
                                                value={settings.aboutPageSettings.join.buttonLink}
                                                onChange={(e) => setSettings({ ...settings, aboutPageSettings: { ...settings.aboutPageSettings, join: { ...settings.aboutPageSettings.join, buttonLink: e.target.value } } })}
                                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 gap-4">
                                    <button
                                        onClick={handleDiscard}
                                        className="h-14 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest px-8 transition-all border border-white/5"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || contextLoading}
                                        className="h-14 bg-primary hover:bg-primary-light text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 px-8"
                                    >
                                        {isSaving ? 'Synchronizing...' : 'Synchronize Narrative'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'general' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[24px]">settings_input_component</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">General Parameters</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Core Identity & Regional Data</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                {/* Logo Upload Section */}
                                <div className="md:col-span-2 flex flex-col gap-2.5 mb-2">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Brand Insignia (Logo)</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group size-24 flex-shrink-0">
                                            <div className="size-24 rounded-2xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-black/60">
                                                {logoPreview ? (
                                                    <img src={logoPreview} alt="Store Logo" className="w-full h-full object-contain p-2" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-white/20 text-3xl group-hover:text-primary transition-colors">image</span>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-xs text-gray-400 font-medium max-w-xs leading-relaxed">
                                                Upload your visual identity manifest. Recommended: <span className="text-white">512x512px PNG</span> with transparent background.
                                            </p>
                                            <div className="flex gap-3">
                                                <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2 w-fit">
                                                    <span className="material-symbols-outlined text-[14px]">upload</span> Select Asset
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLogoChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                                {logoPreview && (
                                                    <button
                                                        onClick={() => {
                                                            setLogoFile(null);
                                                            setLogoPreview('');
                                                            handleInputChange('logoUrl', '');
                                                        }}
                                                        className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all font-bold"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Hero Image Upload Section */}
                                <div className="md:col-span-2 flex flex-col gap-2.5 mb-2">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Landing Page Hero Aesthetic</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group size-40 flex-shrink-0">
                                            <div className="w-full h-full rounded-2xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-black/60">
                                                {heroPreview ? (
                                                    <img src={heroPreview} alt="Hero Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-white/20 text-4xl group-hover:text-primary transition-colors">palette</span>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleHeroChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-xs text-gray-400 font-medium max-w-xs leading-relaxed">
                                                Architect the first impression. This image serves as the main background for your <span className="text-white">Home Page Hero</span> section.
                                            </p>
                                            <div className="flex gap-3">
                                                <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center gap-2 w-fit">
                                                    <span className="material-symbols-outlined text-[14px]">branding_watermark</span> Select Backdrop
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleHeroChange}
                                                        className="hidden"
                                                    />
                                                </label>
                                                {heroPreview && (
                                                    <button
                                                        onClick={() => {
                                                            setHeroFile(null);
                                                            setHeroPreview('');
                                                            handleInputChange('heroImageUrl', '');
                                                        }}
                                                        className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all font-bold"
                                                    >
                                                        Reset To Default
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Site URL (Primary Domain)</label>
                                    <input
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                        placeholder="https://wearnoesis.com"
                                        value={settings.siteUrl}
                                        onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Store Front Identity</label>
                                    <input
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                        value={settings.storeName}
                                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Support Endpoint</label>
                                    <input
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Transactional Currency</label>
                                    <div className="relative group">
                                        <select
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                            value={settings.currency}
                                            onChange={(e) => handleInputChange('currency', e.target.value)}
                                        >
                                            <option className="bg-[#0a0a0a]" value="USD">USD - United States Dollar</option>
                                            <option className="bg-[#0a0a0a]" value="EUR">EUR - European Euro</option>
                                            <option className="bg-[#0a0a0a]" value="GBP">GBP - British Pound Sterling</option>
                                            <option className="bg-[#0a0a0a]" value="KES">KES - Kenyan Shilling</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-gray-600 group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Temporal Alignment</label>
                                    <div className="relative group">
                                        <select
                                            className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                            value={settings.timezone}
                                            onChange={(e) => handleInputChange('timezone', e.target.value)}
                                        >
                                            <option className="bg-[#0a0a0a]" value="EST">(GMT-05:00) EST - Eastern Standard Time</option>
                                            <option className="bg-[#0a0a0a]" value="PST">(GMT-08:00) PST - Pacific Standard Time</option>
                                            <option className="bg-[#0a0a0a]" value="UTC">(GMT+00:00) UTC - Universal Time Coordinated</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-gray-600 group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined">schedule</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Price Format</label>
                                    <div className="flex items-center justify-between glossy-input w-full rounded-2xl bg-black/40 border-white/5 h-14 px-6 text-sm">
                                        <span className="text-white font-bold">Show Decimals</span>
                                        <div className="relative cursor-pointer" onClick={() => handleInputChange('showDecimals', !settings.showDecimals)}>
                                            <div className={`w-10 h-5 rounded-full transition-colors duration-300 ${settings.showDecimals ? 'bg-primary' : 'bg-gray-800'}`}></div>
                                            <div className={`absolute top-0.5 size-4 bg-white rounded-full transition-all duration-300 ${settings.showDecimals ? 'left-5.5' : 'left-0.5'}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seo' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[24px]">search</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">General SEO</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Search Engine & Discovery Settings</p>
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Global Meta Title</label>
                                    <input
                                        type="text"
                                        value={settings.seoSettings?.metaTitle || ''}
                                        onChange={(e) => setSettings({ ...settings, seoSettings: { ...settings.seoSettings, metaTitle: e.target.value } })}
                                        className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                        placeholder="Default Site Title"
                                    />
                                    <p className="text-[10px] text-gray-600 font-bold ml-1">Used as default if no specific page title is set.</p>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Global Meta Description</label>
                                    <textarea
                                        value={settings.seoSettings?.metaDescription || ''}
                                        onChange={(e) => setSettings({ ...settings, seoSettings: { ...settings.seoSettings, metaDescription: e.target.value } })}
                                        className="w-full h-24 pt-3 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                        placeholder="Default Site Description..."
                                    />
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Global Keywords</label>
                                    <input
                                        type="text"
                                        value={settings.seoSettings?.keywords || ''}
                                        onChange={(e) => setSettings({ ...settings, seoSettings: { ...settings.seoSettings, keywords: e.target.value } })}
                                        className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                        placeholder="Commas, separated, keywords"
                                    />
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Google Site Verification Code</label>
                                    <input
                                        type="text"
                                        value={settings.seoSettings?.googleSiteVerification || ''}
                                        onChange={(e) => setSettings({ ...settings, seoSettings: { ...settings.seoSettings, googleSiteVerification: e.target.value } })}
                                        className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                        placeholder="Paste the verification code (content attribute) or HTML tag"
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || contextLoading}
                                        className="h-14 bg-primary hover:bg-primary-light text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 px-8"
                                    >
                                        {isSaving ? 'Synchronizing...' : 'Synchronize Dynamics'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'shipping' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">local_shipping</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Logistics Nodes</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Shipping Matrix & Distribution Grid</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddShippingModal(true)} className="text-[10px] font-black text-primary hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest group">
                                    <span className="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform duration-300">add_circle</span> Add Node
                                </button>
                            </div>

                            <div className="w-full overflow-hidden rounded-3xl border border-white/5 bg-black/40">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/[0.01] border-b border-white/5">
                                        <tr>
                                            <th className="p-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">Protocol</th>
                                            <th className="p-6 text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Velocity</th>
                                            <th className="p-6 text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Cost Model</th>
                                            <th className="p-6 text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Actions</th>
                                            <th className="p-6 text-[10px] font-black text-gray-600 uppercase tracking-widest text-right">State</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {Array.isArray(shippingMethods) && shippingMethods.map((method) => (
                                            <tr key={method.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-6">
                                                    <div className="font-black text-white text-sm tracking-tight">{method.name}</div>
                                                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">{method.description}</div>
                                                </td>
                                                <td className="p-6 text-center text-xs font-bold text-gray-400">{method.deliveryTime}</td>
                                                <td className="p-6 text-center text-sm font-mono text-primary-light font-black">
                                                    {formatPrice(method.cost)}
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleEditShipping(method)} className="size-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-blue-400">
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        <button onClick={() => handleDeleteShipping(method.id)} className="size-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-red-400">
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex justify-end">
                                                        <div className="relative cursor-pointer" onClick={() => toggleShippingMethod(method.id)}>
                                                            <div className={`w-10 h-5 rounded-full transition-colors duration-300 ${method.enabled ? 'bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-gray-800'}`}></div>
                                                            <div className={`absolute top-0.5 size-4 bg-white rounded-full transition-all duration-300 ${method.enabled ? 'left-5.5' : 'left-0.5'}`}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">account_balance_wallet</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Payment Methods</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configure Payment Options</p>
                                    </div>
                                </div>
                                <button onClick={handleAddMethod} className="text-[10px] font-black text-primary hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest group">
                                    <span className="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform duration-300">add_circle</span> Add Method
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="glossy-panel rounded-3xl p-6 border border-white/5 bg-black/40 hover:bg-black/60 transition-all group shadow-xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-[#00C3F7] flex items-center justify-center text-white font-black text-[8px] shadow-[0_0_20px_rgba(0,195,247,0.3)] uppercase">Mpesa</div>
                                            <div>
                                                <h4 className="font-bold text-white text-base tracking-tight">Mpesa/Cards</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Mobile Money & Cards</p>
                                            </div>
                                        </div>
                                        <div className="relative cursor-pointer" onClick={() => togglePaymentGateway('paystack')}>
                                            <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${paymentGateways.paystack ? 'bg-primary' : 'bg-gray-800'}`}></div>
                                            <div className={`absolute top-1 size-4 bg-white rounded-full transition-all duration-300 ${paymentGateways.paystack ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Active Status</span>
                                        <button onClick={() => handleConfigurePayment('paystack')} className="text-[10px] text-white font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1">
                                            Configure <span className="material-symbols-outlined text-[14px]">bolt</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="glossy-panel rounded-3xl p-6 border border-white/5 bg-black/40 hover:bg-black/60 transition-all group shadow-xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-[#6366F1] flex items-center justify-center text-white font-black text-[10px] shadow-[0_0_20px_rgba(99,102,241,0.3)] uppercase">Stripe</div>
                                            <div>
                                                <h4 className="font-bold text-white text-base tracking-tight">Credit Card (Stripe)</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Global Payments Infrastructure</p>
                                            </div>
                                        </div>
                                        <div className="relative cursor-pointer" onClick={() => togglePaymentGateway('stripe')}>
                                            <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${paymentGateways.stripe ? 'bg-primary' : 'bg-gray-800'}`}></div>
                                            <div className={`absolute top-1 size-4 bg-white rounded-full transition-all duration-300 ${paymentGateways.stripe ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Active Status</span>
                                        <button onClick={() => handleConfigurePayment('stripe')} className="text-[10px] text-white font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1">
                                            Configure <span className="material-symbols-outlined text-[14px]">bolt</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="glossy-panel rounded-3xl p-6 border border-white/5 bg-black/40 hover:bg-black/60 transition-all group shadow-xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-[#003087] flex items-center justify-center text-white font-black text-[10px] shadow-[0_0_20px_rgba(0,48,135,0.3)] uppercase">PayPal</div>
                                            <div>
                                                <h4 className="font-bold text-white text-base tracking-tight">PayPal Checkout</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Express Checkout</p>
                                            </div>
                                        </div>
                                        <div className="relative cursor-pointer" onClick={() => togglePaymentGateway('paypal')}>
                                            <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${paymentGateways.paypal ? 'bg-primary' : 'bg-gray-800'}`}></div>
                                            <div className={`absolute top-1 size-4 bg-white rounded-full transition-all duration-300 ${paymentGateways.paypal ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Active Status</span>
                                        <button onClick={() => handleConfigurePayment('paypal')} className="text-[10px] text-white font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1">
                                            Configure <span className="material-symbols-outlined text-[14px]">bolt</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="glossy-panel rounded-3xl p-6 border border-white/5 bg-black/40 hover:bg-black/60 transition-all group shadow-xl">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-[#10B981] flex items-center justify-center"><span className="material-symbols-outlined text-white text-[24px]">local_shipping</span></div>
                                            <div>
                                                <h4 className="font-bold text-white text-base tracking-tight">Pay on Delivery</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Cash on Delivery</p>
                                            </div>
                                        </div>
                                        <div className="relative cursor-pointer" onClick={() => togglePaymentGateway('cod')}>
                                            <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${paymentGateways.cod ? 'bg-primary' : 'bg-gray-800'}`}></div>
                                            <div className={`absolute top-1 size-4 bg-white rounded-full transition-all duration-300 ${paymentGateways.cod ? 'left-7' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Active Status</span>
                                        <button onClick={() => handleConfigurePayment('cod')} className="text-[10px] text-white font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1">
                                            Configure <span className="material-symbols-outlined text-[14px]">bolt</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pages' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">layers</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Custom Pages</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Manage Dynamic Landing Pages</p>
                                    </div>
                                </div>
                                <button onClick={handleAddPage} className="h-12 bg-white/5 hover:bg-white/10 text-white px-6 rounded-2xl border border-white/10 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group">
                                    <span className="material-symbols-outlined text-primary group-hover:rotate-90 transition-transform duration-500">add_circle</span>
                                    Create New Page
                                </button>
                            </div>

                            {/* Search and Filters */}
                            <div className="flex flex-col md:flex-row gap-4 mb-8 relative z-10">
                                <div className="flex-1 relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search pages by title or slug..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                                        value={pageSearchQuery}
                                        onChange={(e) => setPageSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-2xl p-1.5 h-14">
                                    {['all', 'published', 'draft'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setPageStatusFilter(status)}
                                            className={`px-5 h-full rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${pageStatusFilter === status ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bulk Actions Bar */}
                            {selectedPages.length > 0 && (
                                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-300 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                                            <span className="text-[10px] font-black text-white">{selectedPages.length}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-primary-light uppercase tracking-widest">Pages Selected</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleBulkDeletePages} className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/10">Delete Cluster</button>
                                        <button onClick={() => setSelectedPages([])} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5">Cancel</button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4 px-2 relative z-10">
                                <button
                                    onClick={() => {
                                        const filteredPages = pages.filter(page => {
                                            const matchesSearch = page.title.toLowerCase().includes(pageSearchQuery.toLowerCase()) ||
                                                page.slug.toLowerCase().includes(pageSearchQuery.toLowerCase());
                                            const matchesStatus = pageStatusFilter === 'all' || page.status === pageStatusFilter;
                                            return matchesSearch && matchesStatus;
                                        });
                                        handleSelectAllPages(filteredPages);
                                    }}
                                    className="text-[10px] text-gray-500 hover:text-white font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                                >
                                    <span className="size-4 rounded border flex items-center justify-center transition-colors border-white/20">
                                        {selectedPages.length > 0 && <span className="material-symbols-outlined text-[12px] text-white">check</span>}
                                    </span>
                                    Select Options
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                {loadingPages ? (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center">
                                        <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(89,0,10,0.2)]"></div>
                                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Scanning Page Directory...</p>
                                    </div>
                                ) : pages.filter(page => {
                                    const matchesSearch = page.title.toLowerCase().includes(pageSearchQuery.toLowerCase()) ||
                                        page.slug.toLowerCase().includes(pageSearchQuery.toLowerCase());
                                    const matchesStatus = pageStatusFilter === 'all' || page.status === pageStatusFilter;
                                    return matchesSearch && matchesStatus;
                                }).length === 0 ? (
                                    <div className="col-span-full py-32 text-center rounded-[2rem] border-2 border-dashed border-white/5">
                                        <span className="material-symbols-outlined text-4xl text-gray-700 mb-4">search_off</span>
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No matching pages located.</p>
                                    </div>
                                ) : (
                                    pages.filter(page => {
                                        const matchesSearch = page.title.toLowerCase().includes(pageSearchQuery.toLowerCase()) ||
                                            page.slug.toLowerCase().includes(pageSearchQuery.toLowerCase());
                                        const matchesStatus = pageStatusFilter === 'all' || page.status === pageStatusFilter;
                                        return matchesSearch && matchesStatus;
                                    }).map((page) => (
                                        <div key={page.id} className={`glossy-panel p-6 rounded-3xl border transition-all group shadow-xl flex flex-col justify-between min-h-[240px] relative ${selectedPages.includes(page.id) ? 'border-primary/50 bg-primary/5 shadow-primary/10' : 'border-white/5 bg-black/40 hover:bg-black/60 hover:border-white/10'}`}>
                                            <div className="absolute top-4 right-4 z-10">
                                                <button
                                                    onClick={() => handleTogglePageSelection(page.id)}
                                                    className={`size-6 rounded-lg border flex items-center justify-center transition-all ${selectedPages.includes(page.id) ? 'bg-primary border-primary shadow-lg' : 'bg-black/40 border-white/10 hover:border-white/30'}`}
                                                >
                                                    {selectedPages.includes(page.id) && <span className="material-symbols-outlined text-[14px] text-white">check</span>}
                                                </button>
                                            </div>

                                            <div className="pr-8">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-white text-lg tracking-tight line-clamp-1">{page.title}</h4>
                                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${page.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                                                {page.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-mono">/{page.slug}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[14px] text-gray-600">image</span>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate">Hero: {page.hero_title || 'N/A'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[14px] text-gray-600">category</span>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Cat: {page.content_category_slug || 'None'}</p>
                                                    </div>
                                                    {page.meta_title && (
                                                        <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg w-fit">
                                                            <span className="material-symbols-outlined text-[12px] text-primary">analytics</span>
                                                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">SEO Configured</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                <div className="flex gap-4">
                                                    <Link to={`/${page.slug}`} target="_blank" className="text-[10px] text-primary hover:text-white font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                                                        View <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                                    </Link>
                                                    <button onClick={() => handleEditPage(page)} className="text-[10px] text-white font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-1.5">
                                                        Edit <span className="material-symbols-outlined text-[14px]">edit</span>
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePage(page.id);
                                                    }}
                                                    className="size-8 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}



                    {activeTab === 'taxes' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[24px]">receipt_long</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Fiscal Policy</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configure Global Tax Parameters</p>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <TaxSettingsForm
                                    settings={settings}
                                    onUpdate={(updates) => {
                                        const updatedSettings = { ...settings, ...updates };
                                        setSettings(updatedSettings);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">group</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Command Structure</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Admin Access & Roles</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowInviteModal(true)} className="text-[10px] font-black text-primary hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest group">
                                    <span className="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform duration-300">person_add</span> Invite Node
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                                {loadingTeam ? (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center">
                                        <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Scanning Personnel DB...</p>
                                    </div>
                                ) : teamMembers.map((member) => (
                                    <div key={member.id} className="glossy-panel p-6 rounded-3xl border border-white/5 bg-black/40 hover:bg-black/60 transition-all group shadow-xl">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="size-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-black text-lg border border-white/10 shadow-inner">
                                                {(member.full_name || member.email).substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-white text-sm tracking-tight truncate">{member.full_name || 'System Admin'}</h4>
                                                <p className="text-[10px] text-gray-400 font-medium truncate">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            <span className="bg-primary/10 text-primary-light px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                                {member.role || 'Viewer'}
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {member.role !== 'admin' && (
                                                    <button
                                                        onClick={() => {
                                                            setInviteForm({
                                                                fullName: member.full_name || '',
                                                                email: member.email || '',
                                                                role: member.role || 'viewer'
                                                            });
                                                            setEditingMemberId(member.id);
                                                            setShowInviteModal(true);
                                                        }}
                                                        className="text-gray-400 hover:text-white transition-colors p-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">edit</span>
                                                    </button>
                                                )}
                                                {member.role !== 'admin' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!window.confirm('Are you sure you want to decouple this node?')) return;
                                                            try {
                                                                const { error } = await supabase.from('team_members').delete().eq('id', member.id);
                                                                if (error) throw error;
                                                                notify('Node decoupled.', 'success');
                                                                fetchTeamMembers();
                                                            } catch (e) {
                                                                notify('Failed to remove node.', 'error');
                                                            }
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[24px]">mail</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Signal Dispatch</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Alert Configuration & Mail Engine</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                {/* Alert Recipients */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary-light text-sm">notifications</span> Alert Recipients
                                        </h4>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex gap-2">
                                                <input
                                                    className="glossy-input flex-1 rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-4 text-xs outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                                    placeholder="Add email address..."
                                                    id="newAlertEmail"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = e.target.value.trim();
                                                            const currentEmails = settings.alertEmails || [];
                                                            if (val && !currentEmails.includes(val)) {
                                                                handleInputChange('alertEmails', [...currentEmails, val]);
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const input = document.getElementById('newAlertEmail');
                                                        const val = input.value.trim();
                                                        const currentEmails = settings.alertEmails || [];
                                                        if (val && !currentEmails.includes(val)) {
                                                            handleInputChange('alertEmails', [...currentEmails, val]);
                                                            input.value = '';
                                                        }
                                                    }}
                                                    className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary-light border border-primary/20 hover:bg-primary/30 transition-all"
                                                >
                                                    <span className="material-symbols-outlined">add</span>
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(settings.alertEmails || []).map((email, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 group">
                                                        <span className="text-[10px] font-bold text-gray-300">{email}</span>
                                                        <button
                                                            onClick={() => handleInputChange('alertEmails', (settings.alertEmails || []).filter((_, idx) => idx !== i))}
                                                            className="text-gray-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                                {(settings.alertEmails || []).length === 0 && (
                                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest py-2">No custom alerts configured</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resend Configuration */}
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary-light text-sm">hub</span> Mail Service (Resend)
                                        </h4>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Resend API Key</label>
                                                <input
                                                    className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-5 text-xs outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                                    type="password"
                                                    placeholder="re_xxxxxxxxxxxxxxxxx"
                                                    value={settings.resendConfig.apiKey}
                                                    onChange={(e) => handleInputChange('resendConfig', { ...settings.resendConfig, apiKey: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Verified Sender (From)</label>
                                                <input
                                                    className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-5 text-xs outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                                    placeholder="onboarding@resend.dev"
                                                    value={settings.resendConfig.fromEmail}
                                                    onChange={(e) => handleInputChange('resendConfig', { ...settings.resendConfig, fromEmail: e.target.value })}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Connect Domain</label>
                                                <input
                                                    className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-12 px-5 text-xs outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                                                    placeholder="wearnoesis.com"
                                                    value={settings.resendConfig.verifiedDomain}
                                                    onChange={(e) => handleInputChange('resendConfig', { ...settings.resendConfig, verifiedDomain: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'policies' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[24px]">policy</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Legal Protocols</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Privacy & Terms of Service</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-8 relative z-10">
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Privacy Policy</label>
                                    <textarea
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-medium p-6 min-h-[300px] text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        placeholder="Enter your Privacy Policy content (HTML/Text)..."
                                        value={settings.privacyPolicy}
                                        onChange={(e) => handleInputChange('privacyPolicy', e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 ml-1">Supports HTML and Text formatting</p>
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Terms of Service</label>
                                    <textarea
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-medium p-6 min-h-[300px] text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        placeholder="Enter your Terms of Service content (HTML/Text)..."
                                        value={settings.termsOfService}
                                        onChange={(e) => handleInputChange('termsOfService', e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 ml-1">Supports HTML and Text formatting</p>
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Returns & Exchanges Policy</label>
                                    <textarea
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-medium p-6 min-h-[300px] text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        placeholder="Enter your Returns & Exchanges content..."
                                        value={settings.returnsPolicy}
                                        onChange={(e) => handleInputChange('returnsPolicy', e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 ml-1">Supports HTML and Text formatting</p>
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Size Guide</label>
                                    <textarea
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-medium p-6 min-h-[300px] text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        placeholder="Enter your Size Guide content..."
                                        value={settings.sizeGuide}
                                        onChange={(e) => handleInputChange('sizeGuide', e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 ml-1">Supports HTML and Text formatting</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[24px]">contact_support</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Contact Architecture</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Public Communication Nodes</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Support Phone</label>
                                    <input
                                        type="text"
                                        className="glossy-input w-full h-14 rounded-2xl bg-black/40 border-white/5 text-white font-medium px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        value={settings.contactPhone}
                                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Office Address</label>
                                    <input
                                        type="text"
                                        className="glossy-input w-full h-14 rounded-2xl bg-black/40 border-white/5 text-white font-medium px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        value={settings.contactAddress}
                                        onChange={(e) => handleInputChange('contactAddress', e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Hours: Mon-Fri</label>
                                    <input
                                        type="text"
                                        className="glossy-input w-full h-14 rounded-2xl bg-black/40 border-white/5 text-white font-medium px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        value={settings.operatingHours?.mon_fri || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, operatingHours: { ...prev.operatingHours, mon_fri: e.target.value } }))}
                                    />
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Hours: Saturday</label>
                                    <input
                                        type="text"
                                        className="glossy-input w-full h-14 rounded-2xl bg-black/40 border-white/5 text-white font-medium px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        value={settings.operatingHours?.sat || ''}
                                        onChange={(e) => setSettings(prev => ({ ...prev, operatingHours: { ...prev.operatingHours, sat: e.target.value } }))}
                                    />
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Instagram URL</label>
                                    <input
                                        type="text"
                                        className="glossy-input w-full h-14 rounded-2xl bg-black/40 border-white/5 text-white font-medium px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        value={settings.instagramUrl}
                                        onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Twitter URL</label>
                                    <input
                                        type="text"
                                        className="glossy-input w-full h-14 rounded-2xl bg-black/40 border-white/5 text-white font-medium px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        value={settings.twitterUrl}
                                        onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Facebook URL</label>
                                    <input
                                        type="text"
                                        className="glossy-input w-full h-14 rounded-2xl bg-black/40 border-white/5 text-white font-medium px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        value={settings.facebookUrl}
                                        onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'login' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[24px]">login</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Auth Interface</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configure Login Page Aesthetics</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Login Page Title</label>
                                        <input
                                            type="text"
                                            className="glossy-input w-full h-14 rounded-2xl bg-black/40 border-white/5 text-white font-medium px-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-display"
                                            value={settings.loginPageSettings?.login_title || ''}
                                            onChange={(e) => setSettings(prev => ({
                                                ...prev,
                                                loginPageSettings: { ...prev.loginPageSettings, login_title: e.target.value }
                                            }))}
                                            placeholder="e.g. Elevate Your Performance."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Login Page Subtitle</label>
                                        <textarea
                                            className="glossy-input w-full h-32 rounded-2xl bg-black/40 border-white/5 text-white font-medium p-6 text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-display resize-none"
                                            value={settings.loginPageSettings?.login_subtitle || ''}
                                            onChange={(e) => setSettings(prev => ({
                                                ...prev,
                                                loginPageSettings: { ...prev.loginPageSettings, login_subtitle: e.target.value }
                                            }))}
                                            placeholder="Enter description text..."
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Background Image</label>
                                    <div className="relative group">
                                        <div className="w-full aspect-video rounded-3xl bg-black/40 border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center group-hover:border-primary/40 transition-all">
                                            {loginPreview ? (
                                                <img src={loginPreview} alt="Login Background" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Select Image Asset</span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleLoginImageChange}
                                            />
                                        </div>
                                        {loginPreview && (
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-3xl">
                                                <span className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[16px]">upload</span> Replace Image Asset
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {loginPreview && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLoginPreview(null);
                                                setLoginFile(null);
                                                setSettings(prev => ({
                                                    ...prev,
                                                    loginPageSettings: { ...prev.loginPageSettings, login_bg_url: '' }
                                                }));
                                            }}
                                            className="text-[10px] text-red-500 hover:text-red-400 font-black uppercase tracking-widest flex items-center justify-center gap-2 mt-2"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">delete</span> Remove Image asset
                                        </button>
                                    )}
                                    <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest ml-1 text-center">Recommended Resolution: 1920x1080 (High Performance Texture)</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'checkout' && (
                        <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                    <span className="material-symbols-outlined text-primary-light text-[24px]">shopping_bag</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Checkout Interface</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configure Checkout Experience</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-8 relative z-10">
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Gift Message (HTML Supported)</label>
                                    <textarea
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-medium p-6 min-h-[150px] text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all font-mono"
                                        placeholder="Free gift included with <br /> <span class='text-[#a14550]'>first collection</span> purchase."
                                        value={settings.checkoutPageSettings?.giftMessage || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            checkoutPageSettings: { ...prev.checkoutPageSettings, giftMessage: e.target.value }
                                        }))}
                                    />
                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 ml-1">
                                        This text appears in the sidebar during checkout. Leave blank to hide.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* System Telemetry Footer */}
            <div className="flex items-center justify-between px-4 pt-12 border-t border-white/5 mt-auto text-gray-800 font-black uppercase tracking-[0.4em] text-[8px] grayscale hover:grayscale-0 hover:text-white transition-all duration-500">
                <div>Integrated Node System v2.4.9 // Cluster_Settings_Control</div>
                <div className="flex gap-12">
                    <div className="flex flex-col items-end">
                        <span className="text-[7px] text-gray-600">Access Key</span>
                        <span>AES_256_RSA_01</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[7px] text-gray-600">Sync Status</span>
                        <span className="text-primary-light">Propagating...</span>
                    </div>
                </div>
            </div>
        </div>

            {/* Modals */ }
    {
        showPageModal && (
            <div className="fixed inset-0 bg-black/99 backdrop-blur-3xl z-[100] flex items-center justify-center p-4 md:p-6 text-white overflow-hidden">
                <div className="glossy-panel rounded-[2.5rem] p-0 max-w-4xl w-full border border-white/10 bg-black/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
                    {/* Modal Header */}
                    <div className="p-8 pb-4 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <span className="material-symbols-outlined text-primary text-[24px]">{editingPageId ? 'edit_note' : 'add_circle'}</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">{editingPageId ? 'Edit Page Protocol' : 'Initialise New Page'}</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{editingPageId ? `Modifying: ${pageForm.title}` : 'Creating new dynamic node'}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowPageModal(false)} className="size-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all group">
                            <span className="material-symbols-outlined text-gray-500 group-hover:text-white group-hover:rotate-90 transition-all">close</span>
                        </button>
                    </div>

                    {/* Modal Tabs */}
                    <div className="flex items-center gap-2 px-8 py-4 bg-white/[0.01] border-b border-white/5">
                        {[
                            { id: 'general', label: 'General', icon: 'settings' },
                            { id: 'hero', label: 'Hero Section', icon: 'image' },
                            { id: 'seo', label: 'SEO Config', icon: 'analytics' },
                            { id: 'advanced', label: 'Advanced', icon: 'code' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActivePageModalTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePageModalTab === tab.id ? 'bg-primary text-white shadow-[0_0_20px_rgba(89,0,10,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSavePage} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        {activePageModalTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1 flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Page Title</label>
                                        <input className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 shadow-inner text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all" required value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })} placeholder="e.g. Our Story" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1 flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">URL Slug</label>
                                        <div className="flex flex-col gap-1">
                                            <input
                                                className={`glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 shadow-inner text-sm font-mono outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all ${pageForm.is_system ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                placeholder="auto-generated"
                                                value={pageForm.slug}
                                                onChange={(e) => !pageForm.is_system && setPageForm({ ...pageForm, slug: e.target.value })}
                                                readOnly={pageForm.is_system}
                                            />
                                            {pageForm.is_system && <p className="text-[8px] text-primary/60 font-bold uppercase tracking-widest ml-1">System slugs are immutable</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1 flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Display Status</label>
                                        <select className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 shadow-inner text-sm appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all" value={pageForm.status} onChange={(e) => setPageForm({ ...pageForm, status: e.target.value })}>
                                            <option value="published" className="bg-black text-white">Published (Live)</option>
                                            <option value="draft" className="bg-black text-white">Draft (Hidden)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1 flex flex-col gap-2.5">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Linked Category</label>
                                        <select className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 shadow-inner text-sm appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all" value={pageForm.content_category_slug} onChange={(e) => setPageForm({ ...pageForm, content_category_slug: e.target.value })}>
                                            <option value="" className="bg-black text-white">No Category Link</option>
                                            {availableCategories.map(cat => (
                                                <option key={cat.id} value={cat.slug} className="bg-black text-white">{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="is_system_protected"
                                            checked={pageForm.is_system}
                                            onChange={(e) => setPageForm({ ...pageForm, is_system: e.target.checked })}
                                            className="accent-primary w-5 h-5 rounded cursor-pointer"
                                        />
                                        <div>
                                            <label htmlFor="is_system_protected" className="text-white text-xs font-black uppercase tracking-widest cursor-pointer select-none">
                                                System Protected
                                            </label>
                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Protect this page from deletion via standard API clusters</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activePageModalTab === 'hero' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Hero Title</label>
                                    <input className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 shadow-inner text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all" value={pageForm.hero_title} onChange={(e) => setPageForm({ ...pageForm, hero_title: e.target.value })} placeholder="Large heading text..." />
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Hero Subtitle</label>
                                    <input className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 shadow-inner text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all" value={pageForm.hero_subtitle} onChange={(e) => setPageForm({ ...pageForm, hero_subtitle: e.target.value })} placeholder="Supporting text..." />
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Hero Background Image</label>
                                    <div className="flex items-center gap-6 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                        <label className="cursor-pointer h-24 w-40 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 border-dashed text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex flex-col items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                                            Upload Asset
                                            <input type="file" accept="image/*" onChange={handlePageFileChange} className="hidden" />
                                        </label>
                                        {pageHeroPreview ? (
                                            <div className="relative group">
                                                <img src={pageHeroPreview} alt="Preview" className="h-24 w-40 object-cover rounded-2xl border border-white/10 shadow-2xl" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPageHeroPreview(null);
                                                        setPageHeroFile(null);
                                                        setPageForm({ ...pageForm, removeImage: true });
                                                    }}
                                                    className="absolute -top-2 -right-2 size-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="h-24 w-40 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-gray-800 text-[32px]">image</span>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Asset Status</h5>
                                            <p className="text-[9px] text-gray-500 font-medium uppercase leading-relaxed">High-resolution assets recommended (2000px+). System will automatically optimize for global distribution.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activePageModalTab === 'seo' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Meta Title</label>
                                    <input className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 shadow-inner text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all" value={pageForm.meta_title} onChange={(e) => setPageForm({ ...pageForm, meta_title: e.target.value })} placeholder="SEO Title (leave empty to use page title)..." />
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Meta Description</label>
                                    <textarea
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold p-6 min-h-[120px] text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all"
                                        value={pageForm.meta_description}
                                        onChange={(e) => setPageForm({ ...pageForm, meta_description: e.target.value })}
                                        placeholder="Search engine description (recommended: 150-160 characters)..."
                                    />
                                </div>

                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-primary">visibility</span>
                                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest">SERP Preview</h5>
                                    </div>
                                    <div className="bg-white/[0.02] p-4 rounded-xl space-y-1">
                                        <div className="text-[#1a0dab] text-lg font-medium hover:underline cursor-pointer">{pageForm.meta_title || pageForm.title || 'Page Title Preview'}</div>
                                        <div className="text-[#006621] text-sm">noesis.store/{pageForm.slug || 'url'}</div>
                                        <div className="text-[#4d5156] text-sm line-clamp-2">{pageForm.meta_description || 'Search engine snippet preview will appear here once description is provided...'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activePageModalTab === 'advanced' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex flex-col gap-2.5">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase">Custom CSS Overrides</label>
                                        <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded font-black uppercase tracking-widest">Developer Mode</span>
                                    </div>
                                    <textarea
                                        className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-mono p-6 min-h-[250px] text-sm outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60 transition-all"
                                        value={pageForm.custom_css}
                                        onChange={(e) => setPageForm({ ...pageForm, custom_css: e.target.value })}
                                        placeholder=".hero-section { background: linear-gradient(...); }"
                                    />
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 ml-1">CSS will be injected directly into the page header for scoped styling.</p>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Modal Footer */}
                    <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
                        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest hidden md:block">
                            Last Sync: {new Date().toLocaleTimeString()} // Cluster_Alpha
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <button type="button" onClick={() => setShowPageModal(false)} className="flex-1 md:flex-none h-14 px-8 border border-white/5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">Cancel</button>
                            <button
                                type="button"
                                onClick={handleSavePage}
                                disabled={isSaving}
                                className="flex-1 md:flex-none h-14 px-10 bg-primary hover:bg-primary-light text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                )}
                                {editingPageId ? 'Commit Changes' : 'Initialize Node'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    {
        showAddMethodModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="glossy-panel rounded-3xl p-8 max-w-2xl w-full border border-white/10 bg-black/90">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Add Payment Method</h2>
                        <button onClick={() => setShowAddMethodModal(false)} className="size-10 rounded-xl hover:bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined text-gray-400">close</span></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {!paymentGateways.stripe && (
                            <button onClick={() => handleAddNewMethod('stripe')} className="glossy-panel p-6 rounded-2xl border border-white/5 hover:border-primary/50 transition-all group text-left">
                                <div className="size-12 rounded-xl bg-[#635BFF] flex items-center justify-center text-white font-black text-xs mb-4 shadow-[0_0_20px_rgba(99,91,255,0.3)]">STRIPE</div>
                                <h4 className="font-bold text-white text-sm text-left">Credit Card (Stripe)</h4>
                            </button>
                        )}
                        {!paymentGateways.paypal && (
                            <button onClick={() => handleAddNewMethod('paypal')} className="glossy-panel p-6 rounded-2xl border border-white/5 hover:border-primary/50 transition-all group text-left">
                                <div className="size-12 rounded-xl bg-[#003087] flex items-center justify-center text-white font-black text-[9px] mb-4 shadow-[0_0_20px_rgba(0,48,135,0.3)]">PAYPAL</div>
                                <h4 className="font-bold text-white text-sm text-left">PayPal</h4>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    {
        showConfigModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="glossy-panel rounded-3xl p-8 max-w-2xl w-full border border-white/10 bg-black/90">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                            Configure {selectedPaymentMethod === 'paystack' ? 'Mpesa/Cards' :
                                selectedPaymentMethod === 'stripe' ? 'Credit Card (Stripe)' :
                                    selectedPaymentMethod}
                        </h2>
                        <button onClick={() => setShowConfigModal(false)} className="size-10 rounded-xl hover:bg-white/10 flex items-center justify-center"><span className="material-symbols-outlined text-gray-400">close</span></button>
                    </div>
                    <div className="space-y-4">
                        {selectedPaymentMethod === 'paystack' && (
                            <>
                                <input type="text" className="glossy-input w-full rounded-2xl bg-black/40 border border-white/5 text-white font-bold h-12 px-4 shadow-inner" placeholder="Public Key" value={paymentConfig.publicKey || ''} onChange={(e) => setPaymentConfig({ ...paymentConfig, publicKey: e.target.value })} />
                                <input type="password" className="glossy-input w-full rounded-2xl bg-black/40 border border-white/5 text-white font-bold h-12 px-4 shadow-inner" placeholder="Secret Key" value={paymentConfig.secretKey || ''} onChange={(e) => setPaymentConfig({ ...paymentConfig, secretKey: e.target.value })} />
                            </>
                        )}
                        {selectedPaymentMethod === 'cod' && (
                            <textarea className="glossy-input w-full rounded-2xl bg-black/40 border border-white/5 text-white font-bold p-4 min-h-[100px] shadow-inner" placeholder="Instructions..." value={paymentConfig.instructions || ''} onChange={(e) => setPaymentConfig({ ...paymentConfig, instructions: e.target.value })} />
                        )}
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setShowConfigModal(false)} className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-sm uppercase tracking-widest">Cancel</button>
                        <button onClick={handleSavePaymentConfig} className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary-light text-white font-black text-sm uppercase tracking-widest shadow-xl">Save</button>
                    </div>
                </div>
            </div>
        )
    }

    {
        showAddShippingModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="glossy-panel rounded-3xl p-8 max-w-2xl w-full border border-white/10 bg-black/90">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Add Shipping Node</h2>
                    <ShippingMethodForm onSubmit={handleAddShipping} onCancel={() => setShowAddShippingModal(false)} />
                </div>
            </div>
        )
    }

    {
        showEditShippingModal && editingShipping && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="glossy-panel rounded-3xl p-8 max-w-2xl w-full border border-white/10 bg-black/90">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Edit Shipping Node</h2>
                    <ShippingMethodForm initialData={editingShipping} onSubmit={(data) => {
                        const updated = { ...editingShipping, ...data };
                        setShippingMethods(prev => prev.map(m => m.id === updated.id ? updated : m));
                        setShowEditShippingModal(false);
                        notify('Updated.', 'success');
                    }} onCancel={() => setShowEditShippingModal(false)} />
                </div>
            </div>
        )
    }

    {
        showAddTaxModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="glossy-panel rounded-3xl p-8 max-w-2xl w-full border border-white/10 bg-black/90">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Add Tax Jurisdiction</h2>
                    <TaxForm onSubmit={handleAddTax} onCancel={() => setShowAddTaxModal(false)} />
                </div>
            </div>
        )
    }

    {
        showEditTaxModal && editingTax && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="glossy-panel rounded-3xl p-8 max-w-2xl w-full border border-white/10 bg-black/90">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6">Edit Tax Jurisdiction</h2>
                    <TaxForm initialData={editingTax} onSubmit={handleUpdateTax} onCancel={() => setShowEditTaxModal(false)} />
                </div>
            </div>
        )
    }

    <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                select option { background-color: #0a0a0a; color: white; padding: 10px; }
            `}</style>

    {/* Invite Node Modal */ }
    {
        showInviteModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowInviteModal(false)}></div>
                <div className="glossy-panel w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/10 bg-black shadow-2xl animate-in fade-in zoom-in duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>

                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                <span className="material-symbols-outlined text-primary-light">person_add</span>
                            </div>
                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Invite Node</h3>
                        </div>
                        <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex flex-col gap-2.5">
                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Personnel Email</label>
                            <input
                                className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none"
                                placeholder="admin@wearnoesis.com"
                                value={inviteForm.email}
                                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Full Identity</label>
                            <input
                                className="glossy-input w-full rounded-2xl bg-black/40 border-white/5 text-white font-bold h-14 px-6 text-sm outline-none"
                                placeholder="Full Name"
                                value={inviteForm.fullName}
                                onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Access Protocol (Role)</label>
                            <div className="grid grid-cols-2 gap-4">
                                {['Viewer', 'Shop Manager', 'Editor'].map((roleDisplay) => {
                                    const roleValue = roleDisplay.toLowerCase().replace(' ', '_');
                                    return (
                                        <button
                                            key={roleValue}
                                            onClick={() => setInviteForm({ ...inviteForm, role: roleValue })}
                                            className={`px-4 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${inviteForm.role === roleValue
                                                ? 'bg-primary/20 border-primary text-primary-light'
                                                : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'
                                                }`}
                                        >
                                            {roleDisplay}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <button
                            onClick={async () => {
                                if (!inviteForm.email) return notify('Identity required', 'error');
                                setIsSaving(true);
                                try {
                                    let error = null;

                                    if (editingMemberId) {
                                        // Update existing team member
                                        const { error: updateError } = await supabase
                                            .from('team_members')
                                            .update({
                                                full_name: inviteForm.fullName,
                                                email: inviteForm.email,
                                                role: inviteForm.role
                                            })
                                            .eq('id', editingMemberId);
                                        error = updateError;
                                    } else {
                                        // Create new team member
                                        const { error: insertError } = await supabase
                                            .from('team_members')
                                            .insert({
                                                email: inviteForm.email,
                                                full_name: inviteForm.fullName,
                                                role: inviteForm.role,
                                                invited_by: user?.id
                                            });
                                        error = insertError;
                                    }

                                    if (error) throw error;
                                    notify('Node designated successfully.', 'success');
                                    setShowInviteModal(false);
                                    fetchTeamMembers();
                                    // Reset form
                                    setInviteForm({ email: '', fullName: '', role: 'editor' });
                                    setEditingMemberId(null);
                                } catch (err) {
                                    console.error('Invite error:', err);
                                    notify('Registration failed: ' + (err.message || 'Unknown error'), 'error');
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            disabled={isSaving}
                            className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-[0_0_20px_rgba(89,0,10,0.3)] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
                        >
                            {isSaving ? <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <span className="material-symbols-outlined">{editingMemberId ? 'save' : 'shield'}</span>}
                            {editingMemberId ? 'Update Node' : 'Assign Node'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

        </AdminLayout >
    );
};

export default StoreSettingsPage;
