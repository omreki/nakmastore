import React, { useState, useEffect } from 'react';

const TaxForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        region: '',
        rate: '',
        compound: false,
        status: 'active'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                region: initialData.region || '',
                rate: initialData.rate || '',
                compound: initialData.compound || false,
                status: initialData.status || (initialData.active ? 'active' : 'inactive')
            });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            rate: parseFloat(formData.rate),
            active: formData.status === 'active'
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2">Jurisdiction Region / Zone</label>
                <input
                    required
                    placeholder="e.g. North America (Standard)"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-[#a14550] transition-all text-white placeholder:text-white/20"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2">Tax Rate (%)</label>
                    <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.rate}
                        onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-[#a14550] transition-all text-white placeholder:text-white/20"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2">Compound Tax</label>
                    <div className="h-12 flex items-center px-4 bg-white/5 border border-white/10 rounded-xl">
                        <label className="flex items-center gap-3 cursor-pointer w-full">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={formData.compound}
                                    onChange={(e) => setFormData({ ...formData, compound: e.target.checked })}
                                    className="sr-only"
                                />
                                <div className={`w-8 h-4 rounded-full transition-colors duration-300 ${formData.compound ? 'bg-primary' : 'bg-gray-600'}`}></div>
                                <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-all duration-300 ${formData.compound ? 'left-4.5' : 'left-0.5'}`}></div>
                            </div>
                            <span className="text-sm font-bold text-white">Compound Rate</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 h-12 rounded-xl border border-white/10 hover:bg-white/5 text-white font-bold uppercase tracking-widest text-xs transition-all"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-light text-white font-bold uppercase tracking-widest text-xs transition-all shadow-xl"
                >
                    Save Jurisdiction
                </button>
            </div>
        </form>
    );
};

export default TaxForm;
