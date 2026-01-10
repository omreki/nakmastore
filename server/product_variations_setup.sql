-- Create Product Variations Table
CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE,
    name TEXT, -- e.g. "Space Black / XL"
    color TEXT, -- The color name or hex
    size TEXT, -- The size name
    price DECIMAL(10, 2), -- Variation specific price
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add SKU to products if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='sku') THEN
        ALTER TABLE products ADD COLUMN sku TEXT UNIQUE;
    END IF;
    -- Add variation columns to order_items
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='order_items' AND COLUMN_NAME='variation_id') THEN
        ALTER TABLE order_items ADD COLUMN variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='order_items' AND COLUMN_NAME='variation_name') THEN
        ALTER TABLE order_items ADD COLUMN variation_name TEXT;
    END IF;
END $$;

-- Create Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'low_stock', 'new_order', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT, -- Link to relevant page
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);

-- Low Stock Notification Trigger Function
CREATE OR REPLACE FUNCTION handle_low_stock_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if stock is 5 or below and it wasn't before
    IF (NEW.stock <= 5 AND (OLD.stock IS NULL OR OLD.stock > 5)) THEN
        INSERT INTO admin_notifications (type, title, message, link)
        VALUES (
            'low_stock',
            'Low Stock Alert: ' || (SELECT name FROM products WHERE id = NEW.product_id),
            'Variation "' || NEW.name || '" (SKU: ' || COALESCE(NEW.sku, 'N/A') || ') is low on stock. Current count: ' || NEW.stock,
            '/admin/products'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger for Variations
DROP TRIGGER IF EXISTS tr_variation_low_stock ON product_variations;
CREATE TRIGGER tr_variation_low_stock
    AFTER UPDATE OF stock ON product_variations
    FOR EACH ROW
    EXECUTE FUNCTION handle_low_stock_notification();

-- Create Trigger for Base Products (for products without variations)
CREATE OR REPLACE FUNCTION handle_base_product_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if stock is 5 or below and it wasn't before
    IF (NEW.stock <= 5 AND (OLD.stock IS NULL OR OLD.stock > 5)) THEN
        -- Only if no variations exist for this product
        IF NOT EXISTS (SELECT 1 FROM product_variations WHERE product_id = NEW.id) THEN
            INSERT INTO admin_notifications (type, title, message, link)
            VALUES (
                'low_stock',
                'Low Stock Alert: ' || NEW.name,
                'Product (SKU: ' || COALESCE(NEW.sku, 'N/A') || ') is low on stock. Current count: ' || NEW.stock,
                '/admin/products'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_product_low_stock ON products;
CREATE TRIGGER tr_product_low_stock
    AFTER UPDATE OF stock ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_base_product_low_stock();

-- Stock Decrement RPC Functions
CREATE OR REPLACE FUNCTION decrement_variation_stock(var_id UUID, qty INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE product_variations
    SET stock = GREATEST(0, stock - qty)
    WHERE id = var_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_product_stock(prod_id UUID, qty INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock = GREATEST(0, stock - qty)
    WHERE id = prod_id;
END;
$$ LANGUAGE plpgsql;
