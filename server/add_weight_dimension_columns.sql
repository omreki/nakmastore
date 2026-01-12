-- Migration to add weight and dimension columns to products, product_variations and order_items
DO $$ 
BEGIN 
    -- 1. Add columns to products
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='weights') THEN
        ALTER TABLE products ADD COLUMN weights JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='dimensions') THEN
        ALTER TABLE products ADD COLUMN dimensions JSONB DEFAULT '[]';
    END IF;

    -- 2. Add columns to product_variations
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='product_variations' AND COLUMN_NAME='weight') THEN
        ALTER TABLE product_variations ADD COLUMN weight TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='product_variations' AND COLUMN_NAME='dimension') THEN
        ALTER TABLE product_variations ADD COLUMN dimension TEXT;
    END IF;

    -- 3. Add columns to order_items for historical persistence
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='order_items' AND COLUMN_NAME='selected_size') THEN
        ALTER TABLE order_items ADD COLUMN selected_size TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='order_items' AND COLUMN_NAME='selected_color') THEN
        ALTER TABLE order_items ADD COLUMN selected_color TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='order_items' AND COLUMN_NAME='selected_weight') THEN
        ALTER TABLE order_items ADD COLUMN selected_weight TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='order_items' AND COLUMN_NAME='selected_dimension') THEN
        ALTER TABLE order_items ADD COLUMN selected_dimension TEXT;
    END IF;
END $$;
