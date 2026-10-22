"use client";

import { motion } from "framer-motion";
import { Play, BadgeCheck } from "lucide-react";
import Thumb from "./Thumb";
import { fmtDuration } from "@/lib/format";
import { scoreColor } from "./ScoreDial";
import type { ClipData } from "./ProjectView";

export default function ClipCard({
  clip,
  videoId,
  index,
  exported,
  onOpen,
}: {
  clip: ClipData;
  videoId: string;
  index: number;
  exported: boolean;
  onOpen: () => void;
}) {
  const len = clip.endSeconds - clip.startSeconds;
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="card spot card-hover group relative block overflow-hidden text-left"
    >
      {/* 9:16 preview */}
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-panel-2">
        <Thumb
          videoId={videoId}
          alt={clip.title}
          className="size-full scale-[1.6] object-cover object-center transition-transform duration-700 group-hover:scale-[1.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

        {/* rank + score */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-lg bg-acid px-2.5 py-1 font-mono text-[11px] font-bold text-ink shadow-[0_0_18px_rgba(200,255,46,0.5)]">
            #{clip.idx}
          </span>
          {exported && (
            <span className="grid size-6 place-items-center rounded-lg border border-acid/40 bg-ink/70 backdrop-blur">
              <BadgeCheck className="size-3.5 text-acid" />
            </span>
          )}
        </div>
        <span
          className="absolute right-3 top-3 rounded-lg bg-ink/75 px-2.5 py-1 font-mono text-[12px] font-semibold backdrop-blur"
          style={{ color: scoreColor(clip.score) }}
        >
          {clip.score}
        </span>

        {/* hover play */}
        <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid size-14 place-items-center rounded-full bg-acid text-ink shadow-[0_0_30px_rgba(200,255,46,0.65),0_12px_40px_-8px_rgba(110,231,255,0.5)]">
            <Play className="size-5 fill-current" />
          </span>
        </div>
        <div
          aria-hidden
          className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-holo/50 to-transparent"
        />

        {/* bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="line-clamp-2 text-[15px] font-semibold leading-snug">
            {clip.title}
          </p>
          <div className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-cream-2">
            <span className="rounded-md bg-cream/10 px-1.5 py-0.5">
              {fmtDuration(clip.startSeconds)}–{fmtDuration(clip.endSeconds)}
            </span>
            <span className="rounded-md bg-cream/10 px-1.5 py-0.5">
              {len}s cut
            </span>
          </div>
        </div>
      </div>

      {/* reason strip */}
      <div className="border-t border-line p-3.5">
        <p className="line-clamp-1 font-mono text-[11px] text-mute">
          <span className="text-acid">why:</span> {clip.reason}
        </p>
      </div>
    </motion.button>
  );
}
