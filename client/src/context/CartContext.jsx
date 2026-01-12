import React, { createContext, useContext, useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const localData = localStorage.getItem('nakma_cart');
        return localData ? JSON.parse(localData) : [];
    });

    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('nakma_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, quantity = 1, selectedSize = null, selectedColor = null, selectedWeight = null, selectedDimension = null) => {
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(
                item => item.id === product.id &&
                    item.selectedSize === selectedSize &&
                    item.selectedColor === selectedColor &&
                    item.selectedWeight === selectedWeight &&
                    item.selectedDimension === selectedDimension &&
                    item.variation_id === product.variation_id
            );

            if (existingItemIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex].quantity += quantity;
                return newCart;
            } else {
                return [...prevCart, { ...product, quantity, selectedSize, selectedColor, selectedWeight, selectedDimension }];
            }
        });
        analyticsService.trackCartAction('Add to Cart', product, { quantity, selectedSize, selectedColor, selectedWeight, selectedDimension });
        setIsCartOpen(true); // Auto open cart on add
    };

    const removeFromCart = (productId, selectedSize, selectedColor, selectedWeight, selectedDimension, variationId) => {
        setCart(prevCart => prevCart.filter(item => !(
            item.id === productId &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor &&
            item.selectedWeight === selectedWeight &&
            item.selectedDimension === selectedDimension &&
            item.variation_id === variationId
        )));
        analyticsService.trackEvent('cart_action', 'Remove from Cart', { productId, selectedSize, selectedColor, selectedWeight, selectedDimension });
    };

    const updateQuantity = (productId, selectedSize, selectedColor, selectedWeight, selectedDimension, variationId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prevCart => prevCart.map(item =>
            (item.id === productId &&
                item.selectedSize === selectedSize &&
                item.selectedColor === selectedColor &&
                item.selectedWeight === selectedWeight &&
                item.selectedDimension === selectedDimension &&
                item.variation_id === variationId)
                ? { ...item, quantity: newQuantity }
                : item
        ));
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => {
            const price = item.is_sale && item.sale_price ? item.sale_price : item.price;
            return total + (price * item.quantity);
        }, 0);
    };

    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
