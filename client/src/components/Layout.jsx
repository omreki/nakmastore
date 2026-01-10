import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import LoginModal from './LoginModal';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { setIsLoginModalOpen } = useAuth();

    useEffect(() => {
        if (location.state?.openLogin) {
            setIsLoginModalOpen(true);
        }
    }, [location.state, setIsLoginModalOpen]);

    const isStandalonePage = ['/checkout', '/confirmation'].includes(location.pathname);

    return (
        <div className="glossy-bg text-white font-display antialiased selection:bg-primary/40 selection:text-white relative min-h-screen">
            <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-[-10%] left-[-20%] w-[900px] h-[900px] rounded-full bg-[#7a1542]/10 blur-[150px] mix-blend-screen"></div>
                <div className="absolute top-[30%] left-[10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] mix-blend-overlay"></div>
            </div>

            {!isStandalonePage && <Navbar />}
            <CartDrawer />
            <LoginModal />
            <main className={`flex flex-col w-full overflow-hidden ${isStandalonePage ? '' : 'pt-8'} min-h-[calc(100vh-theme('spacing.16')-theme('spacing.20'))]`}> {/* Adjust min-height as needed */}
                {children}
            </main>
            {!isStandalonePage && <Footer />}
        </div>
    );
};

export default Layout;
