import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Logged server-side so it shows up in Vercel Function logs
    console.error(`[supabase/server] Missing required environment variable: ${name}`);
    throw new Error(`Server misconfiguration: ${name} is not set.`);
  }
  return value;
}

/**
 * Anon client — subject to RLS policies.
 * Use for: reading approved cards, submitting new cards, uploading photos.
 */
export function createAnonClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

/**
 * Service-role client — bypasses RLS entirely.
 * Use ONLY in server actions protected by the admin secret check.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}
