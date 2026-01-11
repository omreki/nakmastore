import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        };

        getSession();

        // Listen for changes on auth state (signed in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Profile doesn't exist yet - Create it automatically
                    console.log('Profile missing. Creating for user:', userId);
                    const { data: { user: currentUser } } = await supabase.auth.getUser();

                    if (currentUser) {
                        const { data: newProfile, error: createError } = await supabase
                            .from('profiles')
                            .upsert([
                                {
                                    id: userId,
                                    email: currentUser.email,
                                    full_name: currentUser.user_metadata?.full_name || 'User',
                                    role: 'user'
                                }
                            ])
                            .select()
                            .single();

                        if (createError) {
                            console.error('Failed to auto-create profile:', createError);
                        } else {
                            setProfile(newProfile);
                        }
                    }
                } else {
                    console.error('Error fetching profile:', error);
                }
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                // Disable email confirmation to prevent cart abandonment
                emailRedirectTo: `${window.location.origin}/account`
            }
        });

        if (error) throw error;

        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert([
                    {
                        id: data.user.id,
                        full_name: fullName,
                        email: email,
                        role: 'user'
                    }
                ]);
            if (profileError) console.error('Error creating profile:', profileError);
        }

        return data;
    };

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };


    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Check admin access from both profiles and team_members tables
    useEffect(() => {
        const checkAdminAccess = async () => {
            if (!user?.email) {
                setIsAdmin(false);
                return;
            }

            // Check if user is in admin emails list
            const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
            if (adminEmails.includes(user.email.toLowerCase())) {
                setIsAdmin(true);
                return;
            }

            // Check if user has admin role in profiles
            if (profile?.role === 'admin') {
                setIsAdmin(true);
                return;
            }

            // Check if user is a team member with admin, editor, or shop_manager role
            try {
                const { data: teamMembers, error } = await supabase
                    .from('team_members')
                    .select('role')
                    .eq('email', user.email)
                    .in('role', ['admin', 'editor', 'shop_manager']);

                if (!error && teamMembers && teamMembers.length > 0) {
                    setIsAdmin(true);
                    return;
                }

                setIsAdmin(false);
            } catch (error) {
                console.error('Error checking team member access:', error);
                setIsAdmin(false);
            }
        };

        checkAdminAccess();
    }, [user, profile]);

    const value = {
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        isAdmin,
        isLoginModalOpen,
        setIsLoginModalOpen,
        refreshProfile: () => user?.id && fetchProfile(user.id)
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
