import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();

  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("invite_code", normalized)
    .maybeSingle();

  const url = new URL(request.url);
  if (!game) {
    return NextResponse.redirect(new URL(`/?invite_error=${encodeURIComponent(code)}`, url.origin));
  }
  return NextResponse.redirect(new URL(`/play/${game.id}`, url.origin));
}
