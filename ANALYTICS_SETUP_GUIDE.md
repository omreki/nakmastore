# Analytics System - Quick Setup Guide

## 🚀 Step 1: Run Database Migration

### Option A: Using Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy and paste the contents from `/server/update_analytics_schema.sql`
5. Click **Run** or press `Ctrl/Cmd + Enter`
6. Verify success message appears

### Option B: Using Supabase CLI
```bash
cd /Users/morrismbaabu/Documents/NAKMA/store
supabase db execute -f server/update_analytics_schema.sql
```

## ✅ Step 2: Verify Database Changes

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analytics_events' 
ORDER BY ordinal_position;

-- Check if indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'analytics_events';
```

You should see:
- ✅ `persistent_id` (TEXT)
- ✅ `ip_address` (TEXT)
- ✅ Multiple indexes including `analytics_events_persistent_id_idx`

## 📦 Step 3: Deploy Updated Code

The following files have been updated:
1. `/client/src/services/analyticsService.js` - Now tracks IP and persistent_id
2. `/server/update_analytics_schema.sql` - New migration

### Deploy to Production
```bash
cd /Users/morrismbaabu/Documents/NAKMA/store/client
npm run build
# Then deploy to Vercel/your hosting
```

Or if using Vercel CLI:
```bash
vercel --prod
```

## 🧪 Step 4: Test Analytics Tracking

### Test 1: Verify Page Views are Tracked
1. Open your website in a new **incognito/private window**
2. Navigate to: Home → Shop → Product Page → Cart
3. Go to Admin Dashboard → Analytics
4. Verify:
   - ✅ Total Visits increased by ~4 (one per page)
   - ✅ Unique Visitors increased by 1
   - ✅ Popular Pages shows your visited pages
   - ✅ Real-time Activity shows recent page views

### Test 2: Verify Unique Visitor Tracking
1. Open website in **different browsers** (Chrome, Firefox, Safari)
2. Visit the homepage in each browser
3. Check Admin Analytics:
   - ✅ Unique Visitors should equal number of different browsers used
   - ✅ Each browser should have a different `persistent_id` in database

### Test 3: Verify Session Duration
1. Open website in new incognito window
2. Browse for 2-3 minutes (click around, view products)
3. Check Admin Analytics:
   - ✅ "Avg. Time Spent" should show 2-3 minutes for that session

### Test 4: Verify Conversion Rate
1. Complete a full checkout flow (use test payment if needed)
2. Check Admin Analytics:
   - ✅ Conversion Rate should update
   - ✅ Formula: (Completed Orders / Unique Visitors) × 100

### Test 5: Verify Date Filtering
1. Go to Admin Analytics
2. Switch between filter types:
   - Daily → Should show hourly breakdown
   - Monthly → Should show daily breakdown  
   - Yearly → Should show monthly breakdown
   - Lifetime → Should show all-time data
3. Verify:
   - ✅ Charts update correctly
   - ✅ Stats recalculate
   - ✅ Data loads quickly (indexes working)

### Test 6: Real-Time Updates
1. Open Admin Analytics in one browser tab
2. Open your store in another incognito window
3. Browse around in the incognito window
4. Watch the Admin Analytics dashboard:
   - ✅ Should see real-time updates within seconds
   - ✅ "Real-time Activity" section should show new events
   - ✅ Charts should update automatically

## 🔍 Step 5: Database Verification

Run this query to see actual tracked data:

```sql
-- View recent analytics events
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
```

You should see:
- ✅ Different `persistent_id` for each unique device/browser
- ✅ Same `persistent_id` for repeat visits from same device
- ✅ Different `session_id` for each browser tab/session
- ✅ `ip_address` populated (or 'unknown' if fetch failed)

## 📊 Understanding the Metrics

### Total Visits
- **What**: Every time a page is loaded
- **Query**: Count of all `event_type = 'page_view'`
- **Example**: User visits Home, Shop, Product = 3 visits

### Unique Visitors
- **What**: Unique devices/browsers that visited
- **Tracked via**: 
  1. `persistent_id` (localStorage, survives sessions)
  2. `ip_address` (for additional validation)
- **Example**: Same user on Chrome + Firefox = 2 unique visitors

### Conversion Rate
- **What**: % of visitors who completed purchase
- **Formula**: (Completed Orders / Unique Visitors) × 100
- **Example**: 10 visitors, 2 orders = 20% conversion rate

### Avg. Time Spent
- **What**: Average session duration per user
- **Calculation**: 
  1. Track first and last event per session
  2. Calculate duration for each session
  3. Average all session durations
- **Example**: 3 sessions (60s, 120s, 180s) = 120s average

## 🐛 Troubleshooting

### Issue: No events being tracked
**Solution**: 
1. Check browser console for errors
2. Verify `analytics_events` table exists
3. Check RLS policies allow INSERT

### Issue: Unique visitors = Total visits
**Solution**:
1. Verify `persistent_id` column exists
2. Check if localStorage is enabled
3. Clear browser data and test again

### Issue: IP address shows 'unknown'
**Solution**:
1. Check internet connection
2. Verify ipify.org is accessible
3. This is non-critical, system works without it

### Issue: Real-time not working
**Solution**:
1. Check Supabase Realtime is enabled for `analytics_events` table
2. Verify browser doesn't block WebSocket connections
3. Check Supabase project settings → Realtime

### Issue: Slow query performance
**Solution**:
1. Verify indexes were created (Step 2)
2. Run `VACUUM ANALYZE analytics_events;` in SQL Editor
3. Consider partitioning if you have millions of rows

## 📈 What Gets Tracked Automatically

The system automatically tracks:

✅ **Page Views**
- Every route change
- Includes page URL and referrer

✅ **Product Views**
- When user opens product detail page
- Includes product name, ID, category, price

✅ **Cart Actions**
- Add to cart
- Remove from cart
- Includes product details and quantity

✅ **Checkout Events**
- Checkout started
- Checkout step progress

✅ **Link Clicks**
- All link clicks throughout site
- Includes link text and destination URL

✅ **Custom Interactions**
- Any element with `data-track` attribute
- Example: `<button data-track="CTA Button">Click Me</button>`

## 🎯 Next Steps

1. Run the migration (Step 1)
2. Deploy updated code (Step 3)
3. Test tracking (Step 4)
4. Monitor analytics daily
5. Use insights to optimize:
   - Popular pages → Create more similar content
   - Abandoned carts → Send recovery emails
   - Low conversion pages → Improve UX
   - High bounce pages → Fix issues

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review `/ANALYTICS_IMPLEMENTATION.md` for technical details
3. Check browser console for JavaScript errors
4. Review Supabase logs for database errors
