import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE_NAME = "ms_guest_id";
const COOKIE_NAME_NAME = "ms_guest_name";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getGuestId(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value ?? null;
}

export async function getOrCreateGuestId(): Promise<string> {
  const c = await cookies();
  const existing = c.get(COOKIE_NAME)?.value;
  if (existing) return existing;
  const id = randomUUID();
  c.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return id;
}

export async function getGuestName(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE_NAME_NAME)?.value ?? null;
}

export async function setGuestName(name: string) {
  const c = await cookies();
  c.set(COOKIE_NAME_NAME, name, {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
}
