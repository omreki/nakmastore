-- Add privacy_policy and terms_of_service columns to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS privacy_policy text default 'Privacy Policy content goes here...',
ADD COLUMN IF NOT EXISTS terms_of_service text default 'Terms of Service content goes here...';
