-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES public.profiles(id),
    status text DEFAULT 'Pending',
    total_amount numeric NOT NULL,
    currency text DEFAULT 'USD',
    shipping_address jsonb,
    payment_status text DEFAULT 'Unpaid',
    payment_method text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id),
    quantity integer NOT NULL,
    price numeric NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Dynamic Policies
DROP POLICY IF EXISTS "Allow authenticated users to read orders" ON public.orders;
CREATE POLICY "Allow authenticated users to read orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON public.orders;
CREATE POLICY "Allow authenticated users to insert orders" ON public.orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update orders" ON public.orders;
CREATE POLICY "Allow authenticated users to update orders" ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read order items" ON public.order_items;
CREATE POLICY "Allow authenticated users to read order items" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert order items" ON public.order_items;
CREATE POLICY "Allow authenticated users to insert order items" ON public.order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
