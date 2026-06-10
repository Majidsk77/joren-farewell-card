import { notFound } from "next/navigation";
import ContributeForm from "./ContributeForm";
import { groupMessage } from "@/app/data/friends";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ secret: string }>; }

export default async function ContributePage({ params }: Props) {
  const { secret } = await params;
  if (!process.env.CONTRIBUTE_SECRET || secret !== process.env.CONTRIBUTE_SECRET) notFound();

  const recipientName = groupMessage.recipientName;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-light)" }}>

      {/* ── Top bar ── */}
      <div style={{
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        backgroundColor: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <span style={{ fontSize: 20 }}>✍️</span>
        <span style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "var(--text-primary)",
        }}>
          Add your card for {recipientName}
        </span>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.25rem 5rem" }}>

        <div style={{ marginBottom: "2.5rem", maxWidth: 560 }}>
          <h1 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(2rem, 6vw, 2.8rem)",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.15,
            marginBottom: "0.6rem",
          }}>
            A message for {recipientName}
          </h1>
          <p style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.9375rem",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}>
            Add your note, some photos, and a song. Preview how it looks, then send it when you&apos;re happy.
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.9)",
          borderRadius: 20,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
          padding: "2rem 1.75rem",
        }}>
          <ContributeForm recipientName={recipientName} />
        </div>

        <p style={{
          textAlign: "center",
          marginTop: "1.25rem",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          fontFamily: "var(--font-inter)",
        }}>
          Your card will be reviewed before it appears publicly.
        </p>
      </div>
    </main>
  );
}
