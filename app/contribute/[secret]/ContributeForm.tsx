"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitCard, type ActionState } from "@/app/actions/cards";
import { THEMES, type ThemeKey } from "@/lib/themes";
import { toSpotifyEmbed } from "@/lib/spotify";
import FriendCard from "@/app/components/FriendCard";
import type { Card } from "@/lib/supabase/types";

// ─────────────────────────────────────────────────────────────────────────────
// Submit button — reads pending from form context
// ─────────────────────────────────────────────────────────────────────────────
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: "100%",
        padding: "0.9rem",
        borderRadius: 14,
        border: "none",
        cursor: pending ? "not-allowed" : "pointer",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontSize: "0.9375rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        color: "#fff",
        background: pending
          ? "rgba(124,58,237,0.4)"
          : "linear-gradient(135deg, #7c3aed, #db2777)",
        transition: "opacity 0.2s, transform 0.15s",
      }}
    >
      {pending ? "Sending…" : "Submit this card →"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success screen
// ─────────────────────────────────────────────────────────────────────────────
function SuccessView() {
  return (
    <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <div style={{ fontSize: 56, marginBottom: "1rem" }}>🎉</div>
      <h2 style={{
        fontFamily: "var(--font-playfair), Georgia, serif",
        fontSize: "2rem",
        fontWeight: 700,
        color: "var(--text-primary)",
        marginBottom: "0.75rem",
      }}>
        Card received!
      </h2>
      <p style={{
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontSize: "1rem",
        color: "var(--text-secondary)",
        lineHeight: 1.7,
        maxWidth: 380,
        margin: "0 auto",
      }}>
        Your message is safe with us. It&apos;ll appear on the card once it&apos;s been approved. You can close this page now. 🌸
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card preview — wraps FriendCard so the preview is pixel-identical to /card.
// Shows an empty state until name + message are entered.
// ─────────────────────────────────────────────────────────────────────────────
interface PreviewProps {
  name: string;
  relationship: string;
  message: string;
  theme: ThemeKey;
  photoPreviews: string[];
  spotifyEmbed: string | null;
}

function CardPreview({ name, relationship, message, theme, photoPreviews, spotifyEmbed }: PreviewProps) {
  const isEmpty = !name.trim() && !message.trim();

  if (isEmpty) {
    return (
      <div
        aria-label="Card preview"
        style={{
          backgroundColor: THEMES[theme].bg,
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          padding: "1.5rem",
          minHeight: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          color: "#bbb",
          textAlign: "center",
          transition: "background-color 0.25s",
        }}
      >
        <span style={{ fontSize: 28 }}>✍️</span>
        <p style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "0.8125rem",
          lineHeight: 1.6,
          maxWidth: 220,
          margin: 0,
        }}>
          Start typing your name and message to see your card here.
        </p>
      </div>
    );
  }

  // Build a synthetic Card so FriendCard renders identically to /card
  const previewCard: Card = {
    id: "preview",
    name: name || "Your name",
    relationship: relationship || null,
    message: message || "",
    theme,
    spotify_url: spotifyEmbed,
    photo_urls: photoPreviews,
    approved: false,
    created_at: "",
  };

  return (
    <div aria-label="Card preview">
      <FriendCard card={previewCard} index={0} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section label helper
// ─────────────────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="form-label" style={{ display: "block", marginBottom: "0.5rem" }}>
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────────────────────────────────────
export default function ContributeForm({ recipientName }: { recipientName: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(submitCard, null);

  // Controlled field state (drives live preview)
  const [name, setName]           = useState("");
  const [relationship, setRel]    = useState("");
  const [message, setMsg]         = useState("");
  const [theme, setTheme]         = useState<ThemeKey>("warm");
  const [photoPreviews, setPreviews] = useState<string[]>([]);
  const [spotifyRaw, setSpotifyRaw]  = useState("");
  const [spotifyEmbed, setEmbed]     = useState<string | null>(null);
  const [spotifyInvalid, setInvalid] = useState(false);

  // Two-step submit
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Revoke object URLs on unmount / change
  useEffect(() => {
    return () => { photoPreviews.forEach(URL.revokeObjectURL); };
  }, [photoPreviews]);

  if (state && "success" in state) return <SuccessView />;

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    photoPreviews.forEach(URL.revokeObjectURL);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSpotify = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setSpotifyRaw(raw);
    if (!raw.trim()) {
      setEmbed(null);
      setInvalid(false);
      return;
    }
    const embed = toSpotifyEmbed(raw);
    setEmbed(embed);
    setInvalid(!embed);
  };

  const canPreview = name.trim().length > 0 && message.trim().length > 0;

  const handlePreviewClick = () => {
    if (!canPreview) return;
    setHasPreviewed(true);
    // Scroll preview into view on mobile (where it's below the form)
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    // Outer split layout: form | preview
    // grid-template-columns and gap are set via .contribute-grid CSS class
    // (inline styles would override the responsive media query — don't move them here)
    <div style={{ display: "grid", alignItems: "start" }} className="contribute-grid">

      {/* ═══════════════════════════════════════
          LEFT — Form
      ═══════════════════════════════════════ */}
      <form
        action={formAction}
        style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
      >
        <input type="hidden" name="theme" value={theme} />

        {/* Server error */}
        {state && "error" in state && (
          <div style={{
            padding: "0.875rem 1.25rem",
            borderRadius: 12,
            background: "#fff0f3",
            color: "#be123c",
            border: "1px solid #fecdd3",
            fontFamily: "var(--font-inter)",
            fontSize: "0.875rem",
          }}>
            {state.error}
          </div>
        )}

        {/* Name */}
        <div>
          <Label>Your name *</Label>
          <input
            className="form-input"
            name="name"
            type="text"
            placeholder="e.g. Sara"
            maxLength={80}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Relationship */}
        <div>
          <Label>
            How do you know {recipientName}?{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)" }}>
              (optional)
            </span>
          </Label>
          <input
            className="form-input"
            name="relationship"
            type="text"
            placeholder='e.g. "Best friend since uni"'
            maxLength={100}
            value={relationship}
            onChange={(e) => setRel(e.target.value)}
          />
        </div>

        {/* Message */}
        <div>
          <Label>Your message *</Label>
          <textarea
            className="form-input"
            name="message"
            required
            maxLength={1500}
            rows={6}
            placeholder={`Write something heartfelt for ${recipientName}…`}
            style={{ resize: "vertical" }}
            value={message}
            onChange={(e) => setMsg(e.target.value)}
          />
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            Up to 1500 characters
          </p>
        </div>

        {/* Theme */}
        <div>
          <Label>Card colour</Label>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
              <button
                key={key}
                type="button"
                title={t.label}
                aria-label={t.label}
                aria-pressed={theme === key}
                onClick={() => setTheme(key)}
                style={{
                  width: 36, height: 36,
                  borderRadius: "50%",
                  border: `3px solid ${theme === key ? t.accent : "transparent"}`,
                  backgroundColor: t.bg,
                  cursor: "pointer",
                  boxShadow: theme === key
                    ? `0 0 0 2px white, 0 0 0 4px ${t.accent}`
                    : "0 1px 4px rgba(0,0,0,0.12)",
                  transition: "box-shadow 0.15s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Photos */}
        <div>
          <Label>
            Photos{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)" }}>
              (optional, up to 5)
            </span>
          </Label>
          <label style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.55rem 1.1rem",
            borderRadius: 9999,
            border: "1.5px dashed rgba(0,0,0,0.15)",
            cursor: "pointer",
            fontFamily: "var(--font-inter)",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            background: "rgba(255,255,255,0.5)",
            marginTop: "0.25rem",
          }}>
            📷 Choose photos
            <input
              type="file"
              name="photos"
              multiple
              accept="image/*"
              onChange={handlePhotos}
              style={{ display: "none" }}
            />
          </label>

          {photoPreviews.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
              {photoPreviews.map((src, i) => (
                <div key={i} style={{
                  width: 72, height: 58,
                  borderRadius: 8,
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Preview ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spotify */}
        <div>
          <Label>
            Spotify song{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)" }}>
              (optional)
            </span>
          </Label>
          <input
            className="form-input"
            name="spotify_url"
            type="url"
            placeholder="https://open.spotify.com/track/…"
            value={spotifyRaw}
            onChange={handleSpotify}
            style={spotifyInvalid ? { borderColor: "#f59e0b" } : {}}
          />
          {spotifyInvalid ? (
            <p style={{ fontSize: "0.75rem", color: "#b45309", marginTop: "0.3rem" }}>
              ⚠️ That doesn&apos;t look like a valid Spotify link — paste the share link from Spotify.
            </p>
          ) : (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
              Paste the share link from Spotify.
            </p>
          )}
        </div>

        {/* ─── Preview hint + button ─── */}
        <div style={{
          borderTop: "1px solid rgba(0,0,0,0.07)",
          paddingTop: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}>
          <p style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            lineHeight: 1.5,
            margin: 0,
          }}>
            Preview how your message will appear before sending.
          </p>

          {!hasPreviewed ? (
            <button
              type="button"
              onClick={handlePreviewClick}
              disabled={!canPreview}
              style={{
                width: "100%",
                padding: "0.9rem",
                borderRadius: 14,
                border: "2px solid",
                borderColor: canPreview ? "#7c3aed" : "rgba(0,0,0,0.1)",
                cursor: canPreview ? "pointer" : "not-allowed",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: canPreview ? "#7c3aed" : "#bbb",
                background: "transparent",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!canPreview) return;
                e.currentTarget.style.background = "#7c3aed";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = canPreview ? "#7c3aed" : "#bbb";
              }}
            >
              {canPreview ? "Preview my card →" : "Enter your name and message first"}
            </button>
          ) : (
            <SubmitButton />
          )}

          {!canPreview && (
            <p style={{
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              textAlign: "center",
              margin: 0,
            }}>
              Name and message are required.
            </p>
          )}
        </div>
      </form>

      {/* ═══════════════════════════════════════
          RIGHT — Live preview panel
      ═══════════════════════════════════════ */}
      <div
        ref={previewRef}
        style={{
          position: "sticky",
          top: "5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
        }}
      >
        {/* Panel header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#bbb", fontFamily: "var(--font-inter)" }}>
            Live preview
          </span>
          {hasPreviewed && (
            <span style={{
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#16a34a",
              background: "#dcfce7",
              borderRadius: 9999,
              padding: "0.15rem 0.55rem",
              fontFamily: "var(--font-inter)",
            }}>
              Ready to submit
            </span>
          )}
        </div>

        <CardPreview
          name={name}
          relationship={relationship}
          message={message}
          theme={theme}
          photoPreviews={photoPreviews}
          spotifyEmbed={spotifyEmbed}
        />

        {hasPreviewed && (
          <p style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.75rem",
            color: "#16a34a",
            textAlign: "center",
            margin: 0,
          }}>
            ✓ Looking good! Hit &ldquo;Submit this card&rdquo; when you&apos;re ready.
          </p>
        )}
      </div>

    </div>
  );
}
