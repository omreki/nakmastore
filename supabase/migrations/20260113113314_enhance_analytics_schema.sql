-- Analytics Schema Enhancement Migration
-- Adds persistent_id, ip_address columns and performance indexes for analytics_events table
-- This enables proper unique visitor tracking and improves query performance for date-based filtering

-- Add missing persistent_id column for tracking unique devices across sessions
ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS persistent_id TEXT;

-- Add IP address column for additional unique visitor identification
ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create simple performance indexes (avoiding function-based indexes that require IMMUTABLE)
-- Index on persistent_id for fast unique visitor queries
CREATE INDEX IF NOT EXISTS analytics_events_persistent_id_idx 
ON analytics_events(persistent_id);

-- Index on created_at for efficient date range queries
CREATE INDEX IF NOT EXISTS analytics_events_created_at_desc_idx 
ON analytics_events(created_at DESC);

-- Composite index on event_type and created_at for efficient filtering
CREATE INDEX IF NOT EXISTS analytics_events_type_date_idx 
ON analytics_events(event_type, created_at DESC);

-- Partial index on session_id for session-based queries
CREATE INDEX IF NOT EXISTS analytics_events_session_id_idx 
ON analytics_events(session_id) 
WHERE session_id IS NOT NULL;

-- Add documentation comments for better schema understanding
COMMENT ON COLUMN analytics_events.persistent_id 
IS 'Unique device identifier stored in localStorage for tracking unique visitors across sessions';

COMMENT ON COLUMN analytics_events.ip_address 
IS 'Client IP address for additional unique visitor identification';

COMMENT ON TABLE analytics_events 
IS 'Stores all user interaction events for analytics. Indexed for efficient date-range queries.';
