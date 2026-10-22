import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  clips,
  connections,
  projects,
  publishJobs,
  type Clip,
  type Connection,
  type PublishJob,
} from "@/db/schema";
import { liveInitPost, liveStatusCheck, getTikTokConfig } from "./tiktok";

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
    .where(and(eq(connections.platform, "tiktok"), eq(connections.mode, "live")))
    .orderBy(desc(connections.createdAt))
    .limit(1);
  return c ?? null;
}

/**
 * Move a publish job along its live TikTok publishing lifecycle.
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

  if (connection.mode !== "live") {
    const [j] = await db
      .update(publishJobs)
      .set({ status: "failed", error: "TikTok connection is not live.", updatedAt: new Date() })
      .where(eq(publishJobs.id, job.id))
      .returning();
    return j ?? job;
  }

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

export async function startLivePublishJob(
  job: PublishJob,
  clip: Clip,
  connection: Connection,
): Promise<PublishJob> {
  try {
    const renderBaseUrl = process.env.RENDER_BASE_URL;
    if (!renderBaseUrl || !connection.accessToken) {
      throw new Error("TikTok credentials and a public MP4 renderer are required.");
    }

    const title = `${job.caption} ${job.hashtags.map((tag) => `#${tag}`).join(" ")}`.slice(0, 2200);
    const publishId = await liveInitPost(connection.accessToken, {
      title,
      privacyLevel: job.privacyLevel,
      videoUrl: `${renderBaseUrl.replace(/\/$/, "")}/${clip.id}.mp4`,
    });
    const [uploading] = await db
      .update(publishJobs)
      .set({ publishId, status: "uploading", progress: 50, updatedAt: new Date() })
      .where(eq(publishJobs.id, job.id))
      .returning();
    return uploading ?? job;
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "TikTok upload could not start.";
    const [failed] = await db
      .update(publishJobs)
      .set({ status: "failed", error, updatedAt: new Date() })
      .where(eq(publishJobs.id, job.id))
      .returning();
    return failed ?? job;
  }
}

/** Queue every eligible clip of a project that isn't already posted/active. */
export async function autoQueueForProject(projectId: string): Promise<number> {
  if (getTikTokConfig().mode !== "live" || !process.env.RENDER_BASE_URL) return 0;
  const [p] = await db.select().from(projects).where(eq(projects.id, projectId));
  if (!p?.autoPostMinScore || !p.autoPostConnectionId) return 0;
  const [conn] = await db
    .select()
    .from(connections)
    .where(eq(connections.id, p.autoPostConnectionId));
  if (!conn || conn.mode !== "live" || !conn.accessToken) return 0;

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

  const jobs = await db.insert(publishJobs).values(
    fresh.map((c) => ({
      clipId: c.id,
      connectionId: conn.id,
      caption: c.hook,
      hashtags: c.hashtags,
      privacyLevel: "PUBLIC_TO_EVERYONE",
      autoQueued: true,
    })),
  ).returning();

  for (const job of jobs) {
    const clip = fresh.find((candidate) => candidate.id === job.clipId);
    if (clip) await startLivePublishJob(job, clip, conn);
  }
  return jobs.length;
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
  mode: "live" | "unavailable";
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
