import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * If the build was kicked off without Supabase env vars set
 * (`NEXT_PUBLIC_*` are inlined at build time by Next.js, so missing
 * vars don't fail the build — they just bake in as `undefined`),
 * every server component that calls Supabase will crash with an
 * "Invalid supabaseUrl" exception from inside @supabase/ssr.
 *
 * This guard makes the failure mode loud and useful: throw a clear
 * "Supabase env vars missing" error that surfaces in server logs,
 * instead of an opaque internal stack trace.
 *
 * Fix at the host: set both NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY in the project's env-var settings
 * for the Production environment, then redeploy. The variables must
 * be present at BUILD time, not just runtime, because Next.js inlines
 * them.
 */
function requireSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in the deployment's environment " +
        "variables (Cloudflare Pages → Settings → Variables and Secrets, " +
        "or Vercel → Settings → Environment Variables) for the " +
        "Production scope, then trigger a fresh build.",
    );
  }
  return { url, key };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = requireSupabaseEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll from a Server Component context — safe to ignore;
          // session refresh happens on the next mutation path.
        }
      },
    },
  });
}
