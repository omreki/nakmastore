import { supabase } from '../lib/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isPersistedPageId = (id) => Boolean(id && UUID_REGEX.test(id));

export const removePageFromNavigation = (navigationSettings = [], slug) => {
    const pagePath = `/${slug}`;
    return navigationSettings.filter(
        (item) => item.path !== pagePath && item.path !== slug && item.id !== slug
    );
};

export const deletePageHeroImage = async (heroImageUrl) => {
    if (!heroImageUrl || !heroImageUrl.includes('product-images')) return;

    const parts = heroImageUrl.split('/');
    const fileName = decodeURIComponent(parts[parts.length - 1].split('?')[0]);
    if (!fileName) return;

    const { error } = await supabase.storage.from('product-images').remove([fileName]);
    if (error) {
        console.error('Error deleting page hero image:', error);
    }
};
