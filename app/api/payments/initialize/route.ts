import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Starter NGN amounts in kobo (see SETUP.md section 6). Not derived from the USD display prices.
const planAmounts: Record<string, number> = { Basic: 289000, Standard: 577000, Premium: 889000 };

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Please sign in before choosing a plan." }, { status: 401 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const plan = String(body.plan || "");
  const amount = planAmounts[plan];
  if (!amount) return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, amount, currency: "NGN", callback_url: `${origin}/api/payments/verify`, metadata: { user_id: user.id, plan } }),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || !result.status) return NextResponse.json({ error: result.message || "Could not start checkout." }, { status: 502 });
    return NextResponse.json({ authorization_url: result.data.authorization_url });
  } catch {
    return NextResponse.json({ error: "Could not reach the payment provider." }, { status: 502 });
  }
}
