import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const paymentMessages: Record<string, string> = {
  success: "Payment verified. Your membership will appear below once it is recorded.",
  failed: "The payment could not be verified. You have not been charged twice — please try again.",
  missing: "No payment reference was returned.",
  unmatched: "The payment could not be matched to a plan on your account.",
  not_configured: "Payments are not configured yet.",
  error: "Something went wrong while verifying the payment.",
};

export default async function AccountPage({ searchParams }: { searchParams: { payment?: string } }) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    sb.from("profiles").select("display_name,role").eq("id", user.id).maybeSingle(),
    sb.from("subscriptions").select("plan,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
  ]);
  const sub = subscriptions?.[0];
  const notice = searchParams.payment ? paymentMessages[searchParams.payment] : null;
  return <main className="accountPage">
    <header className="nav"><Link href="/" className="brand"><span className="brandIcon">✦</span>CINE<span>NOVA</span></Link><div className="navActions">{profile?.role === "admin" && <Link href="/admin" className="btn ghost">Admin</Link>}<SignOutButton /></div></header>
    <section className="accountCard">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h1>Hello{profile?.display_name ? `, ${profile.display_name}` : ""}.</h1>
      <p>Signed in as {user.email}</p>
      {notice && <p className="formMessage">{notice}</p>}
      <div className="accountInfo">
        <h2>Membership</h2>
        {sub ? <p>{sub.plan} · {sub.status}</p> : <p className="muted">No active membership yet. Choose a plan to get started.</p>}
      </div>
      <Link href="/#plans" className="btn primary">View plans</Link>
    </section>
  </main>;
}
