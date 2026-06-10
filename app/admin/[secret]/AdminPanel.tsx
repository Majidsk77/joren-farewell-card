"use client";

import { useTransition, useState } from "react";
import type { Card } from "@/lib/supabase/types";

interface AdminPanelProps {
  pending:  Card[];
  approved: Card[];
  approveAction: (id: string) => Promise<void>;
  deleteAction:  (id: string) => Promise<void>;
}

export default function AdminPanel({ pending, approved, approveAction, deleteAction }: AdminPanelProps) {
  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "3rem" }}>
        <StatChip label="Pending"  value={pending.length}  color="#f59e0b" />
        <StatChip label="Approved" value={approved.length} color="#10b981" />
        <StatChip label="Total"    value={pending.length + approved.length} color="rgba(255,255,255,0.4)" />
      </div>

      <Section title="Pending Approval" count={pending.length} accent="#f59e0b">
        {pending.length === 0
          ? <EmptyNote>Nothing pending — you&apos;re all caught up ✅</EmptyNote>
          : pending.map((c) => (
            <CardRow key={c.id} card={c} showApprove onApprove={() => approveAction(c.id)} onDelete={() => deleteAction(c.id)} />
          ))
        }
      </Section>

      <Section title="Approved" count={approved.length} accent="#10b981">
        {approved.length === 0
          ? <EmptyNote>No approved cards yet.</EmptyNote>
          : approved.map((c) => (
            <CardRow key={c.id} card={c} onDelete={() => deleteAction(c.id)} />
          ))
        }
      </Section>
    </div>
  );
}

// ── Card row ──────────────────────────────────────────────────────────────

function CardRow({ card, showApprove, onApprove, onDelete }: {
  card: Card;
  showApprove?: boolean;
  onApprove?: () => Promise<void>;
  onDelete:  () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleApprove = () => startTransition(async () => { await onApprove?.(); });
  const handleDelete  = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startTransition(async () => { await onDelete(); });
  };

  const date = new Date(card.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: "1.25rem 1.5rem",
      marginBottom: "0.75rem",
      opacity: isPending ? 0.45 : 1,
      transition: "opacity 0.2s",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: "1rem",
    }}>
      {/* Left */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.3rem" }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: "1.15rem", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
            {card.name}
          </span>
          {card.relationship && (
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-inter)" }}>
              · {card.relationship}
            </span>
          )}
        </div>

        <p style={{
          fontFamily: "var(--font-inter)",
          fontSize: "0.825rem",
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.55,
          marginBottom: "0.6rem",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {card.message}
        </p>

        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <Pill>{card.theme}</Pill>
          {card.photo_urls.length > 0 && <Pill>📷 {card.photo_urls.length}</Pill>}
          {card.spotify_url && <Pill>♫</Pill>}
          <Pill>{date}</Pill>
        </div>
      </div>

      {/* Right — actions */}
      <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, flexWrap: "wrap" }}>
        {showApprove && (
          <ActionBtn onClick={handleApprove} disabled={isPending} color="#10b981">
            Approve
          </ActionBtn>
        )}
        {confirmDelete ? (
          <>
            <ActionBtn onClick={handleDelete} disabled={isPending} color="#ef4444">Confirm</ActionBtn>
            <ActionBtn onClick={() => setConfirmDelete(false)} disabled={isPending} color="rgba(255,255,255,0.15)">Cancel</ActionBtn>
          </>
        ) : (
          <ActionBtn onClick={() => setConfirmDelete(true)} disabled={isPending} color="rgba(255,255,255,0.1)">
            Delete
          </ActionBtn>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function Section({ title, count, accent, children }: {
  title: string; count: number; accent: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "3rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
        <h2 style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "0.8125rem",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.45)",
        }}>
          {title}
        </h2>
        <span style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          fontFamily: "var(--font-inter)",
          backgroundColor: accent,
          color: "#000",
          borderRadius: 9999,
          padding: "0.1rem 0.5rem",
        }}>
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "1rem 1.5rem",
      minWidth: 90,
      textAlign: "center",
    }}>
      <div style={{ fontFamily: "var(--font-playfair)", fontSize: "2rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-inter)",
      fontSize: "0.7rem",
      color: "rgba(255,255,255,0.35)",
      background: "rgba(255,255,255,0.06)",
      borderRadius: 9999,
      padding: "0.15rem 0.5rem",
    }}>
      {children}
    </span>
  );
}

function ActionBtn({ children, onClick, disabled, color }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "0.4rem 0.85rem",
        borderRadius: 9999,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-inter)",
        fontSize: "0.8rem",
        fontWeight: 500,
        color: color.startsWith("rgba") ? "rgba(255,255,255,0.6)" : "#fff",
        background: color,
        transition: "opacity 0.15s",
        opacity: disabled ? 0.4 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      textAlign: "center",
      padding: "2rem",
      color: "rgba(255,255,255,0.25)",
      fontFamily: "var(--font-inter)",
      fontSize: "0.875rem",
    }}>
      {children}
    </p>
  );
}
