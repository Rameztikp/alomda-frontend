import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

/**
 * Return a browser-only Supabase client.
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to be set.
 */
export function getSupabase(): SupabaseClient {
    if (supabase) return supabase;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
        );
    }

    supabase = createClient(url, anonKey, {
        auth: {
            detectSessionInUrl: false,
            persistSession: true,
        },
    });

    return supabase;
}
