import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { connections } from "@/db/schema";
import { exchangeCodeForToken, fetchTikTokProfile } from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = req.cookies.get("klyp_tt_state")?.value;

  if (!code || !state || state !== cookieState) {
    return NextResponse.redirect(`${origin}/publish?error=oauth_state`);
  }

  try {
    const token = await exchangeCodeForToken(origin, code);
    const profile = await fetchTikTokProfile(token.access_token);

    await db.delete(connections).where(eq(connections.platform, "tiktok"));
    await db.insert(connections).values({
      platform: "tiktok",
      handle: profile.display_name ? `@${profile.display_name}` : "@tiktok.user",
      displayName: profile.display_name ?? "TikTok user",
      avatarUrl: profile.avatar_url ?? null,
      mode: "live",
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
    });

    const res = NextResponse.redirect(`${origin}/publish?connected=1`);
    res.cookies.delete("klyp_tt_state");
    return res;
  } catch {
    return NextResponse.redirect(`${origin}/publish?error=oauth_exchange`);
  }
}
