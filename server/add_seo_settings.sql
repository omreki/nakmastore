-- Add seo_settings column to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS seo_settings jsonb DEFAULT '{
    "metaTitle": "",
    "metaDescription": "",
    "keywords": "fitness, apparel, gym wear, performance gear, nakma",
    "googleSiteVerification": ""
}'::jsonb;
