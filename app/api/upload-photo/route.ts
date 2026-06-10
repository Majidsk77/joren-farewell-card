import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

// Strip unsafe characters from filenames
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

/**
 * POST /api/upload-photo
 * Body: { filename: string, contentType: string }
 * Returns: { signedUrl: string, publicUrl: string }
 *
 * The browser uses the signedUrl to PUT the file directly to Supabase Storage.
 * The service-role key stays server-side; the browser only receives a
 * short-lived signed URL scoped to a single upload path.
 */
export async function POST(req: NextRequest) {
  let filename: string;
  let contentType: string;

  try {
    ({ filename, contentType } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!filename || !contentType) {
    return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });
  }

  if (!ALLOWED_MIME.has(contentType)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const safe = sanitizeFilename(filename);
  const ext = safe.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const adminClient = createAdminClient();

  const { data, error } = await adminClient.storage
    .from("card-photos")
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[upload-photo] Failed to create signed URL:", error);
    return NextResponse.json(
      { error: error?.message ?? "Could not create upload URL" },
      { status: 500 }
    );
  }

  const publicUrl = adminClient.storage
    .from("card-photos")
    .getPublicUrl(path).data.publicUrl;

  return NextResponse.json({ signedUrl: data.signedUrl, publicUrl });
}
