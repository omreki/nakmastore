import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'nakma_analytics_session_id';
const PERSISTENT_KEY = 'nakma_analytics_persistent_id';

class AnalyticsService {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.persistentId = this.getOrCreatePersistentId();
        this.userId = null;
        this.heartbeatInterval = null;
        this.startTime = Date.now();
    }

    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem(SESSION_KEY);
        if (!sessionId) {
            sessionId = uuidv4();
            sessionStorage.setItem(SESSION_KEY, sessionId);
        }
        return sessionId;
    }

    getOrCreatePersistentId() {
        let persistentId = localStorage.getItem(PERSISTENT_KEY);
        if (!persistentId) {
            persistentId = uuidv4();
            localStorage.setItem(PERSISTENT_KEY, persistentId);
        }
        return persistentId;
    }

    setUserId(userId) {
        this.userId = userId;
    }

    async trackEvent(type, name, metadata = {}) {
        try {
            const { error } = await supabase.from('analytics_events').insert([
                {
                    session_id: this.sessionId,
                    persistent_id: this.persistentId,
                    user_id: this.userId,
                    event_type: type,
                    event_name: name,
                    page_url: window.location.pathname,
                    referrer: document.referrer,
                    user_agent: navigator.userAgent,
                    metadata: {
                        ...metadata,
                        viewport: `${window.innerWidth}x${window.innerHeight}`,
                        timestamp: new Date().toISOString(),
                        is_admin_path: window.location.pathname.startsWith('/admin')
                    }
                }
            ]);

            if (error) {
                console.warn('Analytics Error:', error.message);
            }
        } catch (err) {
            console.error('Analytics tracking failed:', err);
        }
    }

    trackPageView(pageName) {
        this.trackEvent('page_view', pageName || window.location.pathname);
    }

    trackProductView(product) {
        this.trackEvent('product_view', product.name, {
            product_id: product.id,
            category: product.category,
            price: product.price
        });
    }

    trackClick(elementName, metadata = {}) {
        this.trackEvent('click', elementName, metadata);
    }

    trackLinkClick(label, url, metadata = {}) {
        this.trackEvent('link_click', label, { url, ...metadata });
    }

    trackCartAction(action, product, metadata = {}) {
        this.trackEvent('cart_action', action, {
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            ...metadata
        });
    }

    trackCheckout(step, metadata = {}) {
        this.trackEvent('checkout', step, metadata);
    }

    startHeartbeat() {
        if (this.heartbeatInterval) return;

        // Track time spent every minute
        this.heartbeatInterval = setInterval(() => {
            const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
            this.trackEvent('heartbeat', 'Session Activity', { timeSpentSeconds: timeSpent });
        }, 60000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}

export const analyticsService = new AnalyticsService();
