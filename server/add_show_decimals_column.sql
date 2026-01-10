-- Add show_decimals column to store_settings table
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS show_decimals BOOLEAN DEFAULT TRUE;

-- Update the RLS policy if needed, but usually existing update policies cover new columns if they are for the whole table
