"use server";

import { revalidatePath } from "next/cache";
import { createAnonClient, createAdminClient } from "@/lib/supabase/server";
import { toSpotifyEmbed } from "@/lib/spotify";
import type { Card } from "@/lib/supabase/types";

export type ActionState =
  | { success: true }
  | { error: string }
  | null;

// Allowed image MIME types for upload
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

// Strip everything that isn't alphanumeric, dash, underscore, or dot
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

// ── Submit a new card (contributor) ──────────────────────────────────────

export async function submitCard(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const name         = (formData.get("name")         as string)?.trim();
    const relationship = (formData.get("relationship") as string)?.trim() || null;
    const message      = (formData.get("message")      as string)?.trim();
    const theme        = (formData.get("theme")        as string) || "warm";
    const spotifyRaw   = (formData.get("spotify_url")  as string)?.trim() || null;
    const photoFiles   = formData.getAll("photos") as File[];

    // ── Field validation ─────────────────────────────────────
    if (!name)                 return { error: "Please enter your name." };
    if (!message)              return { error: "Please write a message." };
    if (name.length > 80)      return { error: "Name must be under 80 characters." };
    if (message.length > 1500) return { error: "Message must be under 1500 characters." };

    // ── Env var guard ────────────────────────────────────────
    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      console.error("[submitCard] Missing Supabase env vars", {
        NEXT_PUBLIC_SUPABASE_URL:  !!supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnon,
      });
      return { error: "Server is not configured correctly. Please contact the site owner." };
    }

    // ── Clients ──────────────────────────────────────────────
    // We use the service-role client for Storage uploads so they are never
    // blocked by Supabase RLS bucket policies (which deny the anon key by
    // default). The service-role key never leaves the server.
    // Card inserts still use the anon client (subject to RLS) so we never
    // accidentally bypass row-level policies on the cards table.
    const anonClient  = createAnonClient();
    const adminClient = serviceKey ? createAdminClient() : anonClient;

    if (!serviceKey) {
      console.warn("[submitCard] SUPABASE_SERVICE_ROLE_KEY not set — " +
        "falling back to anon client for storage; uploads may fail if RLS blocks them.");
    }

    // ── Photo upload ─────────────────────────────────────────
    // Filter: must be a real file, allowed type, and ≤ 3.5 MB each.
    // The 3.5 MB per-file cap (with up to 5 files) means the total body
    // can approach the 4 MB server-action limit configured in next.config.ts.
    // We keep a conservative per-file cap so a single large photo doesn't
    // consume the whole budget.
    const MAX_FILE_BYTES = 3.5 * 1024 * 1024;
    const photoUrls: string[] = [];

    const validPhotos = photoFiles
      .filter((f) => f.size > 0)
      .filter((f) => {
        if (!ALLOWED_MIME.has(f.type)) {
          console.warn(`[submitCard] Skipping non-image file: ${f.name} (${f.type})`);
          return false;
        }
        if (f.size > MAX_FILE_BYTES) {
          console.warn(`[submitCard] Skipping oversized photo: ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`);
          return false;
        }
        return true;
      })
      .slice(0, 5);

    for (const photo of validPhotos) {
      try {
        const safe = sanitizeFilename(photo.name);
        const ext  = safe.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        console.log(`[submitCard] Uploading photo: ${safe} → ${path} (${(photo.size / 1024).toFixed(0)} KB, ${photo.type})`);

        const { data: uploadData, error: uploadError } = await adminClient.storage
          .from("card-photos")
          .upload(path, photo, { upsert: false, contentType: photo.type });

        if (uploadError) {
          // Log the full Supabase StorageError so it appears in Vercel Function logs
          console.error(`[submitCard] Storage upload failed for "${safe}":`, {
            message:    uploadError.message,
            name:       uploadError.name,
            // StorageError may have a statusCode property
            statusCode: (uploadError as Record<string, unknown>).statusCode ?? "unknown",
          });
          // Continue — skip this photo rather than aborting the whole submission
        } else if (uploadData) {
          const { data: { publicUrl } } = adminClient.storage
            .from("card-photos")
            .getPublicUrl(uploadData.path);
          photoUrls.push(publicUrl);
          console.log(`[submitCard] Upload OK → ${publicUrl}`);
        }
      } catch (photoErr) {
        console.error(`[submitCard] Unexpected error uploading "${photo.name}":`, photoErr);
        // Skip and continue
      }
    }

    // ── Spotify ──────────────────────────────────────────────
    const spotifyEmbed = spotifyRaw ? toSpotifyEmbed(spotifyRaw) : null;

    // ── DB insert ────────────────────────────────────────────
    const { error: insertError } = await anonClient.from("cards").insert({
      name,
      relationship,
      message,
      theme,
      spotify_url: spotifyEmbed,
      photo_urls:  photoUrls,
      approved:    false,
    } as Record<string, unknown>);

    if (insertError) {
      console.error("[submitCard] DB insert error:", {
        code:    insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint:    insertError.hint,
      });
      return { error: "Something went wrong saving your card. Please try again." };
    }

    console.log(`[submitCard] Card saved OK — name="${name}" photos=${photoUrls.length}`);
    return { success: true };

  } catch (err) {
    console.error("[submitCard] Unhandled exception:", err);
    return {
      error:
        err instanceof Error && err.message.includes("misconfiguration")
          ? err.message
          : "An unexpected error occurred. Please try again or contact the site owner.",
    };
  }
}

// ── Approve a card (admin only) ───────────────────────────────────────────

export async function approveCard(adminSecret: string, id: string): Promise<void> {
  if (adminSecret !== process.env.ADMIN_SECRET) throw new Error("Unauthorized");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("cards")
    .update({ approved: true } as Record<string, unknown>)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/card");
  revalidatePath(`/admin/${adminSecret}`);
}

// ── Delete a card + its storage photos (admin only) ──────────────────────

export async function deleteCard(adminSecret: string, id: string): Promise<void> {
  if (adminSecret !== process.env.ADMIN_SECRET) throw new Error("Unauthorized");

  const supabase = createAdminClient();

  const { data: card } = await supabase
    .from("cards")
    .select("photo_urls")
    .eq("id", id)
    .single();

  const typedCard = card as Pick<Card, "photo_urls"> | null;
  if (typedCard?.photo_urls?.length) {
    const storagePaths = typedCard.photo_urls
      .map((url) => url.split("/card-photos/")[1])
      .filter(Boolean);
    if (storagePaths.length) {
      await supabase.storage.from("card-photos").remove(storagePaths);
    }
  }

  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/card");
  revalidatePath(`/admin/${adminSecret}`);
}
