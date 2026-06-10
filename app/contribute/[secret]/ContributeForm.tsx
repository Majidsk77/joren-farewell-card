"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitCard, type ActionState } from "@/app/actions/cards";
import { THEMES, type ThemeKey } from "@/lib/themes";
import { toSpotifyEmbed } from "@/lib/spotify";
import { compressImage } from "@/lib/compressImage";
import FriendCard from "@/app/components/FriendCard";
import type { Card } from "@/lib/supabase/types";

// ─────────────────────────────────────────────────────────────────────────────
// Single-photo upload state
// ─────────────────────────────────────────────────────────────────────────────
type UploadStatus = "uploading" | "done" | "error";

interface PhotoState {
  preview: string;       // object URL — shown immediately, before upload finishes
  status: UploadStatus;
  publicUrl: string | null;
  errorMsg: string | null;
}

const MAX_MB = 10;
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp",
  "image/gif", "image/heic", "image/heif",
]);

// Browsers on Windows / some Android report file.type="" for HEIC and occasionally JPEG.
// Fall back to the file extension so valid images are never silently rejected.
function inferMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg",
    png: "image/png",  webp: "image/webp",
    gif: "image/gif",  heic: "image/heic", heif: "image/heif",
  };
  return map[ext] ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Photo preview tile — thumbnail + status badge + remove/replace button
// ─────────────────────────────────────────────────────────────────────────────
interface PhotoTileProps {
  photo: PhotoState;
  onRemove: () => void;
  onReplace: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function PhotoTile({ photo, onRemove, fileInputRef }: PhotoTileProps) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginTop: "0.875rem" }}>
      {/* Thumbnail */}
      <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.preview}
          alt="Your photo"
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", borderRadius: 10, display: "block",
            opacity: photo.status === "uploading" ? 0.5 : 1,
            transition: "opacity 0.2s",
          }}
        />

        {/* Status badge */}
        {photo.status === "uploading" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 10,
          }}>
            <span style={{ fontSize: 20 }}>⏳</span>
          </div>
        )}
        {photo.status === "done" && (
          <div style={{
            position: "absolute", bottom: 5, left: 5,
            background: "#16a34a", borderRadius: "50%",
            width: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>
          </div>
        )}
        {photo.status === "error" && (
          <div title={photo.errorMsg ?? "Upload failed"} style={{
            position: "absolute", bottom: 5, left: 5,
            background: "#dc2626", borderRadius: "50%",
            width: 18, height: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✗</span>
          </div>
        )}
      </div>

      {/* Actions + status text */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", paddingTop: "0.25rem" }}>
        <p style={{
          fontFamily: "var(--font-inter)", fontSize: "0.8125rem",
          color: photo.status === "uploading" ? "#6366f1"
               : photo.status === "error"     ? "#be123c"
               : "#16a34a",
          margin: 0,
        }}>
          {photo.status === "uploading" ? "Uploading…"
         : photo.status === "error"     ? (photo.errorMsg ?? "Upload failed")
         : "Ready"}
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              fontFamily: "var(--font-inter)", fontSize: "0.75rem",
              color: "var(--text-secondary)", background: "none",
              border: "1px solid rgba(0,0,0,0.12)", borderRadius: 6,
              padding: "0.2rem 0.55rem", cursor: "pointer",
            }}
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onRemove}
            style={{
              fontFamily: "var(--font-inter)", fontSize: "0.75rem",
              color: "#be123c", background: "none",
              border: "1px solid #fecdd3", borderRadius: 6,
              padding: "0.2rem 0.55rem", cursor: "pointer",
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Submit button
// ─────────────────────────────────────────────────────────────────────────────
function SubmitButton({ blocked }: { blocked?: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || !!blocked;
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        width: "100%", padding: "0.9rem", borderRadius: 14,
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "0.01em",
        color: "#fff",
        background: disabled
          ? "rgba(124,58,237,0.4)"
          : "linear-gradient(135deg, #7c3aed, #db2777)",
        transition: "opacity 0.2s, transform 0.15s",
      }}
    >
      {pending ? "Sending…" : blocked ? "Uploading photo…" : "Submit this card →"}
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
// Card preview — pixel-identical to /card via shared FriendCard component
// ─────────────────────────────────────────────────────────────────────────────
interface PreviewProps {
  name: string;
  relationship: string;
  message: string;
  theme: ThemeKey;
  photoPreview: string | null;
  spotifyEmbed: string | null;
}

function CardPreview({ name, relationship, message, theme, photoPreview, spotifyEmbed }: PreviewProps) {
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
    // DB stores photo_urls as text[] — wrap single preview URL in array for FriendCard
    photo_urls: photoPreview ? [photoPreview] : [],
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

  const [name, setName]        = useState("");
  const [relationship, setRel] = useState("");
  const [message, setMsg]      = useState("");
  const [theme, setTheme]      = useState<ThemeKey>("warm");
  const [spotifyRaw, setSpotifyRaw] = useState("");
  const [spotifyEmbed, setEmbed]    = useState<string | null>(null);
  const [spotifyInvalid, setInvalid] = useState(false);

  const [hasPreviewed, setHasPreviewed] = useState(false);
  const previewRef  = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single-photo state — null means no photo selected
  const [photo, setPhoto]           = useState<PhotoState | null>(null);
  const [photoWarning, setWarning]  = useState<string | null>(null);

  // Derived
  const isUploading  = photo?.status === "uploading";
  const uploadedUrl  = photo?.status === "done" ? photo.publicUrl! : null;
  // Sent to the server action as a JSON-encoded array (DB field is text[])
  const photoUrlsJson = JSON.stringify(uploadedUrl ? [uploadedUrl] : []);

  // Revoke object URL when photo is replaced or removed
  useEffect(() => {
    return () => { if (photo?.preview) URL.revokeObjectURL(photo.preview); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Upload a single compressed file to Supabase Storage via signed URL ─────
  // Must be declared before any early returns to satisfy Rules of Hooks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const uploadFile = useCallback(async (file: File) => {
    try {
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        const msg = body.error ?? `Server error ${res.status}`;
        console.error(`[ContributeForm] /api/upload-photo failed for "${file.name}":`, msg);
        throw new Error(msg);
      }

      const { signedUrl, publicUrl } = await res.json() as { signedUrl: string; publicUrl: string };

      const put = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!put.ok) {
        console.error(`[ContributeForm] Storage PUT failed for "${file.name}":`, put.status, put.statusText);
        throw new Error(`Storage upload failed (HTTP ${put.status})`);
      }

      setPhoto((prev) => prev ? { ...prev, status: "done", publicUrl } : prev);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed — please try again.";
      console.error(`[ContributeForm] Upload error for "${file.name}":`, err);
      setPhoto((prev) => prev ? { ...prev, status: "error", errorMsg } : prev);
    }
  }, []);

  if (state && "success" in state) return <SuccessView />;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so the same file can be re-selected after removal

    if (!file) return;

    const mime = inferMimeType(file);
    const MAX_BYTES = MAX_MB * 1024 * 1024;

    if (!ALLOWED_TYPES.has(mime)) {
      setWarning(`"${file.name}" isn't a supported image type. Try a JPEG, PNG, or WebP.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setWarning(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — please choose an image under ${MAX_MB} MB.`);
      return;
    }
    setWarning(null);

    // Revoke previous object URL to avoid memory leak
    if (photo?.preview) URL.revokeObjectURL(photo.preview);

    // Show thumbnail immediately; upload in background
    const preview = URL.createObjectURL(file);
    setPhoto({ preview, status: "uploading", publicUrl: null, errorMsg: null });

    // Compress, then upload
    void (async () => {
      let fileToUpload = file;
      try {
        const normalised = mime !== file.type
          ? new File([file], file.name, { type: mime })
          : file;
        fileToUpload = await compressImage(normalised);
        console.log(
          `[ContributeForm] Compressed "${file.name}": ` +
          `${(file.size / 1024).toFixed(0)} KB → ${(fileToUpload.size / 1024).toFixed(0)} KB (${fileToUpload.type})`
        );
      } catch (compressErr) {
        console.warn(`[ContributeForm] Compression failed for "${file.name}", uploading original:`, compressErr);
        if (mime !== file.type) {
          fileToUpload = new File([file], file.name, { type: mime });
        }
      }
      try {
        await uploadFile(fileToUpload);
      } catch (uploadErr) {
        console.error("[ContributeForm] Unexpected upload error:", uploadErr);
        setPhoto((prev) => prev ? { ...prev, status: "error", errorMsg: "Upload failed — please try again." } : prev);
      }
    })();
  };

  const removePhoto = () => {
    if (photo?.preview) URL.revokeObjectURL(photo.preview);
    setPhoto(null);
    setWarning(null);
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

  return (
    <div style={{ display: "grid", alignItems: "start" }} className="contribute-grid">

      {/* ═══════════════════════════════════════
          LEFT — Form
      ═══════════════════════════════════════ */}
      <form
        action={formAction}
        style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
      >
        {/* photo_urls is sent as a JSON-encoded array so the DB field (text[]) stays happy.
            File bytes never enter FormData — upload goes browser → Supabase Storage directly. */}
        <input type="hidden" name="theme"       value={theme} />
        <input type="hidden" name="photo_urls"  value={photoUrlsJson} />

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

        {/* ── Photo (single) ─────────────────────────────── */}
        <div>
          <Label>
            Add a photo{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)" }}>
              (optional)
            </span>
          </Label>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 0.625rem" }}>
            One favourite photo to go with your message.
          </p>

          {/* Hidden file input — triggered by label or Replace button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            style={{ display: "none" }}
          />

          {photo ? (
            <PhotoTile
              photo={photo}
              onRemove={removePhoto}
              onReplace={() => fileInputRef.current?.click()}
              fileInputRef={fileInputRef}
            />
          ) : (
            /* Choose button — only shown when no photo is selected */
            <label style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.55rem 1.1rem", borderRadius: 9999,
              border: "1.5px dashed rgba(0,0,0,0.15)", cursor: "pointer",
              fontFamily: "var(--font-inter)", fontSize: "0.875rem",
              color: "var(--text-secondary)", background: "rgba(255,255,255,0.5)",
            }}>
              📷 Choose a photo
              {/* Invisible — actual input is the ref above; this label just triggers it */}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                style={{ display: "none" }}
              />
            </label>
          )}

          {photoWarning && (
            <p style={{
              fontSize: "0.75rem", color: "#b45309",
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 8, padding: "0.5rem 0.75rem", marginTop: "0.75rem",
            }}>
              ⚠️ {photoWarning}
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
          photoPreview={photo?.preview ?? null}
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
