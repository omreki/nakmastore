import { supabase } from '../lib/supabase';
import { emailService } from '../services/emailService';

const normalizeEmail = (email) => email?.trim().toLowerCase() || '';

export const mapOrderEmailItems = (items = []) => items.map((item) => ({
    product_name: item.product_name || item.name || 'Product',
    quantity: item.quantity,
    price: item.price,
}));

export const collectOrderAlertRecipients = async (settings = {}) => {
    const recipients = new Set();

    (settings.alertEmails || []).forEach((email) => {
        const normalized = normalizeEmail(email);
        if (normalized) recipients.add(normalized);
    });

    const supportEmail = normalizeEmail(settings.supportEmail);
    if (supportEmail) recipients.add(supportEmail);

    const [{ data: teamMembers }, { data: profileAdmins }] = await Promise.all([
        supabase
            .from('team_members')
            .select('email')
            .in('role', ['admin', 'editor', 'shop_manager']),
        supabase
            .from('profiles')
            .select('email')
            .eq('role', 'admin'),
    ]);

    (teamMembers || []).forEach((member) => {
        const normalized = normalizeEmail(member.email);
        if (normalized) recipients.add(normalized);
    });

    (profileAdmins || []).forEach((profile) => {
        const normalized = normalizeEmail(profile.email);
        if (normalized) recipients.add(normalized);
    });

    return [...recipients];
};

export const buildOrderNotificationPayload = (order, customer, items, settings = {}) => ({
    order: {
        ...order,
        shipping_address: order.shipping_address || order.shippingDetails || null,
        created_at: order.created_at || new Date().toISOString(),
        currency: order.currency || settings.currency || 'KES',
    },
    customer: {
        email: normalizeEmail(customer?.email),
        full_name: customer?.full_name?.trim() || customer?.fullName?.trim() || 'Customer',
    },
    items: mapOrderEmailItems(items),
});

export const sendOrderPlacementNotifications = async ({
    order,
    customer,
    items,
    settings = {},
}) => {
    const payload = buildOrderNotificationPayload(order, customer, items, settings);

    if (!payload.customer.email) {
        console.warn('Order notifications skipped: missing customer email');
        return { customerSent: false, adminSent: false, recipients: [] };
    }

    const recipients = await collectOrderAlertRecipients(settings);

    const [customerResult, adminResult] = await Promise.all([
        emailService.sendOrderConfirmation(payload.order, payload.customer, payload.items),
        recipients.length > 0
            ? emailService.sendAdminOrderNotification(payload.order, recipients, payload.customer, payload.items)
            : Promise.resolve({ success: true, skipped: true }),
    ]);

    if (!customerResult?.success) {
        console.error('Customer order confirmation email failed:', customerResult?.error);
    }

    if (recipients.length > 0 && !adminResult?.success) {
        console.error('Admin order alert email failed:', adminResult?.error);
    }

    return {
        customerSent: !!customerResult?.success,
        adminSent: recipients.length === 0 || !!adminResult?.success,
        recipients,
        customerResult,
        adminResult,
    };
};
