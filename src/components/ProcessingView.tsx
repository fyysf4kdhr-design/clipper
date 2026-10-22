"use client";

import { useMemo } from "react";
import { Check, LoaderCircle, Clock3 } from "lucide-react";
import Thumb from "./Thumb";
import type { ProjectData, StageInfo } from "./ProjectView";

const STAGE_LABELS = [
  "Ingesting source",
  "Transcribing audio",
  "Detecting highlights",
  "Scoring virality",
];

const LOG_LINES: string[][] = [
  [
    "GET /watch?v={id} → 200 OK",
    "demux audio → 16kHz mono pcm",
    "frames sampled @ 1fps · scene cuts indexed",
  ],
  [
    "whisper-large stream attached",
    "aligned {words} words · confidence 0.{conf}",
    "speaker turns segmented · silence trimmed",
  ],
  [
    "scanning for hooks + tension arcs…",
    "{peaks} candidate peaks above threshold",
    "loop-alignment pass complete",
  ],
  [
    "ranking {peaks} candidates on 4 signals",
    "writing captions · picking crops",
    "finalizing cut list — almost there",
  ],
];

function seedOf(id: string): number {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0;
  return s;
}

export default function ProcessingView({
  project,
  stage,
}: {
  project: ProjectData;
  stage: StageInfo | null;
}) {
  const idx = stage?.index ?? 0;
  const overall = stage?.overall ?? 0.02;
  const pct = Math.round(overall * 100);

  const s = seedOf(project.videoId);
  const words = 900 + (s % 4200);
  const peaks = 6 + (s % 5);
  const conf = 88 + (s % 10);

  const lines = useMemo(() => {
    const out: { stageIdx: number; text: string }[] = [];
    for (let i = 0; i <= Math.min(idx, 3); i++) {
      for (const t of LOG_LINES[i]) {
        out.push({
          stageIdx: i,
          text: t
            .replace("{id}", project.videoId)
            .replace("{words}", words.toLocaleString())
            .replace("{peaks}", String(peaks))
            .replace("{conf}", String(conf)),
        });
      }
    }
    return out;
  }, [idx, project.videoId, words, peaks, conf]);

  // progress ring geometry
  const R = 84;
  const C = 2 * Math.PI * R;

  return (
    <div className="mx-auto max-w-4xl">
      {/* header */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line">
          <Thumb
            videoId={project.videoId}
            alt={project.title}
            className="aspect-video w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="truncate text-lg font-semibold">{project.title}</p>
            <p className="truncate font-mono text-[11px] uppercase tracking-widest text-mute">
              {project.channel} · {project.videoId}
            </p>
          </div>
        </div>

        {/* ring */}
        <div className="relative mt-2">
          <span
            aria-hidden
            className="animate-spin-slow absolute -inset-5 rounded-full border border-dashed border-holo/25"
          />
          <span
            aria-hidden
            className="absolute -inset-12 rounded-full bg-[radial-gradient(circle,rgba(110,231,255,0.08),transparent_65%)] blur-xl"
          />
          <svg width="200" height="200" className="relative -rotate-90">
            <defs>
              <linearGradient id="prg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C8FF2E" />
                <stop offset="100%" stopColor="#6EE7FF" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke="rgba(237,237,230,0.08)"
              strokeWidth="6"
            />
            <circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke="url(#prg)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - overall)}
              style={{
                transition: "stroke-dashoffset 0.8s linear",
                filter: "drop-shadow(0 0 10px rgba(110,231,255,0.5))",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-4xl font-semibold">{pct}%</span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-mute">
              analyzing
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        {/* stages */}
        <div className="card p-5">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-mute">
            Pipeline
          </p>
          <ul className="space-y-1">
            {STAGE_LABELS.map((label, i) => {
              const state = i < idx ? "done" : i === idx ? "active" : "pending";
              return (
                <li
                  key={label}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                    state === "active" ? "bg-acid/5" : ""
                  }`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full border ${
                      state === "done"
                        ? "border-acid/50 bg-acid/10"
                        : state === "active"
                          ? "border-acid/40"
                          : "border-line-2"
                    }`}
                  >
                    {state === "done" ? (
                      <Check className="size-3.5 text-acid" />
                    ) : state === "active" ? (
                      <LoaderCircle className="size-3.5 animate-spin text-acid" />
                    ) : (
                      <Clock3 className="size-3 text-mute" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        state === "pending" ? "text-mute" : "text-cream"
                      }`}
                    >
                      {label}
                    </p>
                    {state === "active" && stage && (
                      <p className="truncate font-mono text-[11px] text-acid/80">
                        {stage.detail}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* terminal */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="size-2.5 rounded-full bg-ember/70" />
            <span className="size-2.5 rounded-full bg-[#FFD52E]/70" />
            <span className="size-2.5 rounded-full bg-acid/70" />
            <span className="ml-2 font-mono text-[11px] uppercase tracking-widest text-mute">
              klyp-engine — stdout
            </span>
          </div>
          <div className="h-64 space-y-1.5 overflow-hidden p-4 font-mono text-[12px] leading-relaxed">
            {lines.map((l, i) => (
              <p key={`${l.stageIdx}-${i}`} className="flex gap-2">
                <span className="shrink-0 text-acid">→</span>
                <span className="text-cream-2/85">{l.text}</span>
              </p>
            ))}
            <p className="flex gap-2">
              <span className="shrink-0 text-acid">→</span>
              <span className="inline-block h-4 w-2 animate-pulse bg-acid" />
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-mute">
        usually wraps in ~16 seconds — no need to refresh
      </p>
    </div>
  );
}
