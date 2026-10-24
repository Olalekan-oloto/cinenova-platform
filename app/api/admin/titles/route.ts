import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const title = String(body.title || "").trim();
  const kind = body.kind === "Series" ? "Series" : "Movie";
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const { error } = await sb.from("titles").insert({
    title, kind,
    year: Number.isInteger(body.year) ? body.year : null,
    genre: Array.isArray(body.genre) ? body.genre.map(String) : [],
    synopsis: text(body.synopsis), poster_url: text(body.poster_url), backdrop_url: text(body.backdrop_url), playback_url: text(body.playback_url),
    published: body.published === true, created_by: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
