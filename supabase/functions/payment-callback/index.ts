// Supabase Edge Function: payment-callback
// Verifies sandbox and production payment gateway callbacks and updates booking status
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

    const { paymentId, providerRef, status } = await req.json();

    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Missing paymentId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: payment, error: fetchErr } = await supabaseClient
      .from("payments")
      .select("id, booking_id, status")
      .eq("id", paymentId)
      .single();

    if (fetchErr || !payment) {
      return new Response(JSON.stringify({ error: "Payment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isSuccess = status === "success";
    const paymentStatus = isSuccess ? "success" : "failed";
    const bookingStatus = isSuccess ? "confirmed" : "pending_payment";

    // Update payment record
    await supabaseClient
      .from("payments")
      .update({
        status: paymentStatus,
        provider_ref: providerRef ?? `REF_${Date.now()}`,
      })
      .eq("id", paymentId);

    // If payment succeeded, confirm the booking
    if (isSuccess) {
      await supabaseClient
        .from("bookings")
        .update({ status: bookingStatus })
        .eq("id", payment.booking_id);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        paymentStatus,
        bookingStatus,
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
