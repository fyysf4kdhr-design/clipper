import { createHash } from "crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clips, projects, type Clip, type Project } from "@/db/schema";
import { analyzeVideo } from "./analysis";
import { autoQueueForProject } from "./publishing";

export const PIPELINE_MS = 16000;

export const STAGES = [
  {
    key: "ingest",
    label: "Ingesting source",
    until: 3000,
    detail: "pulling frames, audio track & metadata",
  },
  {
    key: "transcribe",
    label: "Transcribing audio",
    until: 8000,
    detail: "word-level alignment, speaker turns",
  },
  {
    key: "detect",
    label: "Detecting highlights",
    until: 12500,
    detail: "hooks, emotional peaks, loopable endings",
  },
  {
    key: "score",
    label: "Scoring virality",
    until: PIPELINE_MS,
    detail: "ranking candidates, writing captions",
  },
] as const;

export type StageInfo = {
  index: number;
  key: string;
  label: string;
  detail: string;
  overall: number; // 0..1
};

export function getStage(project: Project): StageInfo {
  const elapsed = Date.now() - new Date(project.createdAt).getTime();
  const overall = Math.min(elapsed / PIPELINE_MS, 0.99);
  let index = STAGES.findIndex((s) => elapsed < s.until);
  if (index < 0) index = STAGES.length - 1;
  const s = STAGES[index];
  return { index, key: s.key, label: s.label, detail: s.detail, overall };
}

export function deterministicClipId(projectId: string, rank: number): string {
  const hex = createHash("sha256")
    .update(`klyp-clip:${projectId}:${rank}`)
    .digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/**
 * If the analysis window has elapsed, generate + persist the clips exactly
 * once (deterministic ids make concurrent polls a no-op) and flip status.
 */
export async function finalizeProjectIfReady(
  project: Project,
): Promise<Clip[] | null> {
  if (project.status !== "processing") {
    return db.select().from(clips).where(eq(clips.projectId, project.id)).orderBy(asc(clips.idx));
  }

  const elapsed = Date.now() - new Date(project.createdAt).getTime();
  if (elapsed < PIPELINE_MS) return null;

  const existing = await db
    .select({ id: clips.id })
    .from(clips)
    .where(eq(clips.projectId, project.id))
    .limit(1);

  if (existing.length === 0) {
    const generated = analyzeVideo(
      project.videoId,
      project.title,
      project.durationSeconds,
    );
    await db
      .insert(clips)
      .values(
        generated.map((c) => ({
          id: deterministicClipId(project.id, c.idx),
          projectId: project.id,
          idx: c.idx,
          title: c.title,
          hook: c.hook,
          summary: c.summary,
          reason: c.reason,
          startSeconds: c.startSeconds,
          endSeconds: c.endSeconds,
          score: c.score,
          hashtags: c.hashtags,
          captions: c.captions,
        })),
      )
      .onConflictDoNothing();
  }

  await db
    .update(projects)
    .set({ status: "done" })
    .where(eq(projects.id, project.id));

  // Autopilot: queue qualifying clips for TikTok the moment they exist.
  await autoQueueForProject(project.id).catch(() => 0);

  return db
    .select()
    .from(clips)
    .where(eq(clips.projectId, project.id))
    .orderBy(asc(clips.idx));
}
