import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, profile, loading, isAdmin } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
                <div className="size-16 border-4 border-[#a14550]/20 border-t-[#a14550] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" state={{ from: location, openLogin: true }} replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
