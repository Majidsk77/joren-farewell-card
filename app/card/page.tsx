import { createAnonClient } from "@/lib/supabase/server";
import Hero from "@/app/components/Hero";
import CardGrid from "@/app/components/CardGrid";
import GroupMessage from "@/app/components/GroupMessage";
import type { Card } from "@/lib/supabase/types";

// Revalidate every 60 s so approved cards appear without a full redeploy
export const revalidate = 60;

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function CardPage() {
  let cards: Card[] = [];

  if (supabaseConfigured) {
    try {
      const supabase = createAnonClient();
      const { data } = await supabase
        .from("cards")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: true });
      cards = (data ?? []) as Card[];
    } catch (err) {
      console.error("CardPage: failed to fetch cards", err);
    }
  }

  return (
    <main>
      <Hero />

      {!supabaseConfigured && <SetupBanner />}

      {/* Always render the grid — it handles the empty state internally */}
      <CardGrid cards={cards} />

      <GroupMessage names={cards.map((c) => c.name)} />
    </main>
  );
}

function SetupBanner() {
  return (
    <div style={{
      backgroundColor: "#FFF8E7",
      border: "1px solid rgba(201,160,94,0.4)",
      borderRadius: 14,
      padding: "1rem 1.5rem",
      margin: "0 auto 2rem",
      maxWidth: 700,
      fontFamily: "var(--font-serif), Georgia, serif",
      fontSize: "0.875rem",
      color: "#7A5A2A",
      lineHeight: 1.6,
    }}>
      <strong>⚙️ Supabase not connected.</strong> Copy{" "}
      <code style={{ backgroundColor: "rgba(0,0,0,0.07)", padding: "0 4px", borderRadius: 4 }}>.env.local.example</code>{" "}
      to{" "}
      <code style={{ backgroundColor: "rgba(0,0,0,0.07)", padding: "0 4px", borderRadius: 4 }}>.env.local</code>{" "}
      and fill in your Supabase credentials. Run the SQL in{" "}
      <code style={{ backgroundColor: "rgba(0,0,0,0.07)", padding: "0 4px", borderRadius: 4 }}>supabase/schema.sql</code>{" "}
      to create the table, then restart the dev server.
    </div>
  );
}
