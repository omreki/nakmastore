
-- Add missing columns to store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS tax_rates JSONB DEFAULT '{"enabled": true, "rates": [], "taxConfig": {"enabled": true, "name": "Tax", "type": "percentage", "value": 0, "showInCheckout": true}}'::jsonb;

-- Ensure the row with ID 1 exists
INSERT INTO public.store_settings (id, store_name)
VALUES (1, 'Noesis Fitness')
ON CONFLICT (id) DO NOTHING;
