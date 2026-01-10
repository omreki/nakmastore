-- Add payment_reference column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_reference text;
