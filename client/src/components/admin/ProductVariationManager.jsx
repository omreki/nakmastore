import React, { useState, useEffect } from 'react';

const ProductVariationManager = ({ colors, sizes, variations, onChange, basePrice }) => {
    const [localVariations, setLocalVariations] = useState(variations || []);

    // Generate variations based on colors and sizes if none exist
    const generateVariations = () => {
        const newVariations = [];
        colors.forEach(color => {
            sizes.forEach(size => {
                const name = `${color.name} / ${size}`;
                const existing = localVariations.find(v => v.color === color.name && v.size === size);

                newVariations.push(existing || {
                    name,
                    color: color.name,
                    size,
                    sku: '',
                    price: basePrice || 0,
                    stock: 0
                });
            });
        });
        setLocalVariations(newVariations);
        onChange(newVariations);
    };

    useEffect(() => {
        if (localVariations.length === 0 && (colors.length > 0 || sizes.length > 0)) {
            generateVariations();
        }
    }, [colors, sizes]);

    const handleVariationChange = (index, field, value) => {
        const updated = [...localVariations];
        updated[index] = { ...updated[index], [field]: value };
        setLocalVariations(updated);
        onChange(updated);
    };

    const removeVariation = (index) => {
        const updated = localVariations.filter((_, i) => i !== index);
        setLocalVariations(updated);
        onChange(updated);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1">Variation Matrix</label>
                <button
                    type="button"
                    onClick={generateVariations}
                    className="text-[9px] font-black text-primary-light hover:text-white uppercase tracking-widest border border-primary/20 hover:border-primary px-3 py-1.5 rounded-lg transition-all"
                >
                    Regenerate Grid
                </button>
            </div>

            {localVariations.length === 0 ? (
                <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center">
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Select colors and sizes to generate variations</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                <th className="px-4 pb-2">Variation</th>
                                <th className="px-4 pb-2">SKU</th>
                                <th className="px-4 pb-2">Price ($)</th>
                                <th className="px-4 pb-2">Stock</th>
                                <th className="px-4 pb-2"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {localVariations.map((v, idx) => (
                                <tr key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl group hover:bg-white/[0.05] transition-all">
                                    <td className="px-4 py-3 rounded-l-xl">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white">{v.name}</span>
                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{v.color} • {v.size}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={v.sku || ''}
                                            onChange={(e) => handleVariationChange(idx, 'sku', e.target.value)}
                                            placeholder="SKU-XXX"
                                            className="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/40 w-full"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={v.price || ''}
                                            onChange={(e) => handleVariationChange(idx, 'price', e.target.value)}
                                            className="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/40 w-32 font-mono"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={v.stock || 0}
                                            onChange={(e) => handleVariationChange(idx, 'stock', e.target.value)}
                                            className="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary/40 w-24 font-mono"
                                        />
                                    </td>
                                    <td className="px-4 py-3 rounded-r-xl text-right">
                                        <button
                                            type="button"
                                            onClick={() => removeVariation(idx)}
                                            className="text-gray-500 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProductVariationManager;
