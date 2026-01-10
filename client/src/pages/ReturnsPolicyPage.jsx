import React from 'react';
import { useStoreSettings } from '../context/StoreSettingsContext';
import SEO from '../components/SEO';

const ReturnsPolicyPage = () => {
    const { settings, loading } = useStoreSettings();

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black">
                <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4"></div>
                <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Loading Policy...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-24 md:pt-32 pb-24">
            <SEO
                title={`Returns & Exchanges | ${settings.storeName}`}
                description={`Returns and Exchanges policy for ${settings.storeName}. Review our guidelines for product returns.`}
            />

            <div className="max-w-4xl mx-auto px-6">
                <div className="mb-16">
                    <span className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary-light ring-1 ring-inset ring-primary/30 backdrop-blur-sm mb-6">
                        Customer Care
                    </span>
                    <h1 className="text-white text-4xl md:text-7xl font-black leading-tight tracking-[-0.04em]">
                        Returns <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-gray-600">& Exchanges</span>
                    </h1>
                    <p className="text-gray-500 text-lg font-medium mt-6 max-w-2xl leading-relaxed">
                        Our guidelines for product returns and exchanges. We ensure your satisfaction with a streamlined and fair procedure.
                    </p>
                </div>

                <div className="glossy-panel rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 border border-white/5 bg-black/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40"></div>

                    <div
                        className="policy-content text-gray-400 leading-relaxed space-y-6"
                        dangerouslySetInnerHTML={{ __html: settings.returnsPolicy || '<p>Returns policy content is being updated.</p>' }}
                    />
                </div>

                <style>{`
                    .policy-content h1, .policy-content h2, .policy-content h3 { color: white; font-weight: 900; tracking: tight; margin-top: 2rem; margin-bottom: 1rem; }
                    .policy-content h1 { font-size: 2rem; }
                    .policy-content h2 { font-size: 1.5rem; }
                    .policy-content p { margin-bottom: 1.5rem; }
                    .policy-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
                    .policy-content li { margin-bottom: 0.5rem; }
                    .policy-content strong { color: white; font-weight: 700; }
                `}</style>

                <div className="mt-16 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-600 text-sm font-medium">Last Updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
};

export default ReturnsPolicyPage;
