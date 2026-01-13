-- Analytics Verification Queries
-- Run these in Supabase SQL Editor to test and verify analytics tracking

-- ============================================================================
-- 1. CHECK SCHEMA - Verify all columns exist
-- ============================================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'analytics_events' 
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid), session_id (text), persistent_id (text), ip_address (text),
-- user_id (uuid), event_type (text), event_name (text), page_url (text),
-- referrer (text), metadata (jsonb), user_agent (text), created_at (timestamp)


-- ============================================================================
-- 2. CHECK INDEXES - Verify performance indexes are created
-- ============================================================================
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'analytics_events'
ORDER BY indexname;

-- Expected indexes:
-- analytics_events_created_at_idx
-- analytics_events_date_idx
-- analytics_events_event_type_idx
-- analytics_events_persistent_id_idx
-- analytics_events_session_id_idx
-- analytics_events_type_date_idx
-- analytics_events_year_month_idx


-- ============================================================================
-- 3. VIEW RECENT EVENTS - See latest tracked events
-- ============================================================================
SELECT 
    id,
    session_id,
    persistent_id,
    ip_address,
    event_type,
    event_name,
    page_url,
    created_at
FROM analytics_events 
ORDER BY created_at DESC 
LIMIT 20;


-- ============================================================================
-- 4. COUNT TOTAL VISITS - Today's page views
-- ============================================================================
SELECT COUNT(*) as total_visits_today
FROM analytics_events
WHERE event_type = 'page_view'
AND DATE(created_at) = CURRENT_DATE;


-- ============================================================================
-- 5. COUNT UNIQUE VISITORS - Today's unique devices
-- ============================================================================
SELECT COUNT(DISTINCT persistent_id) as unique_visitors_today
FROM analytics_events
WHERE persistent_id IS NOT NULL
AND DATE(created_at) = CURRENT_DATE;


-- ============================================================================
-- 6. SESSION ANALYSIS - Average session duration today
-- ============================================================================
WITH session_times AS (
    SELECT 
        session_id,
        MIN(created_at) as session_start,
        MAX(created_at) as session_end,
        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration_seconds
    FROM analytics_events
    WHERE DATE(created_at) = CURRENT_DATE
    GROUP BY session_id
)
SELECT 
    COUNT(*) as total_sessions,
    ROUND(AVG(duration_seconds)::numeric, 2) as avg_duration_seconds,
    ROUND((AVG(duration_seconds) / 60)::numeric, 2) as avg_duration_minutes
FROM session_times
WHERE duration_seconds > 0;


-- ============================================================================
-- 7. POPULAR PAGES - Most visited pages today
-- ============================================================================
SELECT 
    event_name,
    COUNT(*) as visits
FROM analytics_events
WHERE event_type = 'page_view'
AND DATE(created_at) = CURRENT_DATE
GROUP BY event_name
ORDER BY visits DESC
LIMIT 10;


-- ============================================================================
-- 8. CONVERSION FUNNEL - Today's checkout flow
-- ============================================================================
SELECT 
    event_name,
    COUNT(*) as occurrences
FROM analytics_events
WHERE event_name IN ('Add to Cart', 'Checkout Start', 'Checkout Step 2')
AND DATE(created_at) = CURRENT_DATE
GROUP BY event_name
ORDER BY 
    CASE event_name
        WHEN 'Add to Cart' THEN 1
        WHEN 'Checkout Start' THEN 2
        WHEN 'Checkout Step 2' THEN 3
    END;


-- ============================================================================
-- 9. HOURLY BREAKDOWN - Events by hour today
-- ============================================================================
SELECT 
    EXTRACT(HOUR FROM created_at) as hour,
    COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
    COUNT(CASE WHEN event_type = 'click' THEN 1 END) as clicks,
    COUNT(*) as total_events
FROM analytics_events
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;


-- ============================================================================
-- 10. UNIQUE VISITOR DETAILS - See individual visitors
-- ============================================================================
SELECT 
    persistent_id,
    ip_address,
    COUNT(*) as total_events,
    MIN(created_at) as first_visit,
    MAX(created_at) as last_visit,
    ARRAY_AGG(DISTINCT page_url) as pages_visited
FROM analytics_events
WHERE persistent_id IS NOT NULL
AND DATE(created_at) = CURRENT_DATE
GROUP BY persistent_id, ip_address
ORDER BY total_events DESC
LIMIT 20;


-- ============================================================================
-- 11. PRODUCT VIEWS - Most viewed products today
-- ============================================================================
SELECT 
    event_name as product_name,
    COUNT(*) as views,
    COUNT(DISTINCT persistent_id) as unique_viewers
FROM analytics_events
WHERE event_type = 'product_view'
AND DATE(created_at) = CURRENT_DATE
GROUP BY event_name
ORDER BY views DESC
LIMIT 10;


-- ============================================================================
-- 12. TRAFFIC SOURCE - Referrer analysis
-- ============================================================================
SELECT 
    CASE 
        WHEN referrer = '' OR referrer IS NULL THEN 'Direct'
        WHEN referrer LIKE '%google%' THEN 'Google'
        WHEN referrer LIKE '%facebook%' THEN 'Facebook'
        WHEN referrer LIKE '%twitter%' THEN 'Twitter'
        WHEN referrer LIKE '%instagram%' THEN 'Instagram'
        ELSE 'Other'
    END as traffic_source,
    COUNT(DISTINCT persistent_id) as unique_visitors,
    COUNT(*) as total_visits
FROM analytics_events
WHERE event_type = 'page_view'
AND DATE(created_at) = CURRENT_DATE
GROUP BY traffic_source
ORDER BY unique_visitors DESC;


-- ============================================================================
-- 13. MONTHLY SUMMARY - This month's stats
-- ============================================================================
SELECT 
    COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as total_page_views,
    COUNT(DISTINCT persistent_id) as unique_visitors,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(CASE WHEN event_name = 'Add to Cart' THEN 1 END) as cart_additions,
    COUNT(CASE WHEN event_type = 'click' THEN 1 END) as total_clicks
FROM analytics_events
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);


-- ============================================================================
-- 14. DAILY COMPARISON - Compare today vs yesterday
-- ============================================================================
SELECT 
    DATE(created_at) as date,
    COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
    COUNT(DISTINCT persistent_id) as unique_visitors,
    COUNT(DISTINCT session_id) as sessions
FROM analytics_events
WHERE DATE(created_at) IN (CURRENT_DATE, CURRENT_DATE - INTERVAL '1 day')
GROUP BY DATE(created_at)
ORDER BY date DESC;


-- ============================================================================
-- 15. CLEAN OLD DATA (Optional) - Remove events older than 90 days
-- ============================================================================
-- CAUTION: This permanently deletes old analytics data
-- Uncomment and run only if you want to clean old data

-- DELETE FROM analytics_events
-- WHERE created_at < NOW() - INTERVAL '90 days';


-- ============================================================================
-- 16. CHECK RLS POLICIES - Verify security is enabled
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'analytics_events';

-- Expected policies:
-- - Allow anonymous inserts (for tracking)
-- - Allow authenticated inserts (for logged-in users)
-- - Allow admins to read analytics (for dashboard)


-- ============================================================================
-- 17. TEST INSERT - Verify you can insert test data
-- ============================================================================
-- This should work even if not authenticated (anon role)
INSERT INTO analytics_events (
    session_id,
    persistent_id,
    ip_address,
    event_type,
    event_name,
    page_url,
    metadata
) VALUES (
    'test-session-' || gen_random_uuid()::text,
    'test-device-' || gen_random_uuid()::text,
    '127.0.0.1',
    'page_view',
    'Test Page',
    '/test',
    '{"test": true}'::jsonb
);

-- Verify the insert worked
SELECT * FROM analytics_events 
WHERE event_name = 'Test Page' 
ORDER BY created_at DESC 
LIMIT 1;

-- Clean up test data
DELETE FROM analytics_events WHERE event_name = 'Test Page';


-- ============================================================================
-- 18. PERFORMANCE TEST - Check query speed
-- ============================================================================
EXPLAIN ANALYZE
SELECT 
    event_type,
    COUNT(*) as count,
    COUNT(DISTINCT persistent_id) as unique_visitors
FROM analytics_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY event_type;

-- Look for "Index Scan" in the output - this means indexes are being used
-- If you see "Seq Scan", indexes might not be created properly


-- ============================================================================
-- 19. CONVERSION RATE CALCULATION - Match dashboard metrics
-- ============================================================================
WITH period_stats AS (
    SELECT 
        COUNT(DISTINCT persistent_id) as unique_visitors,
        COUNT(DISTINCT CASE WHEN event_name = 'Checkout Start' THEN session_id END) as checkout_starts
    FROM analytics_events
    WHERE DATE(created_at) = CURRENT_DATE
),
orders_today AS (
    SELECT COUNT(*) as completed_orders
    FROM orders
    WHERE DATE(created_at) = CURRENT_DATE
)
SELECT 
    p.unique_visitors,
    p.checkout_starts,
    o.completed_orders,
    CASE 
        WHEN p.unique_visitors > 0 
        THEN ROUND((o.completed_orders::numeric / p.unique_visitors::numeric) * 100, 1)
        ELSE 0 
    END as conversion_rate_percent
FROM period_stats p, orders_today o;


-- ============================================================================
-- 20. REAL-TIME ACTIVITY - Last 10 minutes
-- ============================================================================
SELECT 
    created_at,
    event_type,
    event_name,
    page_url,
    persistent_id,
    session_id
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
