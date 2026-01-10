-- Add hero_image_url column to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
