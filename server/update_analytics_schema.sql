-- Add missing persistent_id column for tracking unique devices
ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS persistent_id TEXT;

-- Add IP address column for additional unique visitor tracking
ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create indexes for better query performance (using simple B-tree indexes)
CREATE INDEX IF NOT EXISTS analytics_events_persistent_id_idx ON analytics_events(persistent_id);
CREATE INDEX IF NOT EXISTS analytics_events_created_at_desc_idx ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_type_date_idx ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx ON analytics_events(session_id) WHERE session_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN analytics_events.persistent_id IS 'Unique device identifier stored in localStorage for tracking unique visitors across sessions';
COMMENT ON COLUMN analytics_events.ip_address IS 'Client IP address for additional unique visitor identification';
COMMENT ON TABLE analytics_events IS 'Stores all user interaction events for analytics. Indexed for efficient date-range queries.';
