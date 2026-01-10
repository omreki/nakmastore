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

        // Fetch settings: resend_config
        const { data: settings, error: settingsError } = await supabaseClient
            .from("store_settings")
            .select("resend_config")
            .single();

        if (settingsError) {
            console.error("Settings fetch error:", settingsError);
            throw new Error(`Failed to fetch settings: ${settingsError.message}`);
        }



        // Parse request
        const { to, subject, html } = await req.json();

        if (!to || !subject || !html) {
            throw new Error("Missing required fields: to, subject, html");
        }

        // 1. Determine Resend API Key
        // Priority: DB Config -> Env Var
        const dbResendKey = settings?.resend_config?.apiKey;
        const envResendKey = Deno.env.get("RESEND_API_KEY");
        const resendApiKey = dbResendKey || envResendKey;

        if (!resendApiKey) {
            throw new Error("Resend API Key not configured (neither in DB nor Environment)");
        }

        // 2. Determine Sender Email
        // Priority: DB Config (fromEmail) -> Default
        const dbFromEmail = settings?.resend_config?.fromEmail;
        const fromEmail = dbFromEmail || "NOESIS Store <info@shop.wearnoesis.com>";

        // Handle 'to' being string or array
        const recipients = Array.isArray(to) ? to : [to];

        console.log(`Sending via Resend to: ${recipients.join(', ')}`);
        console.log(`From: ${fromEmail}`);

        // Send email via Resend API
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: fromEmail,
                to: recipients,
                subject,
                html,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Resend API error:", data);
            throw new Error(`Resend API error: ${JSON.stringify(data)}`);
        }

        console.log("Email sent successfully via Resend. ID:", data.id);

        return new Response(
            JSON.stringify({
                success: true,
                messageId: data.id,
                message: "Email sent successfully via Resend",
                provider: "resend"
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
