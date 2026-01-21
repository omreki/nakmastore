-- Fix RLS policies for orders table to allow guest checkout
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON orders;
DROP POLICY IF EXISTS "Public create orders" ON orders;
CREATE POLICY "Enable insert for everyone" ON orders FOR INSERT WITH CHECK (true);

-- Fix RLS policies for order_items table to allow guest checkout
DROP POLICY IF EXISTS "Allow authenticated users to insert order_items" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert order items" ON order_items;
DROP POLICY IF EXISTS "Public create order items" ON order_items;
CREATE POLICY "Enable insert for everyone" ON order_items FOR INSERT WITH CHECK (true);
