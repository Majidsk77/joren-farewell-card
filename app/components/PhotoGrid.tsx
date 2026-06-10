"use client";

import { useState } from "react";

// ── Single photo with fallback ─────────────────────────────────────────────

interface PhotoProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
}

function Photo({ src, alt, style }: PhotoProps) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", ...style }}>
      {failed ? (
        <div className="photo-placeholder">📷</div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="photo-img"
          loading="lazy"
        />
      )}
    </div>
  );
}

// ── Editorial grid layouts ─────────────────────────────────────────────────

interface PhotoGridProps {
  photos: string[];
  name: string;
}

/**
 * Displays 1–5 photos in a magazine-editorial layout.
 * No tilts, no polaroid frames — just clean, well-composed grids.
 */
export default function PhotoGrid({ photos, name }: PhotoGridProps) {
  if (photos.length === 0) return null;
  const n = photos.length;

  // 1 photo — full bleed, cinematic ratio
  if (n === 1) {
    return (
      <Photo
        src={photos[0]}
        alt={`${name} — photo`}
        style={{ aspectRatio: "16/9", width: "100%" }}
      />
    );
  }

  // 2 photos — equal side-by-side
  if (n === 2) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {photos.map((src, i) => (
          <Photo
            key={i}
            src={src}
            alt={`${name} — photo ${i + 1}`}
            style={{ aspectRatio: "1/1" }}
          />
        ))}
      </div>
    );
  }

  // 3 photos — one tall left, two stacked right
  if (n === 3) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8, height: 260 }}>
        <Photo
          src={photos[0]}
          alt={`${name} — photo 1`}
          style={{ gridRow: "1 / 3", height: "100%" }}
        />
        <Photo src={photos[1]} alt={`${name} — photo 2`} style={{ height: "100%" }} />
        <Photo src={photos[2]} alt={`${name} — photo 3`} style={{ height: "100%" }} />
      </div>
    );
  }

  // 4 photos — 2×2 grid
  if (n === 4) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {photos.map((src, i) => (
          <Photo
            key={i}
            src={src}
            alt={`${name} — photo ${i + 1}`}
            style={{ aspectRatio: "4/3" }}
          />
        ))}
      </div>
    );
  }

  // 5 photos — one wide top, four below in 2×2
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Photo
        src={photos[0]}
        alt={`${name} — photo 1`}
        style={{ aspectRatio: "16/7", width: "100%" }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        {photos.slice(1).map((src, i) => (
          <Photo
            key={i}
            src={src}
            alt={`${name} — photo ${i + 2}`}
            style={{ aspectRatio: "1/1" }}
          />
        ))}
      </div>
    </div>
  );
}
