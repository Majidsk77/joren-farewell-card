"use client";

import { useState } from "react";
import SpotifyEmbed from "./SpotifyEmbed";
import type { Card } from "@/lib/supabase/types";
import { getTheme } from "@/lib/themes";

// ── Inline photo with graceful fallback ───────────────────────────────────

function Photo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      loading="lazy"
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

// ── Multiple photos — compact horizontal strip ────────────────────────────

function PhotoStrip({ urls, name }: { urls: string[]; name: string }) {
  const show = urls.slice(0, 4);
  const cols = Math.min(show.length, 4);
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 6,
      borderRadius: 10,
      overflow: "hidden",
    }}>
      {show.map((src, i) => (
        <div key={i} style={{ aspectRatio: "1/1" }}>
          <Photo src={src} alt={`${name} — photo ${i + 1}`} />
        </div>
      ))}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────

interface FriendCardProps {
  card: Card;
  index: number;
}

export default function FriendCard({ card, index }: FriendCardProps) {
  const photoUrls = Array.isArray(card.photo_urls) ? card.photo_urls : [];
  const hasSinglePhoto   = photoUrls.length === 1;
  const hasMultiplePhotos = photoUrls.length > 1;
  const photoRight = index % 2 === 0;
  const theme = getTheme(card.theme);

  return (
    <article
      style={{
        backgroundColor: theme.bg,
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 16,
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        // Subtle lift on hover — no glass, just a clean shadow
        transition: "box-shadow 0.25s cubic-bezier(0.16,1,0.3,1), transform 0.25s cubic-bezier(0.16,1,0.3,1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >

      {/* ── Main row: message + single photo side-by-side ─── */}
      <div
        className="card-row"
        style={{ flexDirection: photoRight ? "row" : "row-reverse" }}
      >
        {/* Message */}
        <p style={{
          flex: 1,
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "0.9rem",
          lineHeight: 1.75,
          color: "#2a2a2a",
          margin: 0,
        }}>
          {card.message}
        </p>

        {/* Single photo */}
        {hasSinglePhoto && (
          <div className="card-photo-side">
            <Photo src={photoUrls[0]} alt={card.name} />
          </div>
        )}
      </div>

      {/* ── Multiple photos ──────────────────────────────── */}
      {hasMultiplePhotos && (
        <PhotoStrip urls={photoUrls} name={card.name} />
      )}

      {/* ── Spotify embed (always visible, no toggle) ───── */}
      {card.spotify_url && (
        <SpotifyEmbed embedUrl={card.spotify_url} alwaysOpen />
      )}

      {/* ── Name attribution — no avatar ─────────────────── */}
      <div style={{
        paddingTop: "0.875rem",
        borderTop: `1px solid ${theme.accent}33`,
        display: "flex",
        alignItems: "baseline",
        gap: "0.4rem",
      }}>
        <span style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "#111",
        }}>
          {card.name}
        </span>
        {card.relationship && (
          <span style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.8rem",
            color: "#999",
          }}>
            · {card.relationship}
          </span>
        )}
      </div>
    </article>
  );
}
