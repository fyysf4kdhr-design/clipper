import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  clips,
  connections,
  projects,
  publishJobs,
  type Connection,
  type PublishJob,
} from "@/db/schema";
import { liveStatusCheck, sandboxVideoId, getTikTokConfig } from "./tiktok";

const ACTIVE_STATUSES = ["queued", "uploading"];

export type ConnectionView = {
  id: string;
  platform: string;
  handle: string;
  displayName: string | null;
  avatarUrl: string | null;
  mode: string;
};

export type JobView = {
  id: string;
  clipId: string;
  caption: string;
  hashtags: string[];
  privacyLevel: string;
  status: string;
  progress: number;
  publishId: string | null;
  remoteUrl: string | null;
  error: string | null;
  autoQueued: boolean;
  scheduledFor: string | null;
  createdAt: string;
  clipIdx: number;
  clipTitle: string;
  clipScore: number;
  clipStart: number;
  clipEnd: number;
  projectId: string;
  projectTitle: string;
  projectVideoId: string;
};

export function serializeConnection(c: Connection | null): ConnectionView | null {
  if (!c) return null;
  return {
    id: c.id,
    platform: c.platform,
    handle: c.handle,
    displayName: c.displayName,
    avatarUrl: c.avatarUrl,
    mode: c.mode,
  };
}

export async function getActiveConnection(): Promise<Connection | null> {
  const [c] = await db
    .select()
    .from(connections)
    .where(eq(connections.platform, "tiktok"))
    .orderBy(desc(connections.createdAt))
    .limit(1);
  return c ?? null;
}

/**
 * Move a publish job along its lifecycle.
 * Sandbox: time-based simulation — queue 3s → upload ~11s → posted, with a
 * deterministic TikTok-style URL. Live: queries the Content Posting API.
 */
export async function advanceJob(
  job: PublishJob,
  connection: Connection | null,
): Promise<PublishJob> {
  if (!ACTIVE_STATUSES.includes(job.status)) return job;

  if (!connection) {
    const [j] = await db
      .update(publishJobs)
      .set({
        status: "failed",
        error: "TikTok account was disconnected.",
        updatedAt: new Date(),
      })
      .where(eq(publishJobs.id, job.id))
      .returning();
    return j ?? job;
  }

  if (connection.mode === "live") {
    if (!job.publishId || !connection.accessToken) return job;
    try {
      const remote = await liveStatusCheck(connection.accessToken, job.publishId);
      if (remote === "PUBLISH_COMPLETE") {
        const [j] = await db
          .update(publishJobs)
          .set({
            status: "posted",
            progress: 100,
            remoteUrl: `https://www.tiktok.com/${connection.handle}/video/${job.publishId}`,
            updatedAt: new Date(),
          })
          .where(eq(publishJobs.id, job.id))
          .returning();
        return j ?? job;
      }
      if (remote === "FAILED") {
        const [j] = await db
          .update(publishJobs)
          .set({
            status: "failed",
            error: "TikTok rejected the upload.",
            updatedAt: new Date(),
          })
          .where(eq(publishJobs.id, job.id))
          .returning();
        return j ?? job;
      }
      const progress = remote === "SEND_TO_USER_INBOX" ? 96 : 60;
      if (progress !== job.progress || job.status !== "uploading") {
        const [j] = await db
          .update(publishJobs)
          .set({ status: "uploading", progress, updatedAt: new Date() })
          .where(eq(publishJobs.id, job.id))
          .returning();
        return j ?? job;
      }
    } catch {
      /* transient — try again next poll */
    }
    return job;
  }

  // --- sandbox simulation ---
  const now = Date.now();
  if (job.scheduledFor && now < new Date(job.scheduledFor).getTime()) {
    return job; // still waiting for its slot
  }
  const elapsed = now - new Date(job.createdAt).getTime();
  let status = job.status;
  let progress = job.progress;
  let publishId = job.publishId;
  let remoteUrl = job.remoteUrl;

  if (elapsed >= 14000) {
    status = "posted";
    progress = 100;
    publishId = publishId ?? sandboxVideoId(job.id);
    remoteUrl =
      remoteUrl ?? `https://www.tiktok.com/${connection.handle}/video/${publishId}`;
  } else if (elapsed >= 3000) {
    status = "uploading";
    progress = Math.min(98, Math.max(8, Math.round(((elapsed - 3000) / 11000) * 100)));
    publishId = publishId ?? sandboxVideoId(job.id);
  } else {
    status = "queued";
    progress = Math.max(progress, 2);
  }

  if (
    status !== job.status ||
    progress !== job.progress ||
    publishId !== job.publishId
  ) {
    const [j] = await db
      .update(publishJobs)
      .set({ status, progress, publishId, remoteUrl, updatedAt: new Date() })
      .where(eq(publishJobs.id, job.id))
      .returning();
    return j ?? job;
  }
  return job;
}

/** Queue every eligible clip of a project that isn't already posted/active. */
export async function autoQueueForProject(projectId: string): Promise<number> {
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p?.autoPostMinScore || !p.autoPostConnectionId) return 0;
  const [conn] = await db
    .select()
    .from(connections)
    .where(eq(connections.id, p.autoPostConnectionId));
  if (!conn) return 0;

  const eligible = await db
    .select()
    .from(clips)
    .where(
      and(eq(clips.projectId, projectId), gte(clips.score, p.autoPostMinScore)),
    );
  if (eligible.length === 0) return 0;

  const existing = await db
    .select({ clipId: publishJobs.clipId })
    .from(publishJobs)
    .where(
      and(
        eq(publishJobs.connectionId, conn.id),
        inArray(publishJobs.status, ["queued", "uploading", "posted"]),
      ),
    );
  const used = new Set(existing.map((e) => e.clipId));
  const fresh = eligible.filter((c) => !used.has(c.id));
  if (fresh.length === 0) return 0;

  await db.insert(publishJobs).values(
    fresh.map((c) => ({
      clipId: c.id,
      connectionId: conn.id,
      caption: c.hook,
      hashtags: c.hashtags,
      privacyLevel: "PUBLIC_TO_EVERYONE",
      autoQueued: true,
    })),
  );
  return fresh.length;
}

function serializeJobRow(
  j: PublishJob,
  meta: {
    clipIdx: number;
    clipTitle: string;
    clipScore: number;
    clipStart: number;
    clipEnd: number;
    projectId: string;
    projectTitle: string;
    projectVideoId: string;
  },
): JobView {
  return {
    id: j.id,
    clipId: j.clipId,
    caption: j.caption,
    hashtags: j.hashtags,
    privacyLevel: j.privacyLevel,
    status: j.status,
    progress: j.progress,
    publishId: j.publishId,
    remoteUrl: j.remoteUrl,
    error: j.error,
    autoQueued: j.autoQueued,
    scheduledFor: j.scheduledFor ? j.scheduledFor.toISOString() : null,
    createdAt: j.createdAt.toISOString(),
    ...meta,
  };
}

/** Shared by the publish API route and the /publish page. */
export async function listPublishData(): Promise<{
  connection: ConnectionView | null;
  mode: "live" | "sandbox";
  jobs: JobView[];
}> {
  const conn = await getActiveConnection();
  const rows = await db
    .select({
      job: publishJobs,
      clipIdx: clips.idx,
      clipTitle: clips.title,
      clipScore: clips.score,
      clipStart: clips.startSeconds,
      clipEnd: clips.endSeconds,
      projectId: projects.id,
      projectTitle: projects.title,
      projectVideoId: projects.videoId,
    })
    .from(publishJobs)
    .innerJoin(clips, eq(clips.id, publishJobs.clipId))
    .innerJoin(projects, eq(projects.id, clips.projectId))
    .orderBy(desc(publishJobs.createdAt))
    .limit(60);

  const jobs: JobView[] = [];
  for (const r of rows) {
    const advanced = await advanceJob(r.job, conn);
    const { job: _job, ...meta } = r;
    jobs.push(serializeJobRow(advanced, meta));
  }

  return {
    connection: serializeConnection(conn),
    mode: getTikTokConfig().mode,
    jobs,
  };
}
