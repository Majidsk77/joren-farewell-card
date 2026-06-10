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

/**
 * Called from ContributeForm via useActionState.
 * Signature: (prevState, formData) => Promise<ActionState>
 */
export async function submitCard(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name         = (formData.get("name")         as string)?.trim();
  const relationship = (formData.get("relationship") as string)?.trim() || null;
  const message      = (formData.get("message")      as string)?.trim();
  const theme        = (formData.get("theme")        as string) || "warm";
  const spotifyRaw   = (formData.get("spotify_url")  as string)?.trim() || null;
  const photoFiles   = formData.getAll("photos") as File[];

  // ── Validate ──────────────────────────────────────────────
  if (!name)                 return { error: "Please enter your name." };
  if (!message)              return { error: "Please write a message." };
  if (name.length > 80)      return { error: "Name must be under 80 characters." };
  if (message.length > 1500) return { error: "Message must be under 1500 characters." };

  const supabase = createAnonClient();

  // ── Upload photos ─────────────────────────────────────────
  const photoUrls: string[] = [];
  const validPhotos = photoFiles
    .filter((f) => f.size > 0)
    .filter((f) => f.size <= 10 * 1024 * 1024) // 10 MB max each
    .slice(0, 5);

  for (const photo of validPhotos) {
    const ext  = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("card-photos")
      .upload(path, photo, { upsert: false, contentType: photo.type });

    if (!uploadError && uploadData) {
      const { data: { publicUrl } } = supabase.storage
        .from("card-photos")
        .getPublicUrl(uploadData.path);
      photoUrls.push(publicUrl);
    }
  }

  // ── Convert Spotify URL → embed URL ──────────────────────
  const spotifyEmbed = spotifyRaw ? toSpotifyEmbed(spotifyRaw) : null;

  // ── Insert card (approved = false until admin approves) ───
  const { error } = await supabase.from("cards").insert({
    name,
    relationship,
    message,
    theme,
    spotify_url: spotifyEmbed,
    photo_urls: photoUrls,
    approved: false,
  } as Record<string, unknown>);

  if (error) {
    console.error("submitCard DB error:", error.message);
    return { error: "Something went wrong saving your card. Please try again." };
  }

  return { success: true };
}

// ── Approve a card (admin only) ───────────────────────────────────────────

/**
 * The adminSecret is bound server-side via .bind(null, secret) in the page
 * server component — it is never sent to or visible in the browser.
 */
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

  // Fetch photo URLs so we can clean up storage
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
