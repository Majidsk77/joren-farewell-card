"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitCard, type ActionState } from "@/app/actions/cards";
import { THEMES, type ThemeKey } from "@/lib/themes";
import { toSpotifyEmbed } from "@/lib/spotify";
import { compressImage } from "@/lib/compressImage";
import FriendCard from "@/app/components/FriendCard";
import type { Card } from "@/lib/supabase/types";

// ─────────────────────────────────────────────────────────────────────────────
// Per-photo upload entry
// ─────────────────────────────────────────────────────────────────────────────
type PhotoStatus = "uploading" | "done" | "error";

interface PhotoEntry {
  id: string;
  preview: string;   // object URL for immediate display
  status: PhotoStatus;
  publicUrl: string | null;
  errorMsg: string | null;
}

const MAX_PHOTOS = 5;
const MAX_MB = 10;
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp",
  "image/gif", "image/heic", "image/heif",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Per-photo thumbnail with status overlay and remove button
// ─────────────────────────────────────────────────────────────────────────────
function PhotoTile({ entry, onRemove }: { entry: PhotoEntry; onRemove: () => void }) {
  return (
    <div style={{ position: "relative", width: 80, height: 64 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.preview}
        alt="Photo preview"
        style={{
          width: "100%", height: "100%",
          objectFit: "cover",
          borderRadius: 8,
          display: "block",
          opacity: entry.status === "uploading" ? 0.5 : 1,
          transition: "opacity 0.2s",
        }}
      />

      {/* Status overlay */}
      {entry.status === "uploading" && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 18, animation: "spin 1s linear infinite" }}>⏳</span>
        </div>
      )}
      {entry.status === "done" && (
        <div style={{
          position: "absolute", bottom: 4, left: 4,
          background: "#16a34a",
          borderRadius: "50%",
          width: 18, height: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>
        </div>
      )}
      {entry.status === "error" && (
        <div
          title={entry.errorMsg ?? "Upload failed"}
          style={{
            position: "absolute", bottom: 4, left: 4,
            background: "#dc2626",
            borderRadius: "50%",
            width: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✗</span>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        aria-label="Remove photo"
        onClick={onRemove}
        style={{
          position: "absolute", top: -6, right: -6,
          width: 20, height: 20,
          borderRadius: "50%",
          border: "none",
          background: "#111",
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Submit button — reads pending from form context
// ─────────────────────────────────────────────────────────────────────────────
function SubmitButton({ blocked }: { blocked?: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || !!blocked;
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        width: "100%",
        padding: "0.9rem",
        borderRadius: 14,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontSize: "0.9375rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        color: "#fff",
        background: disabled
          ? "rgba(124,58,237,0.4)"
          : "linear-gradient(135deg, #7c3aed, #db2777)",
        transition: "opacity 0.2s, transform 0.15s",
      }}
    >
      {pending ? "Sending…" : blocked ? "Uploading photos…" : "Submit this card →"}
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
        fontSize: "2rem", fontWeight: 700,
        color: "var(--text-primary)", marginBottom: "0.75rem",
      }}>
        Card received!
      </h2>
      <p style={{
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontSize: "1rem", color: "var(--text-secondary)",
        lineHeight: 1.7, maxWidth: 380, margin: "0 auto",
      }}>
        Your message is safe with us. It&apos;ll appear on the card once it&apos;s been approved.
        You can close this page now. 🌸
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card preview — pixel-identical to /card via shared FriendCard component.
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
          borderRadius: 16, padding: "1.5rem", minHeight: 180,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "0.75rem", color: "#bbb", textAlign: "center",
          transition: "background-color 0.25s",
        }}
      >
        <span style={{ fontSize: 28 }}>✍️</span>
        <p style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "0.8125rem", lineHeight: 1.6, maxWidth: 220, margin: 0,
        }}>
          Start typing your name and message to see your card here.
        </p>
      </div>
    );
  }

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

  const [name, setName]           = useState("");
  const [relationship, setRel]    = useState("");
  const [message, setMsg]         = useState("");
  const [theme, setTheme]         = useState<ThemeKey>("warm");
  const [spotifyRaw, setSpotifyRaw]  = useState("");
  const [spotifyEmbed, setEmbed]     = useState<string | null>(null);
  const [spotifyInvalid, setInvalid] = useState(false);

  const [hasPreviewed, setHasPreviewed] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Per-photo state — single source of truth for previews, upload status, and public URLs
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [photoWarning, setPhotoWarning] = useState<string | null>(null);

  // Derived values
  const isUploading   = photos.some((p) => p.status === "uploading");
  const photoPreviews = photos.map((p) => p.preview);
  const uploadedUrls  = photos.filter((p) => p.status === "done").map((p) => p.publicUrl!);
  const hasErrors     = photos.some((p) => p.status === "error");

  // Revoke object URLs when entries are removed or on unmount
  useEffect(() => {
    return () => { photos.forEach((p) => URL.revokeObjectURL(p.preview)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state && "success" in state) return <SuccessView />;

  // Upload a single photo entry to Supabase Storage via signed URL
  async function uploadOne(entry: PhotoEntry, file: File) {
    try {
      // Compress before upload — smaller payload, faster for iPhone HEIC/large JPEGs.
      // If compression fails for any reason, fall back to the original file silently.
      let fileToUpload = file;
      try {
        fileToUpload = await compressImage(file);
        console.log(
          `[ContributeForm] Compressed "${file.name}": ` +
          `${(file.size / 1024).toFixed(0)} KB → ${(fileToUpload.size / 1024).toFixed(0)} KB (${fileToUpload.type})`
        );
      } catch (compressErr) {
        console.warn(`[ContributeForm] Compression failed for "${file.name}", uploading original:`, compressErr);
      }

      const res = await fetch("/api/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileToUpload.name, contentType: fileToUpload.type }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        const msg = body.error ?? `Server error ${res.status}`;
        console.error(`[ContributeForm] /api/upload-photo failed for "${fileToUpload.name}":`, msg);
        throw new Error(msg);
      }

      const { signedUrl, publicUrl } = await res.json() as { signedUrl: string; publicUrl: string };

      const put = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": fileToUpload.type },
        body: fileToUpload,
      });

      if (!put.ok) {
        const msg = `Storage PUT failed (HTTP ${put.status})`;
        console.error(`[ContributeForm] Storage PUT failed for "${fileToUpload.name}":`, put.status, put.statusText);
        throw new Error(msg);
      }

      setPhotos((prev) =>
        prev.map((p) => p.id === entry.id ? { ...p, status: "done", publicUrl } : p)
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      console.error(`[ContributeForm] Upload error for "${file.name}":`, err);
      setPhotos((prev) =>
        prev.map((p) => p.id === entry.id ? { ...p, status: "error", errorMsg } : p)
      );
    }
  }

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_BYTES = MAX_MB * 1024 * 1024;
    const incoming  = Array.from(e.target.files ?? []);

    const accepted: File[] = [];
    const skipped: string[] = [];

    for (const f of incoming) {
      if (!ALLOWED_TYPES.has(f.type)) {
        skipped.push(`${f.name} (not a supported image type)`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        skipped.push(`${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB — max ${MAX_MB} MB)`);
        continue;
      }
      if (photos.length + accepted.length >= MAX_PHOTOS) {
        skipped.push(`${f.name} (max ${MAX_PHOTOS} photos)`);
        continue;
      }
      accepted.push(f);
    }

    setPhotoWarning(skipped.length > 0 ? `Skipped: ${skipped.join(", ")}` : null);

    if (accepted.length === 0) return;

    // Create entries immediately so thumbnails appear before upload completes
    const newEntries: PhotoEntry[] = accepted.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      preview: URL.createObjectURL(f),
      status: "uploading",
      publicUrl: null,
      errorMsg: null,
    }));

    setPhotos((prev) => [...prev, ...newEntries]);

    // Kick off all uploads concurrently
    accepted.forEach((file, i) => uploadOne(newEntries[i], file));

    // Reset input so the same file can be re-selected after removal
    e.target.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const entry = prev.find((p) => p.id === id);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSpotify = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setSpotifyRaw(raw);
    if (!raw.trim()) { setEmbed(null); setInvalid(false); return; }
    const embed = toSpotifyEmbed(raw);
    setEmbed(embed);
    setInvalid(!embed);
  };

  const canPreview = name.trim().length > 0 && message.trim().length > 0;

  const handlePreviewClick = () => {
    if (!canPreview) return;
    setHasPreviewed(true);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <div style={{ display: "grid", alignItems: "start" }} className="contribute-grid">

      {/* ═══════════════════════════════════════
          LEFT — Form
      ═══════════════════════════════════════ */}
      <form
        action={formAction}
        style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
      >
        <input type="hidden" name="theme" value={theme} />
        <input type="hidden" name="photo_urls" value={JSON.stringify(uploadedUrls)} />

        {/* Server error */}
        {state && "error" in state && (
          <div style={{
            padding: "0.875rem 1.25rem", borderRadius: 12,
            background: "#fff0f3", color: "#be123c",
            border: "1px solid #fecdd3",
            fontFamily: "var(--font-inter)", fontSize: "0.875rem",
          }}>
            {state.error}
          </div>
        )}

        {/* Name */}
        <div>
          <Label>Your name *</Label>
          <input
            className="form-input" name="name" type="text"
            placeholder="e.g. Sara" maxLength={80} required
            value={name} onChange={(e) => setName(e.target.value)}
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
            className="form-input" name="relationship" type="text"
            placeholder='e.g. "Best friend since uni"' maxLength={100}
            value={relationship} onChange={(e) => setRel(e.target.value)}
          />
        </div>

        {/* Message */}
        <div>
          <Label>Your message *</Label>
          <textarea
            className="form-input" name="message" required
            maxLength={1500} rows={6}
            placeholder={`Write something heartfelt for ${recipientName}…`}
            style={{ resize: "vertical" }}
            value={message} onChange={(e) => setMsg(e.target.value)}
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
                key={key} type="button" title={t.label}
                aria-label={t.label} aria-pressed={theme === key}
                onClick={() => setTheme(key)}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: `3px solid ${theme === key ? t.accent : "transparent"}`,
                  backgroundColor: t.bg, cursor: "pointer",
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
              (optional, up to {MAX_PHOTOS})
            </span>
          </Label>

          {/* Choose button — hidden once limit reached */}
          {canAddMore && (
            <label style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.55rem 1.1rem", borderRadius: 9999,
              border: "1.5px dashed rgba(0,0,0,0.15)", cursor: "pointer",
              fontFamily: "var(--font-inter)", fontSize: "0.875rem",
              color: "var(--text-secondary)", background: "rgba(255,255,255,0.5)",
              marginTop: "0.25rem",
            }}>
              📷 {photos.length === 0 ? "Choose photos" : `Add more (${MAX_PHOTOS - photos.length} left)`}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotos}
                style={{ display: "none" }}
              />
            </label>
          )}

          {/* Warning for skipped files */}
          {photoWarning && (
            <p style={{
              fontSize: "0.75rem", color: "#b45309",
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 8, padding: "0.5rem 0.75rem", marginTop: "0.75rem",
            }}>
              ⚠️ {photoWarning}
            </p>
          )}

          {/* Per-photo thumbnails */}
          {photos.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem", marginTop: "0.875rem" }}>
              {photos.map((entry) => (
                <PhotoTile key={entry.id} entry={entry} onRemove={() => removePhoto(entry.id)} />
              ))}
            </div>
          )}

          {/* Upload status summary */}
          {photos.length > 0 && (
            <p style={{ fontSize: "0.75rem", marginTop: "0.6rem",
              color: isUploading ? "#6366f1" : hasErrors ? "#be123c" : "#16a34a" }}>
              {isUploading
                ? `⏳ Uploading ${photos.filter((p) => p.status === "uploading").length} photo${photos.filter((p) => p.status === "uploading").length > 1 ? "s" : ""}…`
                : hasErrors
                  ? `✗ ${photos.filter((p) => p.status === "error").length} photo${photos.filter((p) => p.status === "error").length > 1 ? "s" : ""} failed — remove and try again`
                  : `✓ ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? "s" : ""} ready`}
            </p>
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
            className="form-input" name="spotify_url" type="url"
            placeholder="https://open.spotify.com/track/…"
            value={spotifyRaw} onChange={handleSpotify}
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

        {/* Preview / Submit */}
        <div style={{
          borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: "1.5rem",
          display: "flex", flexDirection: "column", gap: "0.75rem",
        }}>
          <p style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5, margin: 0,
          }}>
            Preview how your message will appear before sending.
          </p>

          {!hasPreviewed ? (
            <button
              type="button"
              onClick={handlePreviewClick}
              disabled={!canPreview}
              style={{
                width: "100%", padding: "0.9rem", borderRadius: 14,
                border: "2px solid",
                borderColor: canPreview ? "#7c3aed" : "rgba(0,0,0,0.1)",
                cursor: canPreview ? "pointer" : "not-allowed",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "0.9375rem", fontWeight: 600,
                color: canPreview ? "#7c3aed" : "#bbb",
                background: "transparent", transition: "background 0.15s, color 0.15s",
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
            <SubmitButton blocked={isUploading} />
          )}

          {!canPreview && (
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
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
        style={{ position: "sticky", top: "5rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "#bbb", fontFamily: "var(--font-inter)",
          }}>
            Live preview
          </span>
          {hasPreviewed && (
            <span style={{
              fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#16a34a", background: "#dcfce7",
              borderRadius: 9999, padding: "0.15rem 0.55rem", fontFamily: "var(--font-inter)",
            }}>
              Ready to submit
            </span>
          )}
        </div>

        <CardPreview
          name={name} relationship={relationship}
          message={message} theme={theme}
          photoPreviews={photoPreviews}
          spotifyEmbed={spotifyEmbed}
        />

        {hasPreviewed && (
          <p style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.75rem", color: "#16a34a", textAlign: "center", margin: 0,
          }}>
            ✓ Looking good! Hit &ldquo;Submit this card&rdquo; when you&apos;re ready.
          </p>
        )}
      </div>

    </div>
  );
}
