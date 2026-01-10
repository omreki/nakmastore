-- Create a table for storing dynamic pages
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_image_url TEXT,
    content_category_slug TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- e.g. for Men/Women pages that shouldn't be deleted but can be edited
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.pages FOR SELECT USING (true);
CREATE POLICY "Allow admin full access" ON public.pages FOR ALL USING (auth.role() = 'authenticated'); -- Assuming simple auth for now

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
