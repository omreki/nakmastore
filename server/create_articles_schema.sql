-- Create article categories table
CREATE TABLE IF NOT EXISTS public.article_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create articles table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    category_id UUID REFERENCES public.article_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for article_categories
CREATE POLICY "Allow public read access to categories" 
    ON public.article_categories FOR SELECT 
    USING (true);

CREATE POLICY "Allow authenticated users to manage categories" 
    ON public.article_categories FOR ALL 
    USING (auth.role() = 'authenticated');

-- RLS Policies for articles
CREATE POLICY "Allow public read access to published articles" 
    ON public.articles FOR SELECT 
    USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage articles" 
    ON public.articles FOR ALL 
    USING (auth.role() = 'authenticated');

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_article_categories_updated_at ON public.article_categories;
CREATE TRIGGER update_article_categories_updated_at
BEFORE UPDATE ON public.article_categories
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON public.articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_is_published ON public.articles(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);
