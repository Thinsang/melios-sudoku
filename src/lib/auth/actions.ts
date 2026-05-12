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

const ALLOWED_AVATAR_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Upload an avatar to the `avatars` storage bucket and update the user's
 * profile.avatar_url to point at the public URL. Stored under
 * `<uid>/avatar.<ext>?v=<ts>` so the cache-busted public URL changes on
 * every replace.
 */
export async function uploadAvatar(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (!ALLOWED_AVATAR_MIME.has(file.type)) {
    return { error: "Use a PNG, JPEG, WebP, or GIF image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Image must be 2 MB or smaller." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  // Map the MIME type to a stable extension we control (Supabase normalizes
  // type but storage uses our object name verbatim).
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });
  if (uploadErr) return { error: uploadErr.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the new image shows up everywhere immediately.
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (profileErr) return { error: profileErr.message };

  revalidatePath("/sudoku", "layout");
  revalidatePath("/sudoku/profile");
  return { ok: true };
}

export async function removeAvatar(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  // Best-effort cleanup of all avatar.* objects in the user's folder.
  await supabase.storage
    .from("avatars")
    .remove([
      `${user.id}/avatar.png`,
      `${user.id}/avatar.jpg`,
      `${user.id}/avatar.webp`,
      `${user.id}/avatar.gif`,
    ]);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/sudoku", "layout");
  revalidatePath("/sudoku/profile");
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
