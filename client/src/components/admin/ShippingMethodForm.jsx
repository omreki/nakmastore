import React, { useState } from 'react';

const ShippingMethodForm = ({ initialData = {}, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        description: initialData.description || '',
        deliveryTime: initialData.deliveryTime || '',
        cost: initialData.cost || 0
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">Method Name</label>
                <input
                    type="text"
                    className="glossy-input w-full rounded-2xl bg-black/40 border border-white/5 text-white font-bold h-12 px-4 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                    placeholder="e.g., Standard Ground"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">Description</label>
                <input
                    type="text"
                    className="glossy-input w-full rounded-2xl bg-black/40 border border-white/5 text-white font-bold h-12 px-4 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                    placeholder="e.g., Primary Distribution"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">Delivery Time</label>
                <input
                    type="text"
                    className="glossy-input w-full rounded-2xl bg-black/40 border border-white/5 text-white font-bold h-12 px-4 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                    placeholder="e.g., 5-7 CYCLES"
                    value={formData.deliveryTime}
                    onChange={(e) => handleChange('deliveryTime', e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="text-gray-500 text-[10px] font-black tracking-[0.2em] uppercase ml-1 block mb-2">Cost</label>
                <input
                    type="number"
                    step="0.01"
                    className="glossy-input w-full rounded-2xl bg-black/40 border border-white/5 text-white font-bold h-12 px-4 text-sm transition-all outline-none focus:ring-1 focus:ring-primary/40 focus:bg-black/60"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
                    required
                />
            </div>

            <div className="flex gap-4 mt-8">
                <button type="button" onClick={onCancel} className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-sm uppercase tracking-widest transition-all">
                    Cancel
                </button>
                <button type="submit" className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary-light text-white font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(89,0,10,0.3)]">
                    Save Method
                </button>
            </div>
        </form>
    );
};

export default ShippingMethodForm;
