"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AuthResult {
  error?: string;
  ok?: boolean;
  message?: string;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

/** Default landing for auth flows is the sudoku app, not the Melio's Games hub. */
const AUTH_DEFAULT_NEXT = "/sudoku";

function safeNext(raw: unknown, fallback = AUTH_DEFAULT_NEXT): string {
  const s = typeof raw === "string" ? raw : "";
  // Only allow same-origin paths.
  if (!s.startsWith("/") || s.startsWith("//")) return fallback;
  return s;
}

export async function signIn(
  _prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(next);
}

export async function signUp(
  _prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const next = safeNext(formData.get("next"));

  if (!email || !password || !username) {
    return { error: "Email, username, and password are required." };
  }
  if (!USERNAME_RE.test(username)) {
    return { error: "Username must be 3-20 chars: letters, numbers, underscore." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName || username,
      },
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is enabled in the Supabase project, signUp returns
  // no session — the user must click the link in their email first.
  if (!data.session) {
    return {
      ok: true,
      message: `We sent a confirmation link to ${email}. Click it to finish creating your account, then come back and sign in.`,
    };
  }

  // Email confirmation is off — the user is signed in immediately.
  redirect(next === AUTH_DEFAULT_NEXT ? `${AUTH_DEFAULT_NEXT}?welcome=1` : next);
}

export async function updateProfile(
  _prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) return { error: "Display name can't be empty." };
  if (displayName.length > 40)
    return { error: "Display name must be 40 characters or fewer." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/sudoku", "layout");
  return { ok: true };
}

export async function sendPasswordReset(
  _prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { error: error.message };

  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sudoku");
}
