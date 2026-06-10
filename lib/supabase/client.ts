import { createClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client (anon key, subject to RLS).
 * Call inside client components when you need direct storage access.
 */
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
