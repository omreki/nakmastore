-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'page_view', 'click', 'cart_action', 'checkout', 'interaction'
    event_name TEXT NOT NULL, -- 'Home Page', 'Add to Cart', 'Contact Link', etc.
    page_url TEXT,
    referrer TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for performance
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx ON analytics_events(session_id);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking
CREATE POLICY "Allow anonymous inserts" ON analytics_events
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow authenticated users to insert (logged in users)
CREATE POLICY "Allow authenticated inserts" ON analytics_events
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Only admins can read analytics data
CREATE POLICY "Allow admins to read analytics" ON analytics_events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
