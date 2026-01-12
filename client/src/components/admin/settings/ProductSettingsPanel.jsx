import React, { useState } from 'react';
import { ColorPicker, RangeSlider, ToggleSwitch, FontSelector, SelectInput } from './SettingsControls';

const ProductSettingsPanel = ({ settings, onChange, onReset, onSave, isSaving }) => {
    const [activeTab, setActiveTab] = useState('layout');

    const updateNested = (path, value) => {
        const keys = path.split('.');
        if (keys.length === 0) return;

        const newSettings = JSON.parse(JSON.stringify(settings));
        let current = newSettings;

        for (let i = 0; i < keys.length - 1; i++) {
            if (current[keys[i]] === undefined) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        onChange(newSettings);
    };

    const tabs = [
        { id: 'layout', label: 'Layout', icon: 'grid_view' },
        { id: 'images', label: 'Images', icon: 'image' },
        { id: 'typography', label: 'Type', icon: 'text_fields' },
        { id: 'button', label: 'Button', icon: 'smart_button' },
        { id: 'mobile', label: 'Mobile', icon: 'smartphone' },
        { id: 'advanced', label: 'Adv.', icon: 'tune' }
    ];

    return (
        <div className="bg-[#1a1a1a] border border-white/5 h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40 shrink-0">
                <h2 className="font-bold text-white uppercase tracking-widest text-xs md:text-sm">Product Page</h2>
                <div className="flex gap-2">
                    <button onClick={onReset} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white transition-colors">Reset</button>
                    <button onClick={onSave} disabled={isSaving} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary-dark text-white transition-colors flex items-center gap-2">
                        {isSaving ? '...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 overflow-x-auto bg-black/20 shrink-0 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                {/* === LAYOUT TAB === */}
                {activeTab === 'layout' && (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="section-header">Structure</h3>
                            <SelectInput
                                label="Page Layout Style"
                                value={settings.layout?.style || 'classic'}
                                options={[
                                    { value: 'classic', label: 'Classic (Side by Side)' },
                                    { value: 'narrow', label: 'Narrow Vertical (Centered)' },
                                    { value: 'full', label: 'Full Width Header' },
                                    { value: 'magazine', label: 'Magazine / Editorial' }
                                ]}
                                onChange={(v) => updateNested('layout.style', v)}
                            />
                            <SelectInput
                                label="Content Ratio (Desktop)"
                                value={settings.layout?.contentRatio || '50/50'}
                                options={[
                                    { value: '50/50', label: 'Equal (50/50)' },
                                    { value: '60/40', label: 'Focus Image (60/40)' },
                                    { value: '40/60', label: 'Focus Info (40/60)' }
                                ]}
                                onChange={(v) => updateNested('layout.contentRatio', v)}
                            />
                            <SelectInput
                                label="Vertical Spacing"
                                value={settings.layout?.sectionSpacing}
                                options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }]}
                                onChange={(v) => updateNested('layout.sectionSpacing', v)}
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="section-header">Behaviors</h3>
                            <ToggleSwitch label="Sticky Info Panel" checked={settings.layout?.stickyElements?.info} onChange={(v) => updateNested('layout.stickyElements.info', v)} />
                            <ToggleSwitch label="Sticky Images" checked={settings.layout?.stickyElements?.images} onChange={(v) => updateNested('layout.stickyElements.images', v)} />
                            <ToggleSwitch label="Show Stock Info" checked={settings.showStock !== false} onChange={(v) => updateNested('showStock', v)} />
                        </div>
                    </div>
                )}

                {/* === IMAGES TAB === */}
                {activeTab === 'images' && (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="section-header">Featured Image</h3>
                            <SelectInput
                                label="Object Fit"
                                value={settings.productImages?.fit}
                                options={[
                                    { value: 'cover', label: 'Cover (Fill Area)' },
                                    { value: 'contain', label: 'Contain (Show Whole)' },
                                    { value: 'fill', label: 'Stretch to Fill' }
                                ]}
                                onChange={(v) => updateNested('productImages.fit', v)}
                            />
                            <SelectInput
                                label="Aspect Ratio"
                                value={settings.productImages?.aspectRatio}
                                options={[
                                    { value: '1:1', label: 'Square (1:1)' },
                                    { value: '3:4', label: 'Portrait (3:4)' },
                                    { value: '4:3', label: 'Landscape (4:3)' },
                                    { value: '16:9', label: 'Cinematic (16:9)' }
                                ]}
                                onChange={(v) => updateNested('productImages.aspectRatio', v)}
                            />
                            <RangeSlider label="Desktop Width (%)" value={settings.productImages?.desktopWidth} min={30} max={100} onChange={(v) => updateNested('productImages.desktopWidth', v)} />
                            {settings.productImages?.fit === 'contain' && (
                                <ColorPicker label="Background Color" value={settings.productImages?.backgroundColor} onChange={(v) => updateNested('productImages.backgroundColor', v)} />
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="section-header">Gallery</h3>
                            <SelectInput
                                label="Gallery Layout"
                                value={settings.productImages?.galleryLayout}
                                options={[
                                    { value: 'grid', label: 'Grid Below' },
                                    { value: 'scroll', label: 'Horizontal Scroll' },
                                    { value: 'thumbnails', label: 'Thumbnails Only' }
                                ]}
                                onChange={(v) => updateNested('productImages.galleryLayout', v)}
                            />
                            {settings.productImages?.galleryLayout !== 'scroll' && (
                                <RangeSlider label="Grid Columns" value={settings.productImages?.galleryColumns} min={2} max={6} onChange={(v) => updateNested('productImages.galleryColumns', v)} />
                            )}
                            <RangeSlider label="Spacing (Gap)" value={settings.productImages?.galleryGap} min={0} max={40} onChange={(v) => updateNested('productImages.galleryGap', v)} />
                            <RangeSlider label="Thumbnail Size" value={settings.productImages?.thumbnailSize} min={60} max={200} onChange={(v) => updateNested('productImages.thumbnailSize', v)} />
                        </div>
                    </div>
                )}

                {/* === TYPOGRAPHY TAB === */}
                {activeTab === 'typography' && (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="section-header">Product Title</h3>
                            <FontSelector label="Font Family" value={settings.typography?.productTitle?.fontFamily} onChange={(v) => updateNested('typography.productTitle.fontFamily', v)} />
                            <RangeSlider label="Size" value={settings.typography?.productTitle?.fontSize} min={16} max={96} onChange={(v) => updateNested('typography.productTitle.fontSize', v)} />
                            <RangeSlider label="Weight" value={settings.typography?.productTitle?.fontWeight} min={100} max={900} step={100} unit="" onChange={(v) => updateNested('typography.productTitle.fontWeight', v)} />
                            <ColorPicker label="Color" value={settings.typography?.productTitle?.color} onChange={(v) => updateNested('typography.productTitle.color', v)} />
                            <SelectInput label="Transform" value={settings.typography?.productTitle?.textTransform} options={[{ value: 'none', label: 'None' }, { value: 'uppercase', label: 'Uppercase' }, { value: 'capitalize', label: 'Capitalize' }]} onChange={(v) => updateNested('typography.productTitle.textTransform', v)} />
                        </div>

                        <div className="space-y-4">
                            <h3 className="section-header">Description</h3>
                            <FontSelector label="Font Family" value={settings.typography?.description?.fontFamily} onChange={(v) => updateNested('typography.description.fontFamily', v)} />
                            <RangeSlider label="Size" value={settings.typography?.description?.fontSize} min={12} max={24} onChange={(v) => updateNested('typography.description.fontSize', v)} />
                            <ColorPicker label="Color" value={settings.typography?.description?.color} onChange={(v) => updateNested('typography.description.color', v)} />
                        </div>
                    </div>
                )}

                {/* === BUTTON TAB === */}
                {activeTab === 'button' && (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="section-header">Positions</h3>
                            <SelectInput
                                label="Position In Layout"
                                value={settings.addToCart?.verticalPosition}
                                options={[
                                    { value: 'after-price', label: 'Immediately after Price' },
                                    { value: 'after-variants', label: 'After Variants/Options' },
                                    { value: 'after-description', label: 'After Description' }
                                ]}
                                onChange={(v) => updateNested('addToCart.verticalPosition', v)}
                            />
                            <SelectInput
                                label="Alignment"
                                value={settings.addToCart?.alignment}
                                options={[
                                    { value: 'left', label: 'Left' },
                                    { value: 'center', label: 'Center' },
                                    { value: 'right', label: 'Right' },
                                    { value: 'stretch', label: 'Stretch (Full)' }
                                ]}
                                onChange={(v) => updateNested('addToCart.alignment', v)}
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="section-header">Styling</h3>
                            <SelectInput
                                label="Width"
                                value={settings.addToCart?.width}
                                options={[{ value: '100%', label: '100%' }, { value: 'auto', label: 'Auto (Text Width)' }, { value: '200', label: 'Fixed 200px' }]}
                                onChange={(v) => updateNested('addToCart.width', v)}
                            />
                            <RangeSlider label="Height" value={settings.addToCart?.height} min={32} max={80} onChange={(v) => updateNested('addToCart.height', v)} />
                            <RangeSlider label="Border Radius" value={settings.addToCart?.borderRadius} min={0} max={40} onChange={(v) => updateNested('addToCart.borderRadius', v)} />

                            <div className="grid grid-cols-2 gap-4">
                                <ColorPicker label="Background" value={settings.addToCart?.styling?.background} onChange={(v) => updateNested('addToCart.styling.background', v)} />
                                <ColorPicker label="Text Color" value={settings.addToCart?.styling?.text} onChange={(v) => updateNested('addToCart.styling.text', v)} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="section-header">Content</h3>
                            <ToggleSwitch label="Show Icon" checked={settings.addToCart?.showIcon} onChange={(v) => updateNested('addToCart.showIcon', v)} />
                            {settings.addToCart?.showIcon && (
                                <SelectInput
                                    label="Icon Position"
                                    value={settings.addToCart?.iconPosition}
                                    options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]}
                                    onChange={(v) => updateNested('addToCart.iconPosition', v)}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* === MOBILE TAB === */}
                {activeTab === 'mobile' && (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="section-header">Mobile Overrides</h3>
                            <ToggleSwitch label="Separate Mobile Settings" checked={settings.mobile?.separateSettings} onChange={(v) => updateNested('mobile.separateSettings', v)} />

                            {settings.mobile?.separateSettings && (
                                <>
                                    <SelectInput
                                        label="Gallery Layout (Mobile)"
                                        value={settings.mobile?.layout}
                                        options={[
                                            { value: 'scroll', label: 'Horizontal Swipe' },
                                            { value: 'grid', label: 'Grid' },
                                            { value: 'stack', label: 'Stacked Vertical' }
                                        ]}
                                        onChange={(v) => updateNested('mobile.layout', v)}
                                    />
                                    <ToggleSwitch label="Sticky Add Button" checked={settings.mobile?.stickyButton} onChange={(v) => updateNested('mobile.stickyButton', v)} />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* === ADVANCED TAB === */}
                {activeTab === 'advanced' && (
                    <div className="space-y-4">
                        <h3 className="section-header">Features</h3>
                        <ToggleSwitch label="Enable Accordion" checked={settings.advanced?.accordionMode} onChange={(v) => updateNested('advanced.accordionMode', v)} />

                        <ToggleSwitch label="Show Trust Badges" checked={settings.advanced?.showTrustBadges} onChange={(v) => updateNested('advanced.showTrustBadges', v)} />
                        <ToggleSwitch label="Enable Image Zoom" checked={settings.productImages?.zoom} onChange={(v) => updateNested('productImages.zoom', v)} />
                    </div>
                )}
            </div>

            <style>{`
                 .section-header {
                     font-size: 10px;
                     font-weight: 900;
                     color: rgba(255,255,255,0.4);
                     text-transform: uppercase;
                     letter-spacing: 0.2em;
                     border-bottom: 1px solid rgba(255,255,255,0.05);
                     padding-bottom: 8px;
                 }
             `}</style>
        </div>
    );
};

export default ProductSettingsPanel;
