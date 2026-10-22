import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { clips, publishJobs } from "@/db/schema";
import { getTikTokConfig } from "@/lib/tiktok";
import { getActiveConnection, startLivePublishJob } from "@/lib/publishing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVACY_LEVELS = new Set([
  "PUBLIC_TO_EVERYONE",
  "MUTUAL_FOLLOW_FRIENDS",
  "FOLLOWER_OF_CREATOR",
  "SELF_ONLY",
]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (getTikTokConfig().mode !== "live") {
    return NextResponse.json(
      { error: "tiktok_not_configured", message: "Configure TikTok API credentials to enable live publishing." },
      { status: 503 },
    );
  }

  const [clip] = await db.select().from(clips).where(eq(clips.id, id));
  if (!clip) {
    return NextResponse.json({ error: "Clip not found" }, { status: 404 });
  }

  const conn = await getActiveConnection();
  if (!conn) {
    return NextResponse.json(
      { error: "not_connected", message: "Connect a TikTok account first." },
      { status: 409 },
    );
  }

  const renderBaseUrl = process.env.RENDER_BASE_URL;
  if (!renderBaseUrl) {
    return NextResponse.json(
      { error: "renderer_not_configured", message: "Configure RENDER_BASE_URL to provide a public rendered MP4 for TikTok." },
      { status: 503 },
    );
  }

  const [active] = await db
    .select()
    .from(publishJobs)
    .where(
      and(
        eq(publishJobs.clipId, clip.id),
        eq(publishJobs.connectionId, conn.id),
        inArray(publishJobs.status, ["queued", "uploading"]),
      ),
    )
    .limit(1);
  if (active) {
    return NextResponse.json(
      { error: "already_queued", job: active },
      { status: 409 },
    );
  }

  let body: {
    caption?: string;
    hashtags?: string[];
    privacyLevel?: string;
    scheduledFor?: string | null;
  } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body → defaults */
  }

  const caption = (body.caption ?? "").trim() || clip.hook;
  const hashtags = (
    Array.isArray(body.hashtags) && body.hashtags.length
      ? body.hashtags
      : clip.hashtags
  )
    .map((h) => String(h).replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);
  const privacyLevel = PRIVACY_LEVELS.has(body.privacyLevel ?? "")
    ? (body.privacyLevel as string)
    : "PUBLIC_TO_EVERYONE";

  let scheduledFor: Date | null = null;
  if (body.scheduledFor) {
    const d = new Date(body.scheduledFor);
    if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) {
      scheduledFor = d;
    }
  }

  const [job] = await db
    .insert(publishJobs)
    .values({
      clipId: clip.id,
      connectionId: conn.id,
      caption,
      hashtags,
      privacyLevel,
      scheduledFor,
      autoQueued: false,
    })
    .returning();

  const started = await startLivePublishJob(job, clip, conn);
  return NextResponse.json({ job: started }, { status: 201 });
}
