import React, { useState, useEffect } from 'react';

const TaxSettingsForm = ({ settings, onUpdate }) => {
    // Use settings.taxConfig directly from parent to avoid sync loops
    const taxConfig = settings?.taxConfig || {
        enabled: true,
        name: 'Tax',
        type: 'percentage',
        value: 0,
        showInCheckout: true
    };

    const updateConfig = (updates) => {
        onUpdate({
            taxConfig: { ...taxConfig, ...updates }
        });
    };

    return (
        <div className="space-y-8">
            {/* Enable/Disable Tax */}
            <div className="flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
                <div>
                    <h3 className="text-lg font-black italic tracking-tight text-white">Enable Tax</h3>
                    <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Tax calculations at checkout</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={taxConfig.enabled}
                        onChange={(e) => updateConfig({ enabled: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#a14550]"></div>
                </label>
            </div>

            {taxConfig.enabled && (
                <>
                    {/* Tax Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2">
                            Tax Display Name
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. VAT, Sales Tax, GST"
                            value={taxConfig.name}
                            onChange={(e) => updateConfig({ name: e.target.value })}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-[#a14550] transition-all text-white placeholder:text-white/20"
                        />
                        <p className="text-xs text-white/30 ml-2 mt-1">This name will be shown to customers at checkout</p>
                    </div>

                    {/* Tax Type */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2">
                            Tax Calculation Type
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${taxConfig.type === 'percentage' ? 'border-[#a14550] bg-[#a14550]/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}>
                                <input
                                    type="radio"
                                    name="taxType"
                                    value="percentage"
                                    checked={taxConfig.type === 'percentage'}
                                    onChange={(e) => updateConfig({ type: e.target.value })}
                                    className="sr-only"
                                />
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-3xl mb-2 block">percent</span>
                                    <span className="text-sm font-bold uppercase tracking-wider">Percentage</span>
                                </div>
                            </label>
                            <label className={`relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${taxConfig.type === 'fixed' ? 'border-[#a14550] bg-[#a14550]/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'}`}>
                                <input
                                    type="radio"
                                    name="taxType"
                                    value="fixed"
                                    checked={taxConfig.type === 'fixed'}
                                    onChange={(e) => updateConfig({ type: e.target.value })}
                                    className="sr-only"
                                />
                                <div className="text-center">
                                    <span className="material-symbols-outlined text-3xl mb-2 block">payments</span>
                                    <span className="text-sm font-bold uppercase tracking-wider">Fixed Amount</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Tax Value */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-2">
                            {taxConfig.type === 'percentage' ? 'Tax Rate (%)' : `Fixed Amount (${settings?.currency || 'USD'})`}
                        </label>
                        <div className="relative">
                            <input
                                required
                                type="number"
                                step={taxConfig.type === 'percentage' ? '0.01' : '0.01'}
                                min="0"
                                placeholder={taxConfig.type === 'percentage' ? '0.00' : '0.00'}
                                value={taxConfig.value}
                                onChange={(e) => updateConfig({ value: parseFloat(e.target.value) || 0 })}
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 pr-12 text-lg font-bold outline-none focus:border-[#a14550] transition-all text-white placeholder:text-white/20"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">
                                {taxConfig.type === 'percentage' ? '%' : settings?.currency || 'USD'}
                            </span>
                        </div>
                        {taxConfig.type === 'percentage' && taxConfig.value > 0 && (
                            <p className="text-xs text-white/30 ml-2 mt-1">
                                Example: ${(100 * (taxConfig.value / 100)).toFixed(2)} tax on $100.00 purchase
                            </p>
                        )}
                    </div>

                    {/* Show/Hide in Checkout */}
                    <div className="flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
                        <div>
                            <h3 className="text-lg font-black italic tracking-tight text-white">Show at Checkout</h3>
                            <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Display tax as separate line item</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={taxConfig.showInCheckout}
                                onChange={(e) => updateConfig({ showInCheckout: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#a14550]"></div>
                        </label>
                    </div>

                    {/* Preview */}
                    <div className="p-6 rounded-2xl border border-[#a14550]/20 bg-[#a14550]/5">
                        <div className="flex items-start gap-3 mb-4">
                            <span className="material-symbols-outlined text-[#a14550]">visibility</span>
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Checkout Preview</h4>
                                <p className="text-xs text-white/40 mt-1">How customers will see the tax</p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60 uppercase tracking-wider font-bold">Subtotal</span>
                                <span className="text-white font-bold">$100.00</span>
                            </div>
                            {taxConfig.showInCheckout && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/60 uppercase tracking-wider font-bold">{taxConfig.name}</span>
                                    <span className="text-white font-bold">
                                        {taxConfig.type === 'percentage'
                                            ? `$${(100 * (taxConfig.value / 100)).toFixed(2)}`
                                            : `$${taxConfig.value.toFixed(2)}`
                                        }
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-black pt-3 border-t border-white/10">
                                <span className="text-white uppercase tracking-wider italic">Total</span>
                                <span className="text-[#a14550]">
                                    ${taxConfig.type === 'percentage'
                                        ? (100 + (100 * (taxConfig.value / 100))).toFixed(2)
                                        : (100 + taxConfig.value).toFixed(2)
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TaxSettingsForm;
