import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { clips, projects } from "@/db/schema";
import { finalizeProjectIfReady } from "@/lib/pipeline";
import Nav from "@/components/Nav";
import StudioBoard from "@/components/StudioBoard";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const rows = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt))
    .limit(48);

  await Promise.all(
    rows
      .filter((p) => p.status === "processing")
      .map((p) => finalizeProjectIfReady(p).catch(() => null)),
  );

  const stats = await db
    .select({
      projectId: clips.projectId,
      count: sql<number>`count(*)::int`,
      topScore: sql<number>`max(${clips.score})::int`,
    })
    .from(clips)
    .groupBy(clips.projectId);
  const byId = new Map(stats.map((s) => [s.projectId, s]));

  const refreshed = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt))
    .limit(48);

  const serialized = refreshed.map((p) => ({
    id: p.id,
    url: p.url,
    videoId: p.videoId,
    title: p.title,
    channel: p.channel,
    durationSeconds: p.durationSeconds,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    clipCount: byId.get(p.id)?.count ?? 0,
    topScore: byId.get(p.id)?.topScore ?? null,
  }));

  return (
    <main className="relative min-h-screen">
      <Nav />
      <div className="grid-bg absolute inset-x-0 top-0 h-[420px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative mx-auto max-w-[1400px] px-5 pb-24 pt-28 md:px-8 md:pt-36">
        <StudioBoard projects={serialized} />
      </div>
    </main>
  );
}
