import React, { useState, useEffect } from 'react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import ProductDetailView from '../../components/ProductDetailView';
import ProductSettingsPanel from '../../components/admin/settings/ProductSettingsPanel';
import { PRODUCT_PAGE_PRESETS } from '../../utils/productPresets';
import AdminLayout from '../../components/admin/AdminLayout';

const DUMMY_PRODUCT = {
    id: 'preview-1',
    name: 'Essence of Heritage',
    description: 'A masterpiece of contemporary African design. Crafted from sustainable cotton with intricate patterned details representing strength and unity. Designed for the modern leader who values both tradition and innovation.',
    price: 125,
    sale_price: 95,
    is_sale: true,
    is_new: true,
    stock: 12,
    category: 'Shirts',
    images: [
        'https://images.unsplash.com/photo-1543965860-8dd4a9d45345?q=80&w=2600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=2576&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=2626&auto=format&fit=crop'
    ],
    colors: [
        { name: 'Onyx Black', hex: '#000000' },
        { name: 'Ruby Red', hex: '#b82063' },
        { name: 'Ivory', hex: '#f0f0f0' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
};

const ProductSettingsPage = () => {
    const { settings, updateSettings } = useStoreSettings();
    const [localSettings, setLocalSettings] = useState(settings.productPageSettings || PRODUCT_PAGE_PRESETS.modern);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState('desktop');

    useEffect(() => {
        if (settings.productPageSettings) {
            // Only update from context if we haven't touched anything? 
            // Or just initialize. For now, prefer local state creates a "draft" mode.
            // We won't auto-update from settings if we are editing, to avoid jumps.
            // But we need initial load.
        }
    }, [settings.productPageSettings]);

    // Initialize once
    useEffect(() => {
        if (settings.productPageSettings && !localSettings.theme) {
            setLocalSettings(settings.productPageSettings);
        }
    }, [settings.productPageSettings, localSettings.theme]);

    const handleSave = async () => {
        setIsSaving(true);
        await updateSettings({ ...settings, productPageSettings: localSettings });
        setIsSaving(false);
    };

    const applyPreset = (presetName) => {
        const preset = PRODUCT_PAGE_PRESETS[presetName];
        if (preset) {
            setLocalSettings(prev => ({
                ...prev,
                ...preset,
            }));
        }
    };

    return (
        <AdminLayout fullWidth={true}>
            <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-black text-white">
                {/* Sidebar Controls */}
                <div className="w-full lg:w-[420px] shrink-0 p-4 border-b lg:border-b-0 lg:border-r border-white/5 bg-black h-[40%] lg:h-full flex flex-col gap-4">
                    <div className="p-4 bg-[#1a1a1a] rounded-xl border border-white/5">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] block mb-3">Theme Presets</label>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.keys(PRODUCT_PAGE_PRESETS).map(key => (
                                <button
                                    key={key}
                                    onClick={() => applyPreset(key)}
                                    className={`px-2 py-3 text-[10px] font-black uppercase tracking-wider border rounded-xl transition-all ${localSettings.theme === key ? 'bg-white text-black border-white shadow-lg scale-105' : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'}`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>

                    <ProductSettingsPanel
                        settings={localSettings}
                        onChange={setLocalSettings}
                        onSave={handleSave}
                        isSaving={isSaving}
                        onReset={() => setLocalSettings(PRODUCT_PAGE_PRESETS.modern)}
                    />
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-[#111] flex flex-col relative max-w-full">
                    <div className="absolute top-6 right-6 z-20 flex gap-2 bg-black/80 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-2xl">
                        <button onClick={() => setPreviewMode('desktop')} className={`size-10 flex items-center justify-center rounded-full transition-all ${previewMode === 'desktop' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
                            <span className="material-symbols-outlined text-[20px]">desktop_mac</span>
                        </button>
                        <button onClick={() => setPreviewMode('mobile')} className={`size-10 flex items-center justify-center rounded-full transition-all ${previewMode === 'mobile' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
                            <span className="material-symbols-outlined text-[20px]">smartphone</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden bg-[#111] flex items-center justify-center p-4 md:p-8 relative">
                        {/* Grid Pattern Background for Preview Area */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                        <div className={`transition-all duration-500 bg-black shadow-2xl border border-white/10 overflow-hidden flex flex-col ${previewMode === 'mobile' ? 'w-[375px] h-[750px] rounded-[40px] border-[8px] border-[#222]' : 'w-full h-full rounded-2xl max-w-6xl'}`}>
                            {/* Fake Browser Header for Desktop */}
                            {previewMode === 'desktop' && (
                                <div className="h-8 bg-[#1a1a1a] border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                                    <div className="size-3 rounded-full bg-red-500/20"></div>
                                    <div className="size-3 rounded-full bg-yellow-500/20"></div>
                                    <div className="size-3 rounded-full bg-green-500/20"></div>
                                    <div className="ml-4 h-5 w-64 bg-black/50 rounded flex items-center px-3 text-[10px] text-gray-600 font-mono">nakmastore.com/product/essence</div>
                                </div>
                            )}

                            <div className={`flex-1 w-full overflow-y-auto custom-scrollbar relative bg-black ${previewMode === 'mobile' ? 'pt-8' : ''}`}>
                                <ProductDetailView
                                    product={DUMMY_PRODUCT}
                                    settingsOverride={localSettings}
                                    isPreview={true}
                                    showNavigation={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ProductSettingsPage;
