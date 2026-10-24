import CineNovaApp from "@/components/CineNovaApp";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getPublishedTitles() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return [];
  try {
    const { data } = await createClient()
      .from("titles")
      .select("id,title,kind,year,genre,synopsis,poster_url,backdrop_url,rating,featured")
      .eq("published", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const titles = await getPublishedTitles();
  return <CineNovaApp initialTitles={titles} />;
}
