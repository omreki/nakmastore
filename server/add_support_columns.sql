-- Add returns_policy and size_guide columns to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS returns_policy text default 'Returns & Exchanges policy goes here...',
ADD COLUMN IF NOT EXISTS size_guide text default 'Size Guide content goes here...';
