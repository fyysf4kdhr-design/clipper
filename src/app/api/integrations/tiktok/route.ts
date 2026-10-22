import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { connections, projects } from "@/db/schema";
import { getTikTokConfig } from "@/lib/tiktok";
import { getActiveConnection, serializeConnection } from "@/lib/publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { mode } = getTikTokConfig();
  const conn = await getActiveConnection();
  return NextResponse.json({ mode, connection: serializeConnection(conn) });
}

export async function POST() {
  const { mode } = getTikTokConfig();

  if (mode === "live") {
    // Real apps must go through TikTok OAuth instead of instant connect.
    return NextResponse.json(
      { error: "oauth_required", oauthUrl: "/api/integrations/tiktok/oauth" },
      { status: 409 },
    );
  }

  let conn = await getActiveConnection();
  if (!conn) {
    const [created] = await db
      .insert(connections)
      .values({
        platform: "tiktok",
        handle: "@creator.klyp",
        displayName: "KLYP Creator",
        mode: "sandbox",
      })
      .returning();
    conn = created;
  }
  return NextResponse.json({ mode, connection: serializeConnection(conn) });
}

export async function DELETE() {
  await db
    .update(projects)
    .set({ autoPostMinScore: null, autoPostConnectionId: null });
  await db.delete(connections).where(eq(connections.platform, "tiktok"));
  return NextResponse.json({ ok: true });
}
