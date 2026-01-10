import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [confirmState, setConfirmState] = useState(null);
    const resolveRef = useRef(null);

    const notify = useCallback((message, type = 'success', duration = 4000) => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }
    }, []);

    const confirm = useCallback((options) => {
        setConfirmState({
            title: options.title || 'Confirm Action',
            message: options.message || 'Are you sure you want to proceed?',
            confirmLabel: options.confirmLabel || 'Confirm',
            cancelLabel: options.cancelLabel || 'Cancel',
            type: options.type || 'warning', // 'danger', 'info', 'warning'
        });

        return new Promise((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = (value) => {
        if (resolveRef.current) {
            resolveRef.current(value);
            resolveRef.current = null;
        }
        setConfirmState(null);
    };

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notify, confirm }}>
            {children}

            {/* Toast Notifications */}
            {createPortal(
                <div className="fixed top-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none max-w-md w-full">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`animate-slide-in-right pointer-events-auto relative overflow-hidden group border backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-5 flex items-start gap-4 transition-all hover:scale-[1.02] cursor-default
                                ${n.type === 'success'
                                    ? 'border-primary/20 bg-primary/5'
                                    : n.type === 'error'
                                        ? 'border-red-500/30 bg-red-500/5'
                                        : 'border-white/10 bg-white/5'
                                }`}
                        >
                            {/* Accent Glow */}
                            <div className={`absolute -left-12 -top-12 size-24 blur-[40px] opacity-30 group-hover:opacity-50 transition-opacity
                                ${n.type === 'success' ? 'bg-primary' : n.type === 'error' ? 'bg-red-500' : 'bg-primary'}`}
                            />

                            {/* Icon Section */}
                            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 border relative z-10
                                ${n.type === 'success'
                                    ? 'bg-primary/20 border-primary/30 text-primary-light'
                                    : n.type === 'error'
                                        ? 'bg-red-500/20 border-red-500/30 text-red-500'
                                        : 'bg-white/10 border-white/10 text-white'
                                }`}>
                                <span className="material-symbols-outlined text-[24px]">
                                    {n.type === 'success' ? 'verified' : n.type === 'error' ? 'report' : 'notifications'}
                                </span>
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 pt-1 relative z-10">
                                <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1
                                    ${n.type === 'success' ? 'text-primary' : n.type === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
                                    {n.type === 'success' ? 'Protocol Success' : n.type === 'error' ? 'System Warning' : 'Update Alert'}
                                </h4>
                                <p className="text-white text-sm font-bold leading-relaxed pr-6">{n.message}</p>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => removeNotification(n.id)}
                                className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>

                            {/* Progress bar */}
                            <div className={`absolute bottom-0 left-0 h-[2px] w-full animate-toast-progress origin-left
                                ${n.type === 'success' ? 'bg-primary/40' : n.type === 'error' ? 'bg-red-500/40' : 'bg-white/20'}`}
                            />
                        </div>
                    ))}
                </div>,
                document.body
            )}

            {/* Confirm Modal */}
            {confirmState && createPortal(
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in"
                        onClick={() => handleConfirm(false)}
                    />
                    <div className="relative w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="glossy-panel border border-white/10 rounded-[2.5rem] bg-black/40 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                            <div className="p-8 md:p-10 text-center">
                                {/* Danger/Warning Icon */}
                                <div className="mb-8 relative flex justify-center">
                                    <div className="absolute inset-0 blur-2xl opacity-20 bg-primary rounded-full" />
                                    <div className={`size-20 rounded-[2rem] flex items-center justify-center border-2 border-white/5 bg-white/5 relative z-10 
                                        ${confirmState.type === 'danger' ? 'text-red-500 border-red-500/20' : 'text-primary'}`}>
                                        <span className="material-symbols-outlined text-[40px]">
                                            {confirmState.type === 'danger' ? 'delete_forever' : 'help'}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
                                    {confirmState.title}
                                </h3>
                                <p className="text-gray-400 text-sm font-medium leading-relaxed px-2">
                                    {confirmState.message}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mt-10">
                                    <button
                                        onClick={() => handleConfirm(false)}
                                        className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/5 active:scale-95"
                                    >
                                        {confirmState.cancelLabel}
                                    </button>
                                    <button
                                        onClick={() => handleConfirm(true)}
                                        className={`h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95
                                            ${confirmState.type === 'danger'
                                                ? 'bg-red-600 hover:bg-red-500 text-white'
                                                : 'bg-white hover:bg-primary-light text-black hover:text-white'}`}
                                    >
                                        {confirmState.confirmLabel}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes toast-progress {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
                .animate-toast-progress {
                    animation: toast-progress 4s linear forwards;
                }
                @keyframes scale-in {
                    from { transform: scale(0.9) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                .animate-scale-in {
                    animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </NotificationContext.Provider>
    );
};
