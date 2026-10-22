import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { extractVideoId, fetchVideoMeta } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shared to KLYP",
};

/** Pull a usable YouTube URL out of whatever the OS share sheet sent. */
function findYouTubeUrl(parts: (string | undefined)[]): string | null {
  for (const part of parts) {
    if (!part) continue;
    if (extractVideoId(part)) return part;
    const matches = part.match(/https?:\/\/[^\s"'<>()]+/g);
    if (matches) {
      for (const candidate of matches) {
        if (extractVideoId(candidate)) return candidate;
      }
    }
  }
  return null;
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const url = findYouTubeUrl([params.url, params.text, params.title]);

  if (!url) {
    redirect("/studio?shared=invalid");
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    redirect("/studio?shared=invalid");
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

  redirect(`/project/${project.id}`);
}
