import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side auth helpers. Both swallow Supabase errors and return
 * `null` instead of letting the exception bubble up — this matters on
 * a fresh deployment where env vars might not be wired yet, or when
 * the Supabase project is briefly unreachable. The whole site would
 * otherwise crash to the global error boundary; instead the user just
 * sees the signed-out version of the page until things are fixed.
 *
 * The error is logged so the operator can see it in their host's
 * function logs (Vercel runtime logs, `wrangler tail`, etc.).
 */

export async function getUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (err) {
    console.warn("getUser failed; treating as signed-out:", err);
    return null;
  }
}

export async function getCurrentProfile() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    return data;
  } catch (err) {
    console.warn("getCurrentProfile failed; treating as signed-out:", err);
    return null;
  }
}
