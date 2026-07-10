export const DEFAULT_PAYMENT_METHOD = 'cod';

export const PAYMENT_METHOD_OPTIONS = [
    { value: 'cod', label: 'Cash on Delivery' },
    { value: 'paystack', label: 'Mpesa/Cards' },
    { value: 'stripe', label: 'Credit Card (Stripe)' },
    { value: 'paypal', label: 'PayPal' },
];

const PAYMENT_PRIORITY = ['paystack', 'stripe', 'paypal', 'cod'];

export const normalizePaymentMethod = (method) => {
    const normalized = (method || DEFAULT_PAYMENT_METHOD).toLowerCase();
    return PAYMENT_PRIORITY.includes(normalized) ? normalized : DEFAULT_PAYMENT_METHOD;
};

export const resolveCartPaymentMethod = (cartItems = []) => {
    if (!cartItems.length) return DEFAULT_PAYMENT_METHOD;

    const methods = [...new Set(
        cartItems.map((item) => normalizePaymentMethod(item.payment_method))
    )];

    if (methods.length === 1) return methods[0];

    return PAYMENT_PRIORITY.find((method) => methods.includes(method)) || DEFAULT_PAYMENT_METHOD;
};

export const getPaymentMethodLabel = (method) => {
    const option = PAYMENT_METHOD_OPTIONS.find(
        (entry) => entry.value === normalizePaymentMethod(method)
    );
    return option?.label || 'Cash on Delivery';
};
