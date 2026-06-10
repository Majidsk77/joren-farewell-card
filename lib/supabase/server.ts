import { createClient } from "@supabase/supabase-js";

/**
 * Anon client — subject to RLS policies.
 * Use for: reading approved cards, submitting new cards, uploading photos.
 */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Service-role client — bypasses RLS entirely.
 * Use ONLY in server actions protected by the admin secret check.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
