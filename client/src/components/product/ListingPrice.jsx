import React from 'react';
import {
    LISTING_PRICE_WRAPPER,
    LISTING_PRODUCT_COMPARE_PRICE,
    LISTING_PRODUCT_PRICE,
    LISTING_PRODUCT_SALE_PRICE,
} from '../../constants/productListingStyles';

const ListingPrice = ({ product, formatPrice }) => {
    const hasSale = product.is_sale && product.sale_price;

    return (
        <div className={LISTING_PRICE_WRAPPER}>
            {hasSale ? (
                <>
                    <span className={LISTING_PRODUCT_SALE_PRICE}>{formatPrice(product.sale_price)}</span>
                    <span className={LISTING_PRODUCT_COMPARE_PRICE}>{formatPrice(product.price)}</span>
                </>
            ) : (
                <span className={LISTING_PRODUCT_PRICE}>{formatPrice(product.price)}</span>
            )}
        </div>
    );
};

export default ListingPrice;
