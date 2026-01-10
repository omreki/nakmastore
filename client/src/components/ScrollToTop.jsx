import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll the window for public pages
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });

        // Scroll the admin container if it exists
        const adminContainer = document.getElementById('admin-scroll-container');
        if (adminContainer) {
            adminContainer.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant'
            });
        }
    }, [pathname]);

    return null;
};

export default ScrollToTop;
