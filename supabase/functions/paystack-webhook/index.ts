import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload = await req.json();
        const { event, data } = payload;

        console.log(`Received Paystack event: ${event}`);

        if (event === "charge.success") {
            const { reference, status, amount } = data;

            console.log(`Processing successful payment. Reference: ${reference}, Status: ${status}`);

            // Find the order by payment_reference
            const { data: order, error: findError } = await supabaseClient
                .from("orders")
                .select("id, status, payment_status, customer_id")
                .eq("payment_reference", reference)
                .single();

            if (findError || !order) {
                console.error(`Order not found for reference: ${reference}`);
                return new Response(JSON.stringify({ error: "Order not found" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 404,
                });
            }

            // Update order and process business logic if not already paid
            if (order.payment_status !== "Paid") {
                // 1. Update Order Status
                const { error: updateError } = await supabaseClient
                    .from("orders")
                    .update({
                        payment_status: "Paid",
                        status: "Processing",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", order.id);

                if (updateError) {
                    throw new Error(`Failed to update order: ${updateError.message}`);
                }

                console.log(`Order ${order.id} marked as Paid via Webhook`);

                // 2. Process Stock Decrement
                const { data: items, error: itemsError } = await supabaseClient
                    .from("order_items")
                    .select("product_id, variation_id, quantity")
                    .eq("order_id", order.id);

                if (!itemsError && items) {
                    for (const item of items) {
                        if (item.variation_id) {
                            await supabaseClient.rpc('decrement_variation_stock', { var_id: item.variation_id, qty: item.quantity });
                        }
                        await supabaseClient.rpc('decrement_product_stock', { prod_id: item.product_id, qty: item.quantity });
                    }
                    console.log(`Stock decremented for order ${order.id}`);
                }

                // 3. Trigger Notifications (Optional: Could call send-email function here)
                // For now, we rely on the frontend or a separate trigger to avoid duplicating template logic
            } else {
                console.log(`Order ${order.id} is already marked as Paid.`);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("Webhook Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
