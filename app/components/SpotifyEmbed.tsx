"use client";

import { useState } from "react";

interface SpotifyEmbedProps {
  embedUrl: string;
  label?: string;
  /** Skip the toggle and render the iframe directly (used in card view) */
  alwaysOpen?: boolean;
}

const SpotifyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.36-.66.48-1.021.24-2.82-1.74-6.36-2.1-10.561-1.14-.418.12-.779-.18-.899-.54-.12-.42.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.18.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.3.421-1.02.599-1.559.3z" />
  </svg>
);

const Iframe = ({ src }: { src: string }) => (
  <iframe
    src={src}
    width="100%"
    height="80"
    frameBorder="0"
    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    loading="lazy"
    style={{ borderRadius: 12, display: "block" }}
    title="Spotify track"
  />
);

export default function SpotifyEmbed({ embedUrl, label, alwaysOpen = false }: SpotifyEmbedProps) {
  const [open, setOpen] = useState(false);

  // Card view: render embed directly, no toggle
  if (alwaysOpen) {
    return (
      <div style={{ borderRadius: 12, overflow: "hidden" }}>
        <Iframe src={embedUrl} />
      </div>
    );
  }

  // Contribute form preview: toggle
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`spotify-btn ${open ? "spotify-btn-on" : ""}`}
        aria-expanded={open}
      >
        <SpotifyIcon />
        <span>{open ? "Hide song" : (label ?? "Play song")}</span>
      </button>

      {open && (
        <div style={{ marginTop: "0.75rem", borderRadius: 12, overflow: "hidden" }}>
          <Iframe src={embedUrl} />
        </div>
      )}
    </div>
  );
}
