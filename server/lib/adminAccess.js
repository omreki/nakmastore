const { createClient } = require('@supabase/supabase-js');

const ADMIN_ROLES = ['admin', 'editor', 'shop_manager'];

const getSupabaseConfig = () => ({
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
});

async function checkAdminAccess(token) {
    if (!token) return false;

    const { url, key } = getSupabaseConfig();
    if (!url || !key) return false;

    const supabase = createClient(url, key, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user?.email) {
        return false;
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

    if (adminEmails.includes(user.email.toLowerCase())) {
        return true;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    if (profile?.role === 'admin') {
        return true;
    }

    const { data: teamMembers } = await supabase
        .from('team_members')
        .select('role')
        .eq('email', user.email)
        .in('role', ADMIN_ROLES);

    return !!(teamMembers && teamMembers.length > 0);
}

module.exports = { checkAdminAccess };
