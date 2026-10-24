import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request:Request){
 const url=new URL(request.url);const reference=url.searchParams.get("reference");if(!reference)return NextResponse.redirect(new URL("/account?payment=missing",url.origin));
 const secret=process.env.PAYSTACK_SECRET_KEY;if(!secret)return NextResponse.redirect(new URL("/account?payment=not_configured",url.origin));
 try{
  const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`},cache:"no-store"});const result=await response.json();
  if(!response.ok||!result.status||result.data.status!=="success")return NextResponse.redirect(new URL("/account?payment=failed",url.origin));
  const metadata=result.data.metadata||{};const userId=metadata.user_id;const plan=metadata.plan;
  if(!userId||!["Basic","Standard","Premium"].includes(plan))return NextResponse.redirect(new URL("/account?payment=unmatched",url.origin));
  // This server route uses the logged-in user's Supabase session; if the browser session expired,
  // the payment is verified but the subscription row is not written. Use the webhook in SETUP.md for production.
  const sb=createClient();const {data:{user}}=await sb.auth.getUser();
  if(user?.id===userId){await sb.from("subscriptions").upsert({user_id:userId,plan,status:"active",provider:"paystack",provider_reference:reference,amount_minor:result.data.amount,currency:result.data.currency},{onConflict:"provider_reference"});}
  return NextResponse.redirect(new URL(`/account?payment=success`,url.origin));
 }catch{return NextResponse.redirect(new URL("/account?payment=error",url.origin));}
}