import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clips } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const [clip] = await db.select().from(clips).where(eq(clips.id, id));
  if (!clip) {
    return NextResponse.json({ error: "Clip not found" }, { status: 404 });
  }

  const renderBaseUrl = process.env.RENDER_BASE_URL;
  if (!renderBaseUrl) {
    return NextResponse.json(
      { error: "MP4 renderer is not configured. Set RENDER_BASE_URL to save video clips." },
      { status: 503 },
    );
  }

  let rendered: Response;
  try {
    rendered = await fetch(
      `${renderBaseUrl.replace(/\/$/, "")}/${clip.id}.mp4`,
      { signal: AbortSignal.timeout(60_000) },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach the MP4 renderer." },
      { status: 502 },
    );
  }
  if (!rendered.ok || !rendered.body) {
    return NextResponse.json(
      { error: "The MP4 for this clip is not available yet." },
      { status: 502 },
    );
  }

  return new Response(rendered.body, {
    headers: {
      "content-type": "video/mp4",
      "content-disposition": `attachment; filename="klyp-clip-${String(clip.idx).padStart(2, "0")}.mp4"`,
      "cache-control": "no-store",
    },
  });
}

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const [clip] = await db
    .update(clips)
    .set({ exported: true })
    .where(eq(clips.id, id))
    .returning();

  if (!clip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ clip });
}
