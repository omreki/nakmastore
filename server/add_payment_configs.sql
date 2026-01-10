-- Add payment_configs column to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS payment_configs jsonb DEFAULT '{}'::jsonb;
