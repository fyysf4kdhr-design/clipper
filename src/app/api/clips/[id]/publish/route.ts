import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { clips, publishJobs } from "@/db/schema";
import { getTikTokConfig, liveInitPost } from "@/lib/tiktok";
import { getActiveConnection } from "@/lib/publishing";

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

  // Live mode: initialize the real upload immediately.
  if (getTikTokConfig().mode === "live" && conn.mode === "live") {
    try {
      const base = process.env.RENDER_BASE_URL;
      if (!base) {
        throw new Error(
          "No rendered MP4 exists for this clip yet (KLYP cuts timestamps, not files). Point RENDER_BASE_URL at your render service, or run without TikTok keys to use sandbox mode.",
        );
      }
      const publishId = await liveInitPost(conn.accessToken ?? "", {
        title: `${caption} ${hashtags.map((h) => `#${h}`).join(" ")}`.slice(
          0,
          2200,
        ),
        privacyLevel,
        videoUrl: `${base.replace(/\/$/, "")}/${clip.id}.mp4`,
      });
      const [updated] = await db
        .update(publishJobs)
        .set({ publishId, status: "uploading", progress: 50, updatedAt: new Date() })
        .where(eq(publishJobs.id, job.id))
        .returning();
      return NextResponse.json({ job: updated }, { status: 201 });
    } catch (e) {
      const message = e instanceof Error ? e.message : "publish init failed";
      const [failed] = await db
        .update(publishJobs)
        .set({ status: "failed", error: message, updatedAt: new Date() })
        .where(eq(publishJobs.id, job.id))
        .returning();
      return NextResponse.json({ job: failed }, { status: 201 });
    }
  }

  return NextResponse.json({ job }, { status: 201 });
}
