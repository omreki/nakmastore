import React, { useState } from 'react';
import { ColorPicker, RangeSlider, ToggleSwitch, FontSelector, SelectInput } from './SettingsControls';

const ProductSettingsPanel = ({ settings, onChange, onReset, onSave, isSaving }) => {
    const [activeTab, setActiveTab] = useState('typography');

    const updateNested = (path, value) => {
        // path is like "typography.productTitle.fontSize"
        const keys = path.split('.');
        const newSettings = JSON.parse(JSON.stringify(settings)); // Deep copy simple way
        let current = newSettings;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        onChange(newSettings);
    };

    const tabs = [
        { id: 'typography', label: 'Typography', icon: 'text_fields' },
        { id: 'layout', label: 'Layout', icon: 'grid_view' },
        { id: 'visual', label: 'Visual', icon: 'palette' },
        { id: 'sections', label: 'Sections', icon: 'view_list' }, // Visibility & Order
        { id: 'advanced', label: 'Advanced', icon: 'settings' }
    ];

    return (
        <div className="bg-[#1a1a1a] border border-white/5 h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                <h2 className="font-bold text-white uppercase tracking-widest text-xs md:text-sm">Product Page Customizer</h2>
                <div className="flex gap-2">
                    <button onClick={onReset} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white transition-colors">Reset</button>
                    <button onClick={onSave} disabled={isSaving} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary-dark text-white transition-colors flex items-center gap-2">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 overflow-x-auto bg-black/20">
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
                {activeTab === 'typography' && (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Product Title</h3>
                            <FontSelector label="Font Family" value={settings.typography?.productTitle?.fontFamily} onChange={(v) => updateNested('typography.productTitle.fontFamily', v)} />
                            <RangeSlider label="Size" value={settings.typography?.productTitle?.fontSize} min={16} max={72} onChange={(v) => updateNested('typography.productTitle.fontSize', v)} />
                            <RangeSlider label="Weight" value={settings.typography?.productTitle?.fontWeight} min={100} max={900} step={100} unit="" onChange={(v) => updateNested('typography.productTitle.fontWeight', v)} />
                            <ColorPicker label="Color" value={settings.typography?.productTitle?.color} onChange={(v) => updateNested('typography.productTitle.color', v)} />
                            <SelectInput label="Transform" value={settings.typography?.productTitle?.textTransform} options={[{ value: 'none', label: 'None' }, { value: 'uppercase', label: 'Uppercase' }, { value: 'capitalize', label: 'Capitalize' }]} onChange={(v) => updateNested('typography.productTitle.textTransform', v)} />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Price</h3>
                            <RangeSlider label="Size" value={settings.typography?.price?.fontSize} min={12} max={48} onChange={(v) => updateNested('typography.price.fontSize', v)} />
                            <ColorPicker label="Color" value={settings.typography?.price?.color} onChange={(v) => updateNested('typography.price.color', v)} />
                            <ColorPicker label="Sale Color" value={settings.typography?.price?.saleColor} onChange={(v) => updateNested('typography.price.saleColor', v)} />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Description</h3>
                            <FontSelector label="Font Family" value={settings.typography?.description?.fontFamily} onChange={(v) => updateNested('typography.description.fontFamily', v)} />
                            <RangeSlider label="Size" value={settings.typography?.description?.fontSize} min={12} max={24} onChange={(v) => updateNested('typography.description.fontSize', v)} />
                            <ColorPicker label="Color" value={settings.typography?.description?.color} onChange={(v) => updateNested('typography.description.color', v)} />
                            <RangeSlider label="Line Height" value={settings.typography?.description?.lineHeight} min={1} max={2.5} step={0.1} unit="" onChange={(v) => updateNested('typography.description.lineHeight', v)} />
                        </div>
                    </div>
                )}

                {activeTab === 'layout' && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Grid & Position</h3>
                            <SelectInput
                                label="Image Position"
                                value={settings.layout?.imagePosition}
                                options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'top', label: 'Top (Stacked)' }]}
                                onChange={(v) => updateNested('layout.imagePosition', v)}
                            />
                            <SelectInput
                                label="Gallery Type"
                                value={settings.layout?.galleryType}
                                options={[{ value: 'grid', label: 'Grid' }, { value: 'carousel', label: 'Carousel (Scroll)' }, { value: 'single', label: 'Single Large' }]}
                                onChange={(v) => updateNested('layout.galleryType', v)}
                            />
                            <SelectInput
                                label="Content Width Ratio"
                                value={settings.layout?.contentRatio}
                                options={[{ value: '50/50', label: 'Equal (50/50)' }, { value: '60/40', label: 'Wide Images (60/40)' }, { value: '40/60', label: 'Wide Details (40/60)' }]}
                                onChange={(v) => updateNested('layout.contentRatio', v)}
                            />
                            <SelectInput
                                label="Spacing"
                                value={settings.layout?.sectionSpacing}
                                options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }]}
                                onChange={(v) => updateNested('layout.sectionSpacing', v)}
                            />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Behavior</h3>
                            <ToggleSwitch label="Sticky Add To Cart Bar" checked={settings.layout?.stickyElements?.addToCart} onChange={(v) => updateNested('layout.stickyElements.addToCart', v)} />
                            <ToggleSwitch label="Sticky Images" checked={settings.layout?.stickyElements?.images} onChange={(v) => updateNested('layout.stickyElements.images', v)} />
                        </div>
                    </div>
                )}

                {activeTab === 'visual' && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Colors</h3>
                            <ColorPicker label="Primary Color (Override brand)" value={settings.visual?.primaryColor} onChange={(v) => updateNested('visual.primaryColor', v)} />
                            <ColorPicker label="Background Color" value={settings.visual?.backgroundColor} onChange={(v) => updateNested('visual.backgroundColor', v)} />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2 pt-2">Buttons</h3>
                            <SelectInput
                                label="Button Style"
                                value={settings.visual?.buttonStyle}
                                options={[{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }, { value: 'ghost', label: 'Ghost' }]}
                                onChange={(v) => updateNested('visual.buttonStyle', v)}
                            />
                            <SelectInput
                                label="Border Radius"
                                value={settings.visual?.borderRadius}
                                options={[{ value: 'sharp', label: 'Sharp (0px)' }, { value: 'subtle', label: 'Subtle (4px)' }, { value: 'rounded', label: 'Rounded (8/16px)' }, { value: 'pill', label: 'Pill (Full)' }]}
                                onChange={(v) => updateNested('visual.borderRadius', v)}
                            />
                            <SelectInput
                                label="Hover Effect"
                                value={settings.visual?.buttonHover}
                                options={[{ value: 'lift', label: 'Lift' }, { value: 'darken', label: 'Darken' }, { value: 'glow', label: 'Glow' }]}
                                onChange={(v) => updateNested('visual.buttonHover', v)}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'sections' && (
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Visibility</h3>
                        <p className="text-[10px] text-gray-500 mb-4">Toggle visibility of elements on the product page.</p>
                        {Object.keys(settings.sections?.visibility || {}).map(key => (
                            <ToggleSwitch
                                key={key}
                                label={key.charAt(0).toUpperCase() + key.slice(1)}
                                checked={settings.sections.visibility[key]}
                                onChange={(v) => updateNested(`sections.visibility.${key}`, v)}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'advanced' && (
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Advanced Options</h3>
                        <ToggleSwitch label="Enable Image Zoom" checked={settings.advanced?.enableZoom} onChange={(v) => updateNested('advanced.enableZoom', v)} />
                        <ToggleSwitch label="Show Trust Badges" checked={settings.advanced?.showTrustBadges} onChange={(v) => updateNested('advanced.showTrustBadges', v)} />
                        <div className="pt-4 space-y-4">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Related Products</h3>
                            <SelectInput
                                label="Related Style"
                                value={settings.advanced?.relatedProducts?.style}
                                options={[{ value: 'grid', label: 'Grid' }, { value: 'hidden', label: 'Hidden' }]}
                                onChange={(v) => updateNested('advanced.relatedProducts.style', v)}
                            />
                            <RangeSlider label="Count" value={settings.advanced?.relatedProducts?.count} min={2} max={8} onChange={(v) => updateNested('advanced.relatedProducts.count', v)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductSettingsPanel;
