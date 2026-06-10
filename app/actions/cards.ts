"use server";

import { revalidatePath } from "next/cache";
import { createAnonClient, createAdminClient } from "@/lib/supabase/server";
import { toSpotifyEmbed } from "@/lib/spotify";
import type { Card } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────

export type ActionState =
  | { success: true }
  | { error: string }
  | null;

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

    // ── Validate ────────────────────────────────────────────
    if (!name)                 return { error: "Please enter your name." };
    if (!message)              return { error: "Please write a message." };
    if (name.length > 80)      return { error: "Name must be under 80 characters." };
    if (message.length > 1500) return { error: "Message must be under 1500 characters." };

    // ── Env var guard (fails fast with a clear log, not a crash) ──
    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) {
      console.error("[submitCard] Missing Supabase env vars:", {
        NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnon,
      });
      return { error: "Server is not configured correctly. Please contact the site owner." };
    }

    const supabase = createAnonClient();

    // ── Upload photos ─────────────────────────────────────
    // Vercel serverless functions have a 4.5 MB body limit.
    // We skip photos that are empty (no file selected) and
    // cap each at 4 MB to stay safely under the limit.
    const photoUrls: string[] = [];
    const validPhotos = photoFiles
      .filter((f) => f.size > 0)
      .filter((f) => {
        if (f.size > 4 * 1024 * 1024) {
          console.warn(`[submitCard] Skipping oversized photo: ${f.name} (${f.size} bytes)`);
          return false;
        }
        return true;
      })
      .slice(0, 5);

    for (const photo of validPhotos) {
      try {
        const ext  = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("card-photos")
          .upload(path, photo, { upsert: false, contentType: photo.type });

        if (uploadError) {
          console.error(`[submitCard] Photo upload failed for ${photo.name}:`, uploadError.message);
          // Continue — a missing photo is better than blocking the whole submission
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from("card-photos")
            .getPublicUrl(uploadData.path);
          photoUrls.push(publicUrl);
        }
      } catch (photoErr) {
        console.error(`[submitCard] Unexpected error uploading ${photo.name}:`, photoErr);
        // Continue with remaining photos
      }
    }

    // ── Convert Spotify URL → embed URL ────────────────────
    const spotifyEmbed = spotifyRaw ? toSpotifyEmbed(spotifyRaw) : null;

    // ── Insert card ─────────────────────────────────────────
    const { error: insertError } = await supabase.from("cards").insert({
      name,
      relationship,
      message,
      theme,
      spotify_url: spotifyEmbed,
      photo_urls: photoUrls,
      approved: false,
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

    return { success: true };

  } catch (err) {
    // Catch-all: env vars missing, network error, SDK constructor throw, etc.
    // Log the full error server-side (visible in Vercel Function logs)
    // but return a safe, user-friendly message to the browser.
    console.error("[submitCard] Unhandled exception:", err);
    return {
      error:
        err instanceof Error && err.message.includes("misconfiguration")
          ? err.message   // surface config errors clearly
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
