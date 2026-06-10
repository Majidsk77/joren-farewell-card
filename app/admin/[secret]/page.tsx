import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { approveCard, deleteCard } from "@/app/actions/cards";
import AdminPanel from "./AdminPanel";
import type { Card } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ secret: string }>; }

export default async function AdminPage({ params }: Props) {
  const { secret } = await params;
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) notFound();

  const supabase = createAdminClient();
  const { data: allCards = [] } = await supabase
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });

  const cards   = (allCards ?? []) as Card[];
  const pending  = cards.filter((c) => !c.approved);
  const approved = cards.filter((c) =>  c.approved);

  const boundApprove = approveCard.bind(null, secret);
  const boundDelete  = deleteCard.bind(null, secret);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0f0e14", color: "rgba(255,255,255,0.88)" }}>

      {/* ── Header ── */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "1.25rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            fontFamily: "var(--font-inter)",
          }}>
            Admin
          </span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "1.2rem",
            color: "rgba(255,255,255,0.88)",
          }}>
            Farewell Card
          </span>
        </div>

        <Link
          href="/card"
          style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.8125rem",
            color: "rgba(255,255,255,0.5)",
            textDecoration: "none",
            padding: "0.4rem 0.9rem",
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.1)",
            transition: "color 0.2s, border-color 0.2s",
          }}
        >
          View public card →
        </Link>
      </header>

      {/* ── Panel ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2.5rem 1.25rem" }}>
        <AdminPanel
          pending={pending}
          approved={approved}
          approveAction={boundApprove}
          deleteAction={boundDelete}
        />
      </div>
    </main>
  );
}
