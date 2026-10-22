"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clapperboard, LoaderCircle } from "lucide-react";
import Thumb from "./Thumb";
import { fmtDuration, timeAgo } from "@/lib/format";

type Row = {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  durationSeconds: number | null;
  status: string;
  createdAt: string;
  clipCount: number;
  topScore: number | null;
};

export default function FreshProjects() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects?limit=6")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRows(d.projects ?? []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows === null) {
    return (
      <div className="flex h-40 items-center justify-center text-mute">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
        <Clapperboard className="size-8 text-mute" />
        <p className="text-cream-2">The pipeline is idle.</p>
        <p className="font-mono text-xs text-mute">
          paste a link above and the wall fills up in ~16 seconds
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((p, i) => (
        <Link
          key={p.id}
          href={`/project/${p.id}`}
          className="card spot card-hover group block overflow-hidden"
          style={{ transitionDelay: `${i * 20}ms` }}
        >
          <div className="relative aspect-video overflow-hidden bg-panel-2">
            <Thumb
              videoId={p.videoId}
              alt={p.title}
              className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
            <div className="absolute left-3 top-3">
              {p.status === "processing" ? (
                <span className="chip border-acid/40 bg-ink/70 text-acid backdrop-blur">
                  <span className="pulse-dot" /> processing
                </span>
              ) : (
                <span className="chip border-line-2 bg-ink/70 backdrop-blur">
                  {p.clipCount} clips
                </span>
              )}
            </div>
            {p.durationSeconds != null && (
              <span className="absolute bottom-3 right-3 rounded-md bg-ink/80 px-2 py-1 font-mono text-[11px] text-cream backdrop-blur">
                {fmtDuration(p.durationSeconds)}
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium leading-snug">
                {p.title}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-wider text-mute">
                {p.channel} · {timeAgo(p.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {p.topScore != null && (
                <span className="font-mono text-sm font-semibold text-acid">
                  {p.topScore}
                </span>
              )}
              <ArrowUpRight className="size-4 text-mute transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cream" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
