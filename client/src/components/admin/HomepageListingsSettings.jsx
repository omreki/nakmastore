import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
    createHomepageSection,
    normalizeHomepageSections,
    PRODUCT_SOURCES,
} from '../../constants/homepageDefaults';

const getSectionLabel = (section, index) => {
    const title = section.title?.trim();
    return title || `Section ${index + 1}`;
};

const ListingSectionForm = ({
    section,
    index,
    categories,
    canRemove,
    isExpanded,
    isDragging,
    isDropTarget,
    onToggle,
    onUpdate,
    onRemove,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}) => {
    const columnsPerRow = Number(section.columnsPerRow) || 6;
    const rows = Number(section.rows) || 1;
    const showCategoryPicker = section.productSource === 'category';

    return (
        <div
            className={`rounded-2xl bg-white/5 border transition-all duration-200 ${
                isDragging ? 'opacity-40 scale-[0.98]' : ''
            } ${isDropTarget ? 'border-primary/50 shadow-[0_0_20px_rgba(255,0,127,0.15)]' : 'border-white/5'}`}
            onDragOver={(e) => onDragOver(e, section.id)}
            onDrop={(e) => onDrop(e, section.id)}
        >
            <div className="flex items-center gap-2 p-4 border-b border-white/5">
                <button
                    type="button"
                    draggable
                    onDragStart={(e) => onDragStart(e, section.id)}
                    onDragEnd={onDragEnd}
                    className="flex items-center justify-center size-9 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 cursor-grab active:cursor-grabbing transition-colors shrink-0"
                    aria-label={`Drag ${getSectionLabel(section, index)}`}
                >
                    <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
                </button>

                <button
                    type="button"
                    onClick={onToggle}
                    className="flex-1 flex items-center justify-between gap-3 min-w-0 text-left group"
                >
                    <div className="min-w-0">
                        <p className="text-white text-xs font-bold uppercase tracking-widest text-primary truncate group-hover:text-primary-light transition-colors">
                            {getSectionLabel(section, index)}
                        </p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                            Position {index + 1} · {columnsPerRow * rows} products
                        </p>
                    </div>
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-white transition-colors shrink-0">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                </button>

                {canRemove && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors px-2 shrink-0"
                    >
                        Remove
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="space-y-4 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2.5 md:col-span-2">
                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Section Title</label>
                            <input
                                type="text"
                                value={section.title ?? ''}
                                onChange={(e) => onUpdate(section.id, 'title', e.target.value)}
                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                placeholder="Section title"
                            />
                        </div>
                        <div className="flex flex-col gap-2.5 md:col-span-2">
                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Section Subtitle</label>
                            <input
                                type="text"
                                value={section.subtitle ?? ''}
                                onChange={(e) => onUpdate(section.id, 'subtitle', e.target.value)}
                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                placeholder="Section subtitle"
                            />
                        </div>
                        <div className="flex flex-col gap-2.5 md:col-span-2">
                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Product Source</label>
                            <select
                                value={section.productSource || 'all'}
                                onChange={(e) => onUpdate(section.id, 'productSource', e.target.value)}
                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                            >
                                {PRODUCT_SOURCES.map((source) => (
                                    <option key={source.value} value={source.value} className="bg-secondary text-white">
                                        {source.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {showCategoryPicker && (
                            <div className="flex flex-col gap-2.5 md:col-span-2">
                                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Category</label>
                                <select
                                    value={section.categoryId ?? ''}
                                    onChange={(e) => onUpdate(section.id, 'categoryId', e.target.value || null)}
                                    className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                                >
                                    <option value="" className="bg-secondary text-white">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id} className="bg-secondary text-white">
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex flex-col gap-2.5">
                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Products Per Row</label>
                            <select
                                value={columnsPerRow}
                                onChange={(e) => onUpdate(section.id, 'columnsPerRow', parseInt(e.target.value, 10))}
                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                            >
                                {[2, 3, 4, 5, 6].map((count) => (
                                    <option key={count} value={count} className="bg-secondary text-white">{count} columns</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Rows To Show</label>
                            <select
                                value={rows}
                                onChange={(e) => onUpdate(section.id, 'rows', parseInt(e.target.value, 10))}
                                className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                            >
                                {[1, 2, 3, 4, 5, 6].map((count) => (
                                    <option key={count} value={count} className="bg-secondary text-white">{count} row{count > 1 ? 's' : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2 rounded-xl bg-black/30 border border-white/5 px-4 py-3">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Initial products shown</p>
                            <p className="text-white text-sm font-black mt-1">{columnsPerRow * rows} products ({columnsPerRow} per row × {rows} row{rows > 1 ? 's' : ''})</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const HomepageListingsSettings = ({ settings, setSettings }) => {
    const [categories, setCategories] = useState([]);
    const [draggedId, setDraggedId] = useState(null);
    const [dropTargetId, setDropTargetId] = useState(null);
    const sections = normalizeHomepageSections(settings.homepageSettings);
    const [expandedIds, setExpandedIds] = useState(() => new Set());

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from('categories')
                .select('id, name, slug')
                .order('name', { ascending: true });

            setCategories(data || []);
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        setExpandedIds((prev) => {
            const sectionIds = new Set(sections.map((section) => section.id));
            const next = new Set([...prev].filter((id) => sectionIds.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [sections]);

    const updateSections = (nextSections) => {
        setSettings((prev) => ({
            ...prev,
            homepageSettings: {
                ...prev.homepageSettings,
                sections: nextSections,
            },
        }));
    };

    const updateSection = (sectionId, field, value) => {
        const nextSections = sections.map((section) => {
            if (section.id !== sectionId) return section;

            const updated = { ...section, [field]: value };
            if (field === 'productSource' && value !== 'category') {
                updated.categoryId = null;
            }

            return updated;
        });

        updateSections(nextSections);
    };

    const addSection = () => {
        const newSection = createHomepageSection();
        updateSections([...sections, newSection]);
    };

    const removeSection = (sectionId) => {
        if (sections.length <= 1) return;
        updateSections(sections.filter((section) => section.id !== sectionId));
    };

    const toggleSection = (sectionId) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    };

    const handleDragStart = (e, sectionId) => {
        setDraggedId(sectionId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', sectionId);
    };

    const handleDragOver = (e, sectionId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (sectionId !== draggedId) setDropTargetId(sectionId);
    };

    const handleDrop = (e, targetId) => {
        e.preventDefault();
        const sourceId = draggedId || e.dataTransfer.getData('text/plain');
        setDraggedId(null);
        setDropTargetId(null);

        if (!sourceId || sourceId === targetId) return;

        const sourceIndex = sections.findIndex((section) => section.id === sourceId);
        const targetIndex = sections.findIndex((section) => section.id === targetId);
        if (sourceIndex < 0 || targetIndex < 0) return;

        const nextSections = [...sections];
        const [moved] = nextSections.splice(sourceIndex, 1);
        nextSections.splice(targetIndex, 0, moved);
        updateSections(nextSections);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDropTargetId(null);
    };

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
                    <div>
                        <h4 className="text-white text-sm font-bold">Product Listing Sections</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                            Drag to reorder · click to expand or collapse
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={addSection}
                        className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-colors shrink-0"
                    >
                        Add Section
                    </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {sections.map((section, index) => (
                        <ListingSectionForm
                            key={section.id}
                            section={section}
                            index={index}
                            categories={categories}
                            canRemove={sections.length > 1}
                            isExpanded={expandedIds.has(section.id)}
                            isDragging={draggedId === section.id}
                            isDropTarget={dropTargetId === section.id}
                            onToggle={() => toggleSection(section.id)}
                            onUpdate={updateSection}
                            onRemove={() => removeSection(section.id)}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <h4 className="text-white text-sm font-bold border-b border-white/10 pb-2">Search Engine Optimization (SEO)</h4>
                <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col gap-2.5">
                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Meta Title</label>
                        <input
                            type="text"
                            value={settings.homepageSettings?.seo?.metaTitle || ''}
                            onChange={(e) => setSettings({
                                ...settings,
                                homepageSettings: {
                                    ...settings.homepageSettings,
                                    seo: { ...settings.homepageSettings?.seo, metaTitle: e.target.value },
                                },
                            })}
                            className="w-full h-12 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                            placeholder="Homepage SEO Title"
                        />
                    </div>
                    <div className="flex flex-col gap-2.5">
                        <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Meta Description</label>
                        <textarea
                            value={settings.homepageSettings?.seo?.metaDescription || ''}
                            onChange={(e) => setSettings({
                                ...settings,
                                homepageSettings: {
                                    ...settings.homepageSettings,
                                    seo: { ...settings.homepageSettings?.seo, metaDescription: e.target.value },
                                },
                            })}
                            className="w-full h-24 pt-3 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm font-bold focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                            placeholder="Homepage SEO Description..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomepageListingsSettings;
