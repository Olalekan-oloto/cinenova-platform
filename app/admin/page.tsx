import Link from "next/link";
import { redirect } from "next/navigation";
import AdminForm from "@/components/AdminForm";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/account");
  const { data: titles } = await sb.from("titles").select("id,title,kind,year,published").order("created_at", { ascending: false });
  return <main className="adminPage">
    <header className="nav"><Link href="/" className="brand"><span className="brandIcon">✦</span>CINE<span>NOVA</span></Link><div className="navActions"><Link href="/account" className="btn ghost">Account</Link><SignOutButton /></div></header>
    <section className="adminWrap">
      <p className="eyebrow">ADMIN</p>
      <h1>Catalogue</h1>
      <p>Add titles you are licensed to distribute. Only published titles appear on the public homepage.</p>
      <AdminForm />
      <h2>Existing titles</h2>
      {titles?.length ? <div className="adminList">{titles.map(t => <div key={t.id}><span>{t.title}<small>{t.kind}{t.year ? ` · ${t.year}` : ""}</small></span><span>{t.published ? "Published" : "Draft"}</span></div>)}</div> : <p>No titles yet.</p>}
    </section>
  </main>;
}
