"use client";

import { useState } from "react";

interface PolaroidProps {
  src: string;
  alt: string;
  rotate?: number;
  /** Used as fallback placeholder background */
  accentColor?: string;
  /** Shown under the photo frame (optional caption) */
  caption?: string;
  size?: "sm" | "md";
}

/**
 * A polaroid-style photo frame. If the image fails to load (e.g. placeholder
 * paths that don't exist yet), a pretty 📷 placeholder is shown instead.
 *
 * To add real photos: drop files into /public/photos/ and update the
 * `photos` array in app/data/friends.ts.
 */
export default function Polaroid({
  src,
  alt,
  rotate = 0,
  accentColor = "#EDE0CE",
  caption,
  size = "sm",
}: PolaroidProps) {
  const [failed, setFailed] = useState(false);

  const w = size === "md" ? 148 : 118;
  const h = size === "md" ? 128 : 100;

  return (
    <div
      className="polaroid"
      style={{ transform: `rotate(${rotate}deg)` }}
      title={alt}
    >
      {failed ? (
        /* ── Placeholder shown when the image file doesn't exist yet ── */
        <div
          className="flex flex-col items-center justify-center gap-1"
          style={{ width: w, height: h, backgroundColor: accentColor }}
        >
          <span style={{ fontSize: 28 }}>📷</span>
          <span
            style={{
              fontSize: 9,
              color: "#9A8A7A",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            add photo
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          style={{ width: w, height: h, display: "block", objectFit: "cover" }}
          loading="lazy"
        />
      )}

      {caption && (
        <p
          style={{
            fontFamily: "var(--font-handwriting), cursive",
            fontSize: 11,
            color: "#7A6A5A",
            textAlign: "center",
            position: "absolute",
            bottom: 5,
            left: 0,
            right: 0,
          }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
