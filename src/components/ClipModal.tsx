"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  LoaderCircle,
  Repeat,
  Captions as CaptionsIcon,
  Hash,
  Sparkles,
} from "lucide-react";
import ScoreDial from "./ScoreDial";
import TikTokIcon from "./TikTokIcon";
import TikTokDialog from "./TikTokDialog";
import { useYouTubePlayer } from "@/lib/useYouTubePlayer";
import { fmtDuration, toSrtTime } from "@/lib/format";
import type { ProjectData, ClipData } from "./ProjectView";

export default function ClipModal({
  clip,
  project,
  exported,
  onExported,
  onClose,
}: {
  clip: ClipData | null;
  project: ProjectData;
  exported: boolean;
  onExported: (id: string) => void;
  onClose: () => void;
}) {
  const [time, setTime] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTikTok, setShowTikTok] = useState(false);
  const len = clip ? clip.endSeconds - clip.startSeconds : 1;

  const { hostRef, seekTo } = useYouTubePlayer({
    videoId: project.videoId,
    start: clip?.startSeconds ?? 0,
    end: clip?.endSeconds ?? 1,
    active: !!clip,
    onTime: (t) => setTime(t),
  });

  // esc + scroll lock
  useEffect(() => {
    if (!clip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showTikTok) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [clip, onClose, showTikTok]);

  const currentCaption = useMemo(() => {
    if (!clip) return null;
    return clip.captions.find((c) => time >= c.t0 && time < c.t1) ?? null;
  }, [clip, time]);

  const exportClip = async () => {
    if (!clip || exporting) return;
    setExporting(true);
    try {
      await fetch(`/api/clips/${clip.id}/export`, { method: "POST" });
      onExported(clip.id);
      const srt = clip.captions
        .map(
          (c, i) =>
            `${i + 1}\n${toSrtTime(c.t0)} --> ${toSrtTime(c.t1)}\n${c.text}\n`,
        )
        .join("\n");
      const meta = [
        clip.title,
        "",
        `hook: ${clip.hook}`,
        `source: https://youtu.be/${project.videoId}?t=${clip.startSeconds}`,
        `cut: ${fmtDuration(clip.startSeconds)} → ${fmtDuration(clip.endSeconds)} (${len}s)`,
        `virality: ${clip.score}/100`,
        "",
        clip.hashtags.map((h) => `#${h}`).join(" "),
        "",
        "---- captions (srt) ----",
        "",
        srt,
      ].join("\n");
      const blob = new Blob([meta], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `klyp-clip-${String(clip.idx).padStart(2, "0")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const copyDetails = async () => {
    if (!clip) return;
    try {
      await navigator.clipboard.writeText(
        `${clip.title}\n\n${clip.hook}\n\n${clip.hashtags
          .map((h) => `#${h}`)
          .join(" ")}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <>
      <AnimatePresence>
        {clip && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 bg-ink/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="card relative flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden md:h-[86vh]"
          >
            {/* top bar */}
            <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="rounded-lg bg-acid px-2 py-1 font-mono text-[11px] font-bold text-ink">
                  #{clip.idx}
                </span>
                <p className="truncate text-sm font-medium md:text-base">
                  {clip.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-line-2 text-cream-2 transition-colors hover:border-cream/40 hover:text-cream"
                aria-label="Close modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,380px)_1fr]">
              {/* phone preview */}
              <div className="relative min-h-[320px] border-b border-line bg-black max-md:h-[46vh] md:border-b-0 md:border-r">
                <div className="absolute inset-3 overflow-hidden rounded-2xl border border-line-2 bg-black">
                  {/* cropped 16:9 player → 9:16 */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div
                      ref={hostRef}
                      className="absolute left-1/2 top-0 aspect-video h-full -translate-x-1/2"
                    />
                  </div>

                  {/* captions overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-3">
                    {currentCaption && (
                      <CaptionKaraoke caption={currentCaption} time={time} />
                    )}
                  </div>

                  {/* progress */}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-cream/10">
                    <div
                      className="h-full bg-acid transition-[width] duration-200"
                      style={{ width: `${Math.min(100, (time / len) * 100)}%` }}
                    />
                  </div>

                  {/* loop badge */}
                  <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md bg-ink/75 px-2 py-1 font-mono text-[10px] text-cream-2 backdrop-blur">
                    <Repeat className="size-3 text-acid" />
                    {fmtDuration(clip.startSeconds)}–{fmtDuration(clip.endSeconds)}
                  </div>
                </div>
              </div>

              {/* info panel */}
              <div className="min-h-0 overflow-y-auto p-5 md:p-6">
                <div className="flex items-center gap-5">
                  <ScoreDial score={clip.score} size={86} stroke={7} showLabel />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
                      virality score
                    </p>
                    <p className="mt-1 max-w-xs text-sm leading-snug text-cream-2">
                      {clip.reason}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-acid/25 bg-acid/5 p-4">
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-acid">
                    <Sparkles className="size-3.5" /> the hook
                  </p>
                  <p className="mt-2 text-[15px] font-medium leading-snug">
                    “{clip.hook}”
                  </p>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-cream-2">
                  {clip.summary}
                </p>

                {/* actions */}
                <div className="mt-6 flex flex-wrap gap-2.5">
                  <button
                    onClick={exportClip}
                    disabled={exporting || exported}
                    className="btn-acid h-10 px-5 text-sm"
                  >
                    {exporting ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : exported ? (
                      <Check className="size-4" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    {exported ? "Exported" : "Export package"}
                  </button>
                  <button onClick={copyDetails} className="btn-ghost h-10 px-4 text-sm">
                    {copied ? (
                      <Check className="size-4 text-acid" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {copied ? "Copied" : "Copy caption"}
                  </button>
                  <button
                    onClick={() => setShowTikTok(true)}
                    className="btn-ghost h-10 px-4 text-sm"
                  >
                    <TikTokIcon glitch className="size-4" />
                    Post to TikTok
                  </button>
                  <a
                    href={`https://youtu.be/${project.videoId}?t=${clip.startSeconds}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost h-10 px-4 text-sm"
                  >
                    <ExternalLink className="size-4" /> Open at timestamp
                  </a>
                </div>

                {/* captions list */}
                <div className="mt-7 border-t border-line pt-5">
                  <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
                    <CaptionsIcon className="size-3.5 text-acid" /> timed captions —
                    tap to jump
                  </p>
                  <ul className="space-y-1.5">
                    {clip.captions.map((c, i) => {
                      const activeRow = time >= c.t0 && time < c.t1;
                      return (
                        <li key={i}>
                          <button
                            onClick={() => seekTo(c.t0)}
                            className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                              activeRow
                                ? "border-acid/40 bg-acid/5"
                                : "border-transparent bg-panel-2/50 hover:border-line-2"
                            }`}
                          >
                            <span
                              className={`mt-0.5 font-mono text-[10px] ${
                                activeRow ? "text-acid" : "text-mute"
                              }`}
                            >
                              {c.t0.toFixed(1)}s
                            </span>
                            <span
                              className={`text-[13px] leading-snug ${
                                activeRow ? "text-cream" : "text-cream-2/80"
                              }`}
                            >
                              {c.text}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* hashtags */}
                <div className="mt-6 border-t border-line pt-5 pb-2">
                  <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
                    <Hash className="size-3.5 text-acid" /> ready to post
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {clip.hashtags.map((h) => (
                      <span key={h} className="chip">
                        #{h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
      {clip && showTikTok && (
        <TikTokDialog
          clip={clip}
          project={project}
          onClose={() => setShowTikTok(false)}
        />
      )}
    </>
  );
}

function CaptionKaraoke({
  caption,
  time,
}: {
  caption: { t0: number; t1: number; text: string };
  time: number;
}) {
  const words = caption.text.split(" ");
  const span = Math.max(0.1, caption.t1 - caption.t0);
  const perWord = span / words.length;
  const elapsed = time - caption.t0;
  return (
    <motion.p
      key={caption.t0}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-ink/70 px-4 py-2.5 text-center text-lg font-bold uppercase leading-tight tracking-tight backdrop-blur-sm md:text-xl"
    >
      {words.map((w, i) => {
        const state =
          elapsed >= (i + 1) * perWord ? "past" : elapsed >= i * perWord ? "now" : "next";
        return (
          <span
            key={i}
            className={`cap-word mr-1.5 inline-block ${
              state === "now"
                ? "text-acid"
                : state === "past"
                  ? "text-cream"
                  : "text-cream/35"
            }`}
          >
            {w}
          </span>
        );
      })}
    </motion.p>
  );
}
