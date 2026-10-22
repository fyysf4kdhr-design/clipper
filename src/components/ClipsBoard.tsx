"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ExternalLink,
  ListVideo,
  MonitorPlay,
  TrendingUp,
} from "lucide-react";
import Thumb from "./Thumb";
import ClipCard from "./ClipCard";
import ClipModal from "./ClipModal";
import AutopilotControl from "./AutopilotControl";
import { fmtDuration, timeAgo } from "@/lib/format";
import { scoreColor } from "./ScoreDial";
import type { ProjectData, ClipData } from "./ProjectView";

export default function ClipsBoard({
  project,
  clips,
}: {
  project: ProjectData;
  clips: ClipData[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [exportedIds, setExportedIds] = useState<Set<string>>(
    () => new Set(clips.filter((c) => c.exported).map((c) => c.id)),
  );

  const active = useMemo(
    () => clips.find((c) => c.id === activeId) ?? null,
    [clips, activeId],
  );

  const top = clips[0]?.score ?? 0;
  const avg = clips.length
    ? Math.round(clips.reduce((a, c) => a + c.score, 0) / clips.length)
    : 0;
  const totalLen = clips.reduce((a, c) => a + (c.endSeconds - c.startSeconds), 0);

  return (
    <div>
      {/* video header */}
      <div className="card spot overflow-hidden">
        <div className="grid md:grid-cols-[340px_1fr]">
          <div className="relative">
            <Thumb
              videoId={project.videoId}
              alt={project.title}
              className="h-full w-full object-cover max-md:aspect-video"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-panel/60 max-md:bg-gradient-to-t" />
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border-acid/40 text-acid">
                <span className="pulse-dot" /> analysis complete
              </span>
              <span className="chip">
                <ListVideo className="size-3.5" /> {clips.length} clips found
              </span>
              {project.durationSeconds != null && (
                <span className="chip">
                  {fmtDuration(project.durationSeconds)} source
                </span>
              )}
            </div>
            <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight md:text-4xl">
              {project.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] uppercase tracking-wider text-mute">
              <span className="inline-flex items-center gap-1.5">
                <MonitorPlay className="size-3.5 text-ember" /> {project.channel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" /> {timeAgo(project.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-acid" />{" "}
                {fmtDuration(totalLen)} of usable footage
              </span>
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-line pt-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
                  top score
                </p>
                <p
                  className="mt-0.5 font-mono text-2xl font-semibold"
                  style={{ color: scoreColor(top) }}
                >
                  {top}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
                  avg score
                </p>
                <p className="mt-0.5 font-mono text-2xl font-semibold text-cream">
                  {avg}
                </p>
              </div>
              <div className="ml-auto">
                <a
                  href={`https://www.youtube.com/watch?v=${project.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost h-10 px-5 text-sm"
                >
                  Source video <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-line px-6 py-5 md:col-span-2 md:px-8">
            <AutopilotControl
              projectId={project.id}
              initialEnabled={project.autoPostMinScore != null}
              initialMinScore={project.autoPostMinScore ?? 85}
            />
          </div>
        </div>
      </div>

      {/* clips grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {clips.map((clip, i) => (
          <ClipCard
            key={clip.id}
            clip={clip}
            videoId={project.videoId}
            index={i}
            exported={exportedIds.has(clip.id)}
            onOpen={() => setActiveId(clip.id)}
          />
        ))}
      </div>

      <ClipModal
        clip={active}
        project={project}
        exported={active ? exportedIds.has(active.id) : false}
        onExported={(id) => setExportedIds((s) => new Set(s).add(id))}
        onClose={() => setActiveId(null)}
      />
    </div>
  );
}
