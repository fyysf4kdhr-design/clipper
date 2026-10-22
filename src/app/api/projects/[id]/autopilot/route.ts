import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { autoQueueForProject, getActiveConnection } from "@/lib/publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { enabled?: boolean; minScore?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const enabled = Boolean(body.enabled);
  const minScore = Math.min(99, Math.max(50, Math.round(body.minScore ?? 85)));

  if (enabled) {
    const conn = await getActiveConnection();
    if (!conn) {
      return NextResponse.json(
        {
          error: "not_connected",
          message: "Configure TikTok API credentials and authorize an account first.",
        },
        { status: 409 },
      );
    }
    await db
      .update(projects)
      .set({ autoPostMinScore: minScore, autoPostConnectionId: conn.id })
      .where(eq(projects.id, id));
    const queued = await autoQueueForProject(id);
    return NextResponse.json({ ok: true, enabled, minScore, queued });
  }

  await db
    .update(projects)
    .set({ autoPostMinScore: null, autoPostConnectionId: null })
    .where(eq(projects.id, id));
  return NextResponse.json({ ok: true, enabled: false });
}
