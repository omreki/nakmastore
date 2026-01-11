-- Add contact information columns to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS contact_phone text default '+1 (888) NAKMA-0',
ADD COLUMN IF NOT EXISTS contact_address text default '77 Innovation Way, Los Angeles, CA 90210',
ADD COLUMN IF NOT EXISTS operating_hours jsonb default '{"mon_fri": "08:00 — 20:00 PST", "sat": "10:00 — 16:00 PST"}'::jsonb,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS facebook_url text;
