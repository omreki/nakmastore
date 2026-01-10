import { supabase } from '../lib/supabase';

const sendEmail = async (to, subject, html) => {
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: { to, subject, html },
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error };
    }
};

// Helper function to format currency
const formatCurrency = (amount, currency = 'USD') => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', KES: 'KSh' };
    return `${symbols[currency] || '$'}${parseFloat(amount).toFixed(2)}`;
};

// Helper function to format date
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const emailService = {
    sendOrderConfirmation: async (order, customer, orderItems = []) => {
        const subject = `Order Confirmation - #${order.id.slice(0, 8).toUpperCase()}`;

        // Build order items HTML
        const itemsHtml = orderItems.map(item => `
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center;">
                        <div>
                            <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 14px;">${item.product_name || 'Product'}</p>
                            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">Qty: ${item.quantity}</p>
                        </div>
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">
                    ${formatCurrency(item.price * item.quantity, order.currency)}
                </td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #30136a 0%, #1e0c42 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">ORDER CONFIRMED</h1>
                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Thank you for your order!</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 16px; color: #374151; margin: 0 0 10px 0;">Hello <strong>${customer.full_name}</strong>,</p>
                        <p style="font-size: 15px; line-height: 1.6; color: #6b7280; margin: 0 0 30px 0;">
                            We've received your order and are getting it ready. You'll receive a delivery confirmation email with tracking information once your order is on its way.
                        </p>
                        
                        <!-- Order Info Box -->
                        <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 30px 0;">
                            <h2 style="color: #30136a; margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">Order Details</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Number:</td>
                                    <td style="text-align: right; font-weight: 600; color: #1f2937; font-size: 14px;">#${order.id.slice(0, 8).toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Date:</td>
                                    <td style="text-align: right; font-weight: 600; color: #1f2937; font-size: 14px;">${formatDate(order.created_at)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Status:</td>
                                    <td style="text-align: right;">
                                        <span style="background: ${order.payment_status === 'paid' ? '#dcfce7' : '#fef3c7'}; color: ${order.payment_status === 'paid' ? '#30136a' : '#d97706'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                                            ${order.payment_status || 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        
                        <!-- Order Items -->
                        <h3 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px; font-weight: bold;">Your Items</h3>
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                            ${itemsHtml || '<tr><td style="padding: 15px; text-align: center; color: #6b7280;">No items available</td></tr>'}
                            <tr style="background: #f9fafb;">
                                <td style="padding: 20px; font-weight: bold; color: #1f2937; font-size: 16px;">Total</td>
                                <td style="padding: 20px; text-align: right; font-weight: bold; color: #30136a; font-size: 18px;">
                                    ${formatCurrency(order.total_amount, order.currency)}
                                </td>
                            </tr>
                        </table>
                        
                        <!-- Delivery Address -->
                        ${order.shipping_address ? `
                        <div style="margin: 30px 0;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">Delivery Address</h3>
                            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #30136a;">
                                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                                    ${typeof order.shipping_address === 'string'
                    ? order.shipping_address.replace(/\n/g, '<br>')
                    : `${order.shipping_address?.line1 || ''}<br>${order.shipping_address?.city || ''} ${order.shipping_address?.postal_code || ''}<br>${order.shipping_address?.country || ''}`
                }
                                </p>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div style="text-align: center; margin: 40px 0 30px 0;">
                            <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://nakmaltd.com'}/account?orderId=${order.id}" style="background: #30136a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                                Track Your Order
                            </a>
                        </div>
                        
                        <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                            If you have any questions, contact us at <a href="mailto:info@nakmaltd.com" style="color: #30136a; text-decoration: none;">info@nakmaltd.com</a>
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; font-weight: 600;">NAKMA STORE</p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">Heritage & Modern Design</p>
                        <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 11px;">
                            © ${new Date().getFullYear()} NAKMA STORE. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await sendEmail(customer.email, subject, html);
    },

    sendAdminOrderNotification: async (order, adminEmail, customer, orderItems = []) => {
        const subject = `🛍️ New Order #${order.id.slice(0, 8).toUpperCase()}`;

        const itemsHtml = orderItems.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 13px;">${item.product_name || 'Product'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937; font-size: 13px;">${formatCurrency(item.price * item.quantity, order.currency)}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🛍️ NEW ORDER RECEIVED</h1>
                        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 13px;">Action Required</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 30px;">
                        <div style="background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%); border-left: 4px solid #30136a; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                            <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">💰 Order Value: <span style="font-size: 18px; color: #30136a;">${formatCurrency(order.total_amount, order.currency)}</span></p>
                        </div>
                        
                        <!-- Order Info -->
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">Order ID:</td>
                                <td style="text-align: right; font-weight: 600; color: #1f2937; font-size: 13px;">#${order.id.slice(0, 8).toUpperCase()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">Date:</td>
                                <td style="text-align: right; font-weight: 600; color: #1f2937; font-size: 13px;">${formatDate(order.created_at)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">Customer:</td>
                                <td style="text-align: right; font-weight: 600; color: #1f2937; font-size: 13px;">${customer.full_name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">Email:</td>
                                <td style="text-align: right; font-weight: 600; color: #1f2937; font-size: 13px;">${customer.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">Payment:</td>
                                <td style="text-align: right;">
                                    <span style="background: ${order.payment_status === 'paid' ? '#dcfce7' : '#fef3c7'}; color: ${order.payment_status === 'paid' ? '#30136a' : '#d97706'}; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                                        ${order.payment_status || 'Pending'}
                                    </span>
                                </td>
                            </tr>
                        </table>
                        
                        <!-- Order Items -->
                        <h3 style="color: #1f2937; margin: 25px 0 12px 0; font-size: 15px; font-weight: bold;">Order Items</h3>
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                            <thead>
                                <tr style="background: #f9fafb;">
                                    <th style="padding: 10px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Product</th>
                                    <th style="padding: 10px; text-align: center; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Qty</th>
                                    <th style="padding: 10px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml || '<tr><td colspan="3" style="padding: 15px; text-align: center; color: #6b7280; font-size: 13px;">No items</td></tr>'}
                            </tbody>
                        </table>
                        
                        <!-- Action Button -->
                        <div style="text-align: center; margin: 35px 0 25px 0;">
                            <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/admin/orders" style="background: #30136a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                                View in Dashboard
                            </a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #9ca3af; font-size: 11px;">NAKMA STORE Admin Panel</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await sendEmail(adminEmail, subject, html);
    },

    sendOrderStatusUpdate: async (order, customer, newStatus) => {
        const subject = `Order Update - #${order.id.slice(0, 8).toUpperCase()}`;

        // Status-specific messaging
        const statusMessages = {
            'pending': { icon: '⏳', color: '#f59e0b', message: 'Your order is being processed' },
            'processing': { icon: '📦', color: '#3b82f6', message: 'Your order is being prepared' },
            'shipped': { icon: '🚚', color: '#8b5cf6', message: 'Your order is on its way!' },
            'delivered': { icon: '✅', color: '#30136a', message: 'Your order has been delivered' },
            'cancelled': { icon: '❌', color: '#ef4444', message: 'Your order has been cancelled' }
        };

        const statusInfo = statusMessages[newStatus.toLowerCase()] || { icon: '📋', color: '#6b7280', message: 'Order status updated' };

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, ${statusInfo.color} 0%, ${statusInfo.color}dd 100%); padding: 40px 30px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">${statusInfo.icon}</div>
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">ORDER UPDATE</h1>
                        <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 15px;">${statusInfo.message}</p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 16px; color: #374151; margin: 0 0 10px 0;">Hello <strong>${customer.full_name}</strong>,</p>
                        <p style="font-size: 15px; line-height: 1.6; color: #6b7280; margin: 0 0 30px 0;">
                            We wanted to update you on your order status. Your order #${order.id.slice(0, 8).toUpperCase()} is now <strong>${newStatus}</strong>.
                        </p>
                        
                        <!-- Status Timeline -->
                        <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 30px 0;">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">Order Status</h2>
                            <div style="text-align: center; padding: 20px;">
                                <div style="display: inline-block; background: ${statusInfo.color}; color: #ffffff; padding: 12px 24px; border-radius: 25px; font-size: 16px; font-weight: 600; text-transform: uppercase;">
                                    ${statusInfo.icon} ${newStatus}
                                </div>
                            </div>
                            <table style="width: 100%; margin-top: 20px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Number:</td>
                                    <td style="text-align: right; font-weight: 600; color: #1f2937; font-size: 14px;">#${order.id.slice(0, 8).toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order Date:</td>
                                    <td style="text-align: right; font-weight: 600; color: #1f2937; font-size: 14px;">${formatDate(order.created_at)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Amount:</td>
                                    <td style="text-align: right; font-weight: 600; color: #30136a; font-size: 14px;">${formatCurrency(order.total_amount, order.currency)}</td>
                                </tr>
                            </table>
                        </div>
                        
                        ${newStatus.toLowerCase() === 'shipped' ? `
                        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                <strong>🚚 Tracking Information</strong><br/>
                                Your package is on its way! You can track your shipment using the tracking number provided separately.
                            </p>
                        </div>
                        ` : ''}
                        
                        ${newStatus.toLowerCase() === 'delivered' ? `
                        <div style="background: #dcfce7; border-left: 4px solid #30136a; padding: 20px; border-radius: 8px; margin: 25px 0;">
                            <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                                <strong>✨ Enjoy your purchase!</strong><br/>
                                We hope you love your new items. If you have any questions or concerns, please don't hesitate to reach out.
                            </p>
                        </div>
                        ` : ''}
                        
                        <div style="text-align: center; margin: 40px 0 30px 0;">
                            <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://nakmaltd.com'}/account?orderId=${order.id}" style="background: #30136a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                                View Order Details
                            </a>
                        </div>
                        
                        <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                            Questions? Contact us at <a href="mailto:info@nakmaltd.com" style="color: #30136a; text-decoration: none;">info@nakmaltd.com</a>
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px; font-weight: 600;">NAKMA STORE</p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">Heritage & Modern Design</p>
                        <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 11px;">
                            © ${new Date().getFullYear()} NAKMA STORE. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await sendEmail(customer.email, subject, html);
    },

    sendTestEmail: async (toEmail) => {
        const subject = "🚀 NAKMA STORE Email System Test";
        const html = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px; margin: auto;">
                <h2 style="color: #30136a;">System Check Successful</h2>
                <p>This is a test email from your NAKMA STORE to verify that the email integration (Resend + Supabase Edge Functions) is working correctly.</p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">Timestamp: ${new Date().toLocaleString()}</p>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">Status: ACTIVE</p>
                </div>
                <p style="font-size: 14px;">If you received this, your email notifications are ready for live orders!</p>
            </div>
        `;
        return await sendEmail(toEmail, subject, html);
    },

    sendLowStockAlert: async (adminEmail, product, variation = null) => {
        const itemName = variation ? `${product.name} (${variation.name})` : product.name;
        const currentStock = variation ? variation.stock : product.stock;
        const sku = variation ? variation.sku : product.sku;

        const subject = `⚠️ LOW STOCK ALERT: ${itemName}`;
        const html = `
            <div style="font-family: sans-serif; padding: 30px; border: 2px solid #ef4444; border-radius: 15px; max-width: 500px; margin: auto; background-color: #fef2f2;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 40px;">⚠️</span>
                </div>
                <h2 style="color: #991b1b; text-align: center; margin-top: 0;">Inventory Alert</h2>
                <p style="color: #b91c1c; font-weight: bold; font-size: 16px; margin-bottom: 20px;">
                    The following item has reached a critical stock level (5 or fewer items remaining).
                </p>
                
                <div style="background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #fee2e2;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Product:</td>
                            <td style="text-align: right; font-weight: bold; color: #111827;">${product.name}</td>
                        </tr>
                        ${variation ? `
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Variation:</td>
                            <td style="text-align: right; font-weight: bold; color: #111827;">${variation.name}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">SKU:</td>
                            <td style="text-align: right; font-weight: bold; color: #111827;">${sku || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Stock Left:</td>
                            <td style="text-align: right; font-weight: 900; color: #ef4444; font-size: 18px;">${currentStock}</td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/admin/products" style="background: #991b1b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Restock Now
                    </a>
                </div>
            </div>
        `;
        return await sendEmail(adminEmail, subject, html);
    },

    sendInquiryEmail: async (adminEmail, inquiryData) => {
        const { name, email, message } = inquiryData;
        const subject = `📬 New Inquiry from ${name}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <div style="background: #30136a; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">NEW INQUIRY</h1>
                    </div>
                    <div style="padding: 30px;">
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px;">From</label>
                            <p style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600;">${name}</p>
                            <p style="margin: 2px 0 0 0; color: #30136a; font-size: 14px;">${email}</p>
                        </div>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #30136a;">
                            <label style="display: block; color: #6b7280; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px;">Message</label>
                            <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                        </div>
                        <div style="margin-top: 30px; text-align: center;">
                            <a href="mailto:${email}?subject=RE: Your inquiry to NAKMA STORE" style="background: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                                Reply to ${name}
                            </a>
                        </div>
                    </div>
                    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #9ca3af; font-size: 11px;">NAKMA STORE Contact System</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return await sendEmail(adminEmail, subject, html);
    },

    sendGuestAccountDetails: async (email, password) => {
        const subject = `Your NAKMA STORE Account Details`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <div style="background: #30136a; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">WELCOME TO NAKMA STORE</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">Hello,</p>
                        <p style="font-size: 15px; line-height: 1.6; color: #6b7280; margin: 0 0 30px 0;">
                            Thank you for shopping with NAKMA STORE! As a guest, we've automatically created an account for you so you can track your order and view your history.
                        </p>
                        
                        <div style="background: #f9fafb; padding: 25px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">Login Credentials</h3>
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #374151;"><strong>Email:</strong> ${email}</p>
                            <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Temporary Password:</strong> ${password}</p>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; margin-bottom: 30px;">
                            We recommend changing your password once you log in.
                        </p>
                        
                        <div style="text-align: center;">
                            <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://nakmaltd.com'}/account" style="background: #30136a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                                Go to My Account
                            </a>
                        </div>
                    </div>
                    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} NAKMA STORE. Heritage & Modern Design.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return await sendEmail(email, subject, html);
    }
};
