import { NextRequest, NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { clips, projects } from "@/db/schema";
import { extractVideoId, fetchVideoMeta } from "@/lib/youtube";
import { finalizeProjectIfReady } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limit = Math.min(
    48,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 24) || 24),
  );

  const rows = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt))
    .limit(limit);

  const stats = await db
    .select({
      projectId: clips.projectId,
      count: sql<number>`count(*)::int`,
      topScore: sql<number>`max(${clips.score})::int`,
      avgScore: sql<number>`round(avg(${clips.score}))::int`,
    })
    .from(clips)
    .groupBy(clips.projectId);

  const byId = new Map(stats.map((s) => [s.projectId, s]));

  // Opportunistically finish stale analyses so the library stays truthful.
  await Promise.all(
    rows
      .filter((p) => p.status === "processing")
      .map((p) => finalizeProjectIfReady(p).catch(() => null)),
  );

  const refreshed = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt))
    .limit(limit);

  return NextResponse.json({
    projects: refreshed.map((p) => {
      const s = byId.get(p.id);
      return {
        ...p,
        clipCount: s?.count ?? 0,
        topScore: s?.topScore ?? null,
        avgScore: s?.avgScore ?? null,
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = (body.url ?? "").toString();
  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json(
      { error: "That does not look like a YouTube link." },
      { status: 422 },
    );
  }

  const meta = await fetchVideoMeta(videoId);

  const [project] = await db
    .insert(projects)
    .values({
      url: url.startsWith("http") ? url : `https://www.youtube.com/watch?v=${videoId}`,
      videoId: meta.videoId,
      title: meta.title,
      channel: meta.channel,
      durationSeconds: meta.durationSeconds,
      status: "processing",
    })
    .returning();

  return NextResponse.json({ project }, { status: 201 });
}
