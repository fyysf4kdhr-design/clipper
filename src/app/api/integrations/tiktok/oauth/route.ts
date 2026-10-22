import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl, getTikTokConfig, newOAuthState } from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { mode } = getTikTokConfig();
  const origin = req.nextUrl.origin;

  if (mode !== "live") {
    // Nothing to authorize in sandbox mode — connect is instant.
    return NextResponse.redirect(`${origin}/publish`);
  }

  const state = newOAuthState();
  const res = NextResponse.redirect(buildAuthorizeUrl(origin, state));
  res.cookies.set("klyp_tt_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });
  return res;
}
