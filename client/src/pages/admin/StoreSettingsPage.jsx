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
import HomepageListingsSettings from '../../components/admin/HomepageListingsSettings';
import ProductSettingsPanel from '../../components/admin/settings/ProductSettingsPanel';
import { DEFAULT_HOMEPAGE_SECTIONS, mergeHomepageSettings } from '../../constants/homepageDefaults';
import { PRODUCT_PAGE_PRESETS } from '../../utils/productPresets';
import { deletePageHeroImage, isPersistedPageId, removePageFromNavigation } from '../../utils/pageCleanup';

const StoreSettingsPage = () => {
    const { settings: contextSettings, updateSettings, loading: contextLoading, currencySymbol, formatPrice } = useStoreSettings();
    const { user, profile, refreshProfile } = useAuth();
    const { notify } = useNotification();
    const [activeTab, setActiveTab] = useState('general');
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
            sections: DEFAULT_HOMEPAGE_SECTIONS,
            seo: {
                metaTitle: '',
                metaDescription: '',
            },
            mobileColumns: 2,
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
            primaryColor: "#ff007f",
            secondaryColor: "#000000",
            accentColor: "#d86928",
            backgroundColor: "#000000"
        },
        productPageSettings: {
            layoutRatio: '1/2,1/2',
            imageFit: 'cover',
            galleryLayout: 'grid',
            thumbnailColumns: 4,
            thumbnailSize: 100,
            mainImageRadius: 0,
            thumbnailRadius: 0,
            showStock: true
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

            // 1. Fetch from team_members table
            const { data: teamData, error: teamError } = await supabase
                .from('team_members')
                .select('*')
                .order('created_at', { ascending: false });

            if (teamError) throw teamError;

            // 2. Fetch from profiles table (Admins only)
            const { data: profileAdmins, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'admin')
                .order('created_at', { ascending: false });

            if (profileError) {
                console.warn('Could not fetch profiles for team management:', profileError);
            }

            // 3. Merge them uniquely by email
            const allMembers = [...(teamData || [])];
            const existingEmails = new Set(allMembers.map(m => (m.email || '').toLowerCase()));

            if (profileAdmins) {
                profileAdmins.forEach(prof => {
                    const profEmail = (prof.email || '').toLowerCase();
                    if (profEmail && !existingEmails.has(profEmail)) {
                        allMembers.push({
                            id: prof.id,
                            email: prof.email,
                            full_name: prof.full_name,
                            role: 'admin',
                            status: 'active',
                            created_at: prof.created_at,
                            is_from_profile: true // Mark so we know where it came from
                        });
                        existingEmails.add(profEmail);
                    }
                });
            }

            // Check if current admin user's email needs to be synced in team_members
            if (user?.email && profile?.role === 'admin') {
                const adminInTeam = (teamData || []).find(m => (m.email || '').toLowerCase() === user.email.toLowerCase());

                // If the logged in admin is not in team_members but is in profiles, 
                // we don't necessarily need to sync to team_members table unless we want to,
                // but the current logic tried to update a generic "admin" entry.
                // Let's just ensure they are in the combined list correctly.
            }

            setTeamMembers(allMembers);
        } catch (error) {
            console.error('Error fetching team:', error);
            notify('Failed to load personnel data', 'error');
        } finally {
            setLoadingTeam(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'general') {
            fetchTeamMembers();
        }
    }, [activeTab]);
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
                homepageSettings: mergeHomepageSettings(contextSettings.homepageSettings),
                navigationSettings: contextSettings.navigationSettings || [],
                aboutPageSettings: contextSettings.aboutPageSettings || {
                    hero: { bgImage: '', estText: '', title: '', subtitle: '' },
                    philosophy: { imageUrl: '', label: '', title: '', description: '', stats: [] },
                    coreValues: { label: '', title: '', values: [] },
                    quote: { text: '', author: '', authorTitle: '' },
                    join: { bgImage: '', title: '', subtitle: '', buttonText: '', buttonLink: '' }
                },
                productPageSettings: contextSettings.productPageSettings || {
                    layoutRatio: '1/2,1/2',
                    imageFit: 'cover',
                    galleryLayout: 'grid',
                    thumbnailColumns: 4,
                    thumbnailSize: 100,
                    mainImageRadius: 0,
                    thumbnailRadius: 0,
                    showStock: true
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
                    primaryColor: "#ff007f",
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

    const [pageSearchQuery, setPageSearchQuery] = useState('');

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
                root.style.setProperty('--color-primary', contextSettings.brandSettings.primaryColor || '#b82063');
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
            setPages(data || []);
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

    const cleanupAfterPageDelete = async (page) => {
        const nextNav = removePageFromNavigation(settings.navigationSettings, page.slug);
        const navChanged = nextNav.length !== (settings.navigationSettings?.length || 0);

        await deletePageHeroImage(page.hero_image_url);

        if (navChanged) {
            const updatedSettings = { ...settings, navigationSettings: nextNav };
            setSettings(updatedSettings);
            await updateSettings(updatedSettings);
        }
    };

    const handleBulkDeletePages = async () => {
        if (!selectedPages.length) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedPages.length} pages?`)) return;

        try {
            const pagesToDelete = pages.filter((page) => selectedPages.includes(page.id));
            const persistedIds = pagesToDelete
                .map((page) => page.id)
                .filter((id) => isPersistedPageId(id));

            if (persistedIds.length) {
                const { error } = await supabase.from('pages').delete().in('id', persistedIds);
                if (error) throw error;
            }

            for (const page of pagesToDelete) {
                await deletePageHeroImage(page.hero_image_url);
            }

            const nextNav = pagesToDelete.reduce(
                (nav, page) => removePageFromNavigation(nav, page.slug),
                settings.navigationSettings || []
            );
            const navChanged = nextNav.length !== (settings.navigationSettings?.length || 0);

            if (navChanged) {
                const updatedSettings = { ...settings, navigationSettings: nextNav };
                setSettings(updatedSettings);
                await updateSettings(updatedSettings);
            }

            setPages((prev) => prev.filter((page) => !selectedPages.includes(page.id)));
            setSelectedPages([]);
            notify('Selected pages deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting pages:', error);
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

    const handleDeletePage = async (page) => {
        if (!window.confirm(`Delete "${page.title}"? This removes the page and any navigation links to it.`)) return;

        try {
            if (isPersistedPageId(page.id)) {
                const { error } = await supabase.from('pages').delete().eq('id', page.id);
                if (error) throw error;
            }

            await cleanupAfterPageDelete(page);
            setPages((prev) => prev.filter((p) => p.id !== page.id));
            setSelectedPages((prev) => prev.filter((id) => id !== page.id));
            notify('Page deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting page:', error);
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
                is_published: pageForm.status === 'published',
                meta_title: pageForm.meta_title,
                meta_description: pageForm.meta_description,
                custom_css: pageForm.custom_css,
                updated_at: new Date().toISOString()
            };

            if (editingPageId) {
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
                setPages(prev => [data, ...prev]);
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
        { id: 'general', label: 'General', icon: 'tune' },
        { id: 'homepage', label: 'Homepage', icon: 'web' },
        { id: 'product', label: 'Product Page', icon: 'view_quilt' },
        { id: 'navigation', label: 'Navigation', icon: 'menu' },
        { id: 'payments', label: 'Payments', icon: 'payments' },
        { id: 'pages', label: 'Pages', icon: 'layers' },
        { id: 'login', label: 'Login Page', icon: 'login' },
    ];

    const resolvedProductPageSettings = settings.productPageSettings?.productImages
        ? settings.productPageSettings
        : { ...PRODUCT_PAGE_PRESETS.modern, ...(settings.productPageSettings || {}) };

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
            homepageSettings: mergeHomepageSettings(settings.homepageSettings),
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
                        <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em] drop-shadow-lg">
                            General
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
                            className="admin-button-primary h-12 px-8 rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all border border-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest">
                            {isSaving ? 'Saving...' : 'Save Settings'}
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
                                            ? 'bg-primary/10 text-white border border-primary/30 shadow-[0_0_15px_rgba(255,0,127,0.1)]'
                                            : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
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
                                    {settings.navigationSettings?.filter(item => !['about', 'community'].includes(item.id)).map((item, index) => (
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
                                                        className="admin-checkbox mr-3"
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
                                                className="flex-1 py-3 admin-button-primary rounded-xl text-white text-xs font-black uppercase tracking-widest transition-colors shadow-lg"
                                            >
                                                {editingNavItem ? 'Save Changes' : 'Add Item'}
                                            </button>
                                        </div>
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
                                            placeholder="https://www.nakmaltd.com"
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

                        {activeTab === 'homepage' && (
                            <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">web</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Homepage</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Product listings and SEO</p>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <HomepageListingsSettings settings={settings} setSettings={setSettings} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'product' && (
                            <div className="glossy-panel rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">view_quilt</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Product Page</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Layout, images, typography, and buttons</p>
                                    </div>
                                </div>
                                <div className="relative z-10 min-h-[600px]">
                                    <ProductSettingsPanel
                                        settings={resolvedProductPageSettings}
                                        onChange={(next) => setSettings((prev) => ({ ...prev, productPageSettings: next }))}
                                        onReset={() => setSettings((prev) => ({ ...prev, productPageSettings: PRODUCT_PAGE_PRESETS.modern }))}
                                        onSave={handleSave}
                                        isSaving={isSaving}
                                    />
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
                                            <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(255,0,127,0.2)]"></div>
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
                                                            handleDeletePage(page);
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



                        {activeTab === 'general' && (
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

                        {activeTab === 'general' && (
                            <div className="glossy-panel rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-white/5 bg-black/20 shadow-2xl">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>
                                <div className="flex items-center gap-4 mb-10 relative z-10">
                                    <div className="size-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 shadow-inner">
                                        <span className="material-symbols-outlined text-primary-light text-[24px]">mail</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest text-sm">Signal Dispatch</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Alert Configuration</p>
                                    </div>
                                </div>

                                <div className="relative z-10 max-w-xl">
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
                                </div>
                            </div>
                        )}

                        {activeTab === 'general' && (
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

                        {activeTab === 'general' && (
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

            {/* Modals */}
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
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePageModalTab === tab.id ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,0,127,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
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
                                                    className="admin-checkbox w-5 h-5"
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
                                                <div className="text-[#006621] text-sm">nakma.store/{pageForm.slug || 'url'}</div>
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

            {/* Invite Node Modal */}
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
                                        placeholder="admin@nakmaltd.com"
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
                                    className="w-full h-14 admin-button-primary font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-[0_0_20px_rgba(255,0,127,0.3)] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
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
