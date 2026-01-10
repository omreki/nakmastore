-- Allow authenticated users to delete orders
DROP POLICY IF EXISTS "Allow authenticated users to delete orders" ON public.orders;
CREATE POLICY "Allow authenticated users to delete orders" ON public.orders FOR DELETE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete order items
DROP POLICY IF EXISTS "Allow authenticated users to delete order items" ON public.order_items;
CREATE POLICY "Allow authenticated users to delete order items" ON public.order_items FOR DELETE USING (auth.role() = 'authenticated');
