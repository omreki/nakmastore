# Alternative Email Solution: Resend

## The Problem
Supabase Edge Functions (and most serverless platforms) **block or restrict outbound SMTP connections** on ports 25, 465, and 587 to prevent spam abuse. This is why our NOESIS store cannot currently send emails using direct SMTP.

**Errors encountered:**
- Port 465: "Connection timeout"
- Port 587: "Greeting never received"

Both indicate network-level blocking of SMTP connections.

## Recommended Solution: Resend

**Resend** is a modern email API built for developers and serverless environments. It's the perfect replacement for direct SMTP.

### Why Resend?
✅ **Serverless-friendly** - Works perfectly with Edge Functions  
✅ **Generous free tier** - 3,000 emails/month, 100 emails/day  
✅ **Simple API** - One API call to send emails  
✅ **Better deliverability** - Professional infrastructure  
✅ **No port blocking** - Uses HTTPS API instead of SMTP  
✅ **Great for e-commerce** - Order confirmations, notifications, etc.

### Setup (5 minutes)

#### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up for free (no credit card required)
3. Verify your email address

#### Step 2: Add Your Domain (Optional but Recommended)
1. Go to "Domains" in Resend dashboard
2. Add `wearnoesis.com`
3. Add the DNS records shown (SPF, DKIM, etc.)
4. Wait for verification (usually takes a few minutes)

**Note:** Without domain verification, emails will come from `onboarding@resend.dev`

#### Step 3: Get API Key
1. Go to "API Keys" in Resend dashboard
2. Create new API key
3. Name it "NOESIS Store"
4. Copy the key (starts with `re_`)

#### Step 4: Update Edge Function

Replace the current `send-email` function with this Resend-based version:

\`\`\`typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch settings to check if emails are enabled
    const { data: settings, error: settingsError } = await supabaseClient
      .from("store_settings")
      .select("email_notifications_enabled, smtp_from, support_email")
      .single();

    if (settingsError) {
      throw new Error(`Failed to fetch settings: ${settingsError.message}`);
    }

    if (!settings?.email_notifications_enabled) {
      return new Response(
        JSON.stringify({ message: "Email notifications are disabled." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Parse request
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      throw new Error("Missing required fields: to, subject, html");
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: settings.smtp_from || "NOESIS Store <sales@wearnoesis.com>",
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(data)}`);
    }

    console.log("Email sent successfully:", data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: data.id,
        message: "Email sent successfully" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
\`\`\`

#### Step 5: Add Environment Variable in Supabase
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions
3. Add secret: `RESEND_API_KEY` = `re_YourActualKey`

#### Step 6: Deploy & Test
Deploy the updated function and test!

### Cost Comparison

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| **Resend** | 3,000/month | $20/month for 50k emails |
| SendGrid | 100/day | $20/month for 60k emails |
| Postmark | 100/month | $10/month for 10k emails |
| Direct SMTP | Free | Doesn't work 😞 |

### Benefits for NOESIS Store

1. **Reliable delivery** - No more connection timeouts
2. **Email analytics** - Track opens, clicks, bounces
3. **Professional sender** - Better inbox placement
4. **Scalable** - Handle traffic spikes easily
5. **Modern stack** - API-based, cloud-native

## Alternative Options (if you don't want Resend)

### Option 1: SendGrid
- Very popular, great documentation
- Free: 100 emails/day permanently
- Setup: Similar to Resend (API key + environment variable)

### Option 2: Postmark  
- Excellent deliverability
- Free: 100 emails/month
- Setup: API key-based

### Option 3: Amazon SES
- Most cost-effective at scale
- $0.10 per 1,000 emails
- More complex setup (AWS credentials)

## What About SMTP?

Direct SMTP connections from Edge Functions are **not recommended** because:
- Most cloud platforms block them
- Unreliable in serverless environments
- Harder to debug
- Poor deliverability (emails often go to spam)
- No analytics or tracking

Modern transactional email services are the industry standard for a reason!

## Next Steps

1. **Choose a service** (I recommend Resend)
2. **Sign up** and get API key
3. **Let me know** - I'll update the Edge Function for you
4. **Test** - Send a test email
5. **Celebrate** 🎉 - Working emails!

---
*Ready to switch to Resend? Just say "update to Resend" and I'll implement it!*
