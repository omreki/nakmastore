import React from 'react';

export const ColorPicker = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
        <div className="flex items-center gap-2">
            <input
                type="color"
                value={value || '#ffffff'}
                onChange={(e) => onChange(e.target.value)}
                className="size-8 rounded cursor-pointer border-none bg-transparent"
            />
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white uppercase focus:border-primary outline-none"
            />
        </div>
    </div>
);

export const RangeSlider = ({ label, value, min, max, step = 1, unit = 'px', onChange }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
            <span className="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">{value}{unit}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value || min}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
        />
    </div>
);

export const ToggleSwitch = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
        <button
            onClick={() => onChange(!checked)}
            className={`w-10 h-5 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-white/10'}`}
        >
            <div className={`size-3 rounded-full bg-white absolute top-1 transition-all ${checked ? 'left-6' : 'left-1'}`} />
        </button>
    </div>
);

export const FontSelector = ({ label, value, onChange }) => {
    const fonts = ['Manrope', 'Inter', 'Roboto', 'Outfit', 'Montserrat', 'Playfair Display', 'Open Sans'];
    return (
        <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
            <select
                value={value || 'Manrope'}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none appearance-none"
            >
                {fonts.map(f => <option key={f} value={f} className="text-black" style={{ fontFamily: f }}>{f}</option>)}
            </select>
        </div>
    );
};

export const SelectInput = ({ label, value, options, onChange }) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none appearance-none"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value} className="text-black">{opt.label}</option>
            ))}
        </select>
    </div>
);
