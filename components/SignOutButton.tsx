 "use client";
import { createClient } from "@/lib/supabase/client";
export default function SignOutButton(){return <button className="btn ghost" onClick={async()=>{await createClient().auth.signOut();location.href="/";}}>Sign out</button>}