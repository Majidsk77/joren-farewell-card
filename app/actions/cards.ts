"use server";

import { revalidatePath } from "next/cache";
import { createAnonClient, createAdminClient } from "@/lib/supabase/server";
import { toSpotifyEmbed } from "@/lib/spotify";
import type { Card } from "@/lib/supabase/types";

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

    // Photos are pre-uploaded client-side; we only receive their public URLs.
    const photoUrlsRaw = (formData.get("photo_urls") as string) || "[]";
    let photoUrls: string[] = [];
    try {
      const parsed = JSON.parse(photoUrlsRaw);
      if (Array.isArray(parsed)) photoUrls = parsed.filter((u) => typeof u === "string");
    } catch {
      console.warn("[submitCard] Could not parse photo_urls:", photoUrlsRaw);
    }

    // ── Field validation ─────────────────────────────────────
    if (!name)                 return { error: "Please enter your name." };
    if (!message)              return { error: "Please write a message." };
    if (name.length > 80)      return { error: "Name must be under 80 characters." };
    if (message.length > 1500) return { error: "Message must be under 1500 characters." };

    // ── Env var guard ────────────────────────────────────────
    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnon) {
      console.error("[submitCard] Missing Supabase env vars", {
        NEXT_PUBLIC_SUPABASE_URL:  !!supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnon,
      });
      return { error: "Server is not configured correctly. Please contact the site owner." };
    }

    const anonClient = createAnonClient();

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
