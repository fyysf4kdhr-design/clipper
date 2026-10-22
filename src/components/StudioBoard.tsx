"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Clapperboard,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import ClipInput from "./ClipInput";
import Thumb from "./Thumb";
import { fmtDuration, timeAgo } from "@/lib/format";
import { scoreColor } from "./ScoreDial";

type Row = {
  id: string;
  url: string;
  videoId: string;
  title: string;
  channel: string;
  durationSeconds: number | null;
  status: string;
  createdAt: string;
  clipCount: number;
  topScore: number | null;
};

export default function StudioBoard({ projects }: { projects: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(projects);
  const [deleting, setDeleting] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/projects?limit=48", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setRows(d.projects ?? []);
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const hasProcessing = rows.some((r) => r.status === "processing");
    if (!hasProcessing) return;
    const iv = setInterval(refresh, 3000);
    return () => clearInterval(iv);
  }, [rows, refresh]);

  async function remove(id: string) {
    if (deleting) return;
    setDeleting(id);
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setRows((r) => r.filter((p) => p.id !== id));
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  const totalClips = rows.reduce((a, r) => a + r.clipCount, 0);

  return (
    <div>
      {/* header */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Studio</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
            Your clip library
            <span className="text-acid">.</span>
          </h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-mute">
            {rows.length} videos · {totalClips} clips generated
          </p>
        </div>
        <div className="w-full max-w-xl">
          <ClipInput size="md" autoFocus={rows.length === 0} />
        </div>
      </div>

      {/* grid */}
      {rows.length === 0 ? (
        <div className="card mt-12 flex flex-col items-center gap-4 px-6 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-2xl border border-line-2 bg-panel-2">
            <Clapperboard className="size-6 text-acid" />
          </div>
          <p className="text-lg font-medium">Nothing clipped yet</p>
          <p className="max-w-sm text-sm text-cream-2">
            Paste your first YouTube link above. The engine needs about sixteen
            seconds to hand you a cut list.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <div key={p.id} className="card spot card-hover group relative overflow-hidden">
              <Link href={`/project/${p.id}`} className="block">
                <div className="relative aspect-video overflow-hidden bg-panel-2">
                  <Thumb
                    videoId={p.videoId}
                    alt={p.title}
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-2">
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
                      <span
                        className="font-mono text-sm font-semibold"
                        style={{ color: scoreColor(p.topScore) }}
                      >
                        {p.topScore}
                      </span>
                    )}
                    <ArrowUpRight className="size-4 text-mute transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cream" />
                  </div>
                </div>
              </Link>
              <button
                onClick={() => remove(p.id)}
                disabled={deleting === p.id}
                aria-label="Delete project"
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg border border-line-2 bg-ink/70 text-mute opacity-0 backdrop-blur transition-all hover:border-ember/50 hover:text-ember group-hover:opacity-100 disabled:opacity-50"
              >
                {deleting === p.id ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
