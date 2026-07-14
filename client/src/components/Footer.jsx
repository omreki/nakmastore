import React from 'react';
import { Link } from 'react-router-dom';
import { useStoreSettings } from '../context/StoreSettingsContext';

const Footer = () => {
    const { settings, loading } = useStoreSettings();

    return (
        <footer className="bg-black text-white py-12 border-t border-white/5">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 flex justify-center items-center">
                <p className="text-sm text-white/30 font-medium text-center">
                    © {new Date().getFullYear()} {settings.storeName || 'Nakma Ltd'}. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
