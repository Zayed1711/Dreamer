// Supabase Edge Function: create-payment
// Generates sandbox payment requests for bKash, Nagad, and SSLCommerz
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { bookingId, provider, amountBdt } = await req.json();

    if (!bookingId || !provider || amountBdt === undefined) {
      return new Response(JSON.stringify({ error: "Missing required booking details" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify booking exists
    const { data: booking, error: bookingErr } = await supabaseClient
      .from("bookings")
      .select("id, session_id, student_id, status")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record pending payment on server
    const { data: payment, error: payErr } = await supabaseClient
      .from("payments")
      .insert({
        booking_id: bookingId,
        provider,
        amount_bdt: amountBdt,
        status: "pending",
        provider_ref: `SANDBOX_${provider.toUpperCase()}_${Date.now()}`,
      })
      .select()
      .single();

    if (payErr) {
      return new Response(JSON.stringify({ error: payErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return sandbox checkout payload
    return new Response(
      JSON.stringify({
        paymentId: payment.id,
        provider,
        amountBdt,
        sandbox: true,
        redirectUrl: `/sessions/callback?paymentId=${payment.id}&status=success`,
        message: "Payment initiated in sandbox mode.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
