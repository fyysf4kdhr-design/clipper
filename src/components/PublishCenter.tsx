"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LoaderCircle,
  TriangleAlert,
  ExternalLink,
  X,
  RotateCcw,
  BadgeCheck,
  Clock3,
  Send,
  Zap,
  CircleOff,
  Unplug,
} from "lucide-react";
import TikTokIcon from "./TikTokIcon";
import Thumb from "./Thumb";
import { timeAgo, fmtDuration } from "@/lib/format";
import { scoreColor } from "./ScoreDial";
import type { ConnectionView, JobView } from "@/lib/publishing";

function StatusChip({ job }: { job: JobView }) {
  if (job.status === "posted")
    return (
      <span className="chip border-[#25F4EE]/40 text-[#25F4EE]">
        <BadgeCheck className="size-3.5" /> posted
      </span>
    );
  if (job.status === "uploading")
    return (
      <span className="chip border-acid/40 text-acid">
        <LoaderCircle className="size-3.5 animate-spin" /> {job.progress}%
      </span>
    );
  if (job.status === "queued")
    return (
      <span className="chip">
        <Clock3 className="size-3.5" /> queued
      </span>
    );
  if (job.status === "failed")
    return (
      <span className="chip border-ember/50 text-ember">
        <TriangleAlert className="size-3.5" /> failed
      </span>
    );
  return (
    <span className="chip">
      <CircleOff className="size-3.5" /> canceled
    </span>
  );
}

export default function PublishCenter({
  initialConnection,
  initialJobs,
  mode,
  justConnected,
  oauthError,
}: {
  initialConnection: ConnectionView | null;
  initialJobs: JobView[];
  mode: "live" | "unavailable";
  justConnected: boolean;
  oauthError: string | null;
}) {
  const [conn, setConn] = useState(initialConnection);
  const [jobs, setJobs] = useState(initialJobs);
  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(
    justConnected
      ? "TikTok account connected."
      : oauthError
        ? "TikTok authorization failed — try again."
        : null,
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/publish", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setJobs(d.jobs ?? []);
        setConn(d.connection ?? null);
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const hasActive = jobs.some((j) =>
      ["queued", "uploading"].includes(j.status),
    );
    if (!hasActive) return;
    const iv = setInterval(refresh, 1500);
    return () => clearInterval(iv);
  }, [jobs, refresh]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(t);
  }, [banner]);

  async function connect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/integrations/tiktok", { method: "POST" });
      const d = await res.json();
      if (res.status === 409 && d.oauthUrl) {
        window.location.assign(d.oauthUrl);
        return;
      }
      if (d.connection) setConn(d.connection);
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    if (busy) return;
    setBusy("disconnect");
    try {
      await fetch("/api/integrations/tiktok", { method: "DELETE" });
      setConn(null);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function cancelJob(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/publish/${id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function retryJob(job: JobView) {
    setBusy(job.id);
    try {
      await fetch(`/api/clips/${job.clipId}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caption: job.caption,
          hashtags: job.hashtags,
          privacyLevel: job.privacyLevel,
        }),
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  const posted = jobs.filter((j) => j.status === "posted").length;
  const active = jobs.filter((j) =>
    ["queued", "uploading"].includes(j.status),
  ).length;

  return (
    <div>
      {banner && (
        <div
          className={`mb-6 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            oauthError
              ? "border-ember/40 bg-ember/10 text-ember"
              : "border-acid/40 bg-acid/10 text-acid"
          }`}
        >
          {oauthError ? (
            <TriangleAlert className="size-4" />
          ) : (
            <BadgeCheck className="size-4" />
          )}
          {banner}
        </div>
      )}

      {/* header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Distribution</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
            Publish Center<span className="text-acid">.</span>
          </h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-mute">
            {jobs.length} jobs · {active} active · {posted} live on TikTok
          </p>
        </div>
        <Link href="/studio" className="btn-ghost h-10 px-5 text-sm">
          Back to Studio
        </Link>
      </div>

      {/* connection card */}
      <div className="card spot mt-8 flex flex-col gap-5 p-5 sm:flex-row sm:items-center md:p-6">
        {conn ? (
          <>
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl border border-[#25F4EE]/30 bg-black">
                <TikTokIcon glitch className="size-6 text-cream" />
              </span>
              <div>
                <p className="flex items-center gap-2 text-lg font-semibold">
                  {conn.displayName ?? conn.handle}
                  <span
                    className={`chip !py-0.5 !text-[9px] ${
                      conn.mode === "live"
                        ? "border-[#25F4EE]/40 text-[#25F4EE]"
                        : "border-[#FE2C55]/40 text-[#FE2C55]"
                    }`}
                  >
                    {conn.mode}
                  </span>
                </p>
                <p className="font-mono text-xs text-mute">{conn.handle} · connected</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 sm:ml-auto">
              <button
                onClick={disconnect}
                disabled={busy === "disconnect"}
                className="btn-ghost h-10 px-4 text-sm"
              >
                {busy === "disconnect" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Unplug className="size-4" />
                )}
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl border border-line-2 bg-panel-2">
                <TikTokIcon className="size-6 text-mute" />
              </span>
              <div>
                <p className="text-lg font-semibold">No TikTok account connected</p>
                <p className="font-mono text-xs text-mute">
                  {mode === "live"
                    ? "oauth ready — authorize to start posting"
                    : "configure TikTok API credentials to enable live posting"}
                </p>
              </div>
            </div>
            <button
              onClick={connect}
              disabled={connecting || mode !== "live"}
              className="btn-acid h-11 px-6 text-sm sm:ml-auto"
            >
              {connecting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <TikTokIcon className="size-4" />
              )}
              {mode === "live" ? "Authorize with TikTok" : "TikTok unavailable"}
            </button>
          </>
        )}
      </div>

      {/* queue */}
      <div className="mt-8">
        <p className="eyebrow mb-4">Upload queue</p>
        {jobs.length === 0 ? (
          <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl border border-line-2 bg-panel-2">
              <Send className="size-6 text-[#25F4EE]" />
            </span>
            <p className="text-lg font-medium">Queue is empty</p>
            <p className="max-w-md text-sm leading-relaxed text-cream-2">
              Open any clip and hit{" "}
              <span className="font-medium text-cream">Post to TikTok</span>, or
              arm the autopilot on a project and let high-scoring cuts publish
              themselves.
            </p>
            <Link href="/studio" className="btn-acid mt-2 h-10 px-5 text-sm">
              Open Studio
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="card spot card-hover flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <Link
                    href={`/project/${job.projectId}`}
                    className="relative aspect-[9/16] w-11 shrink-0 overflow-hidden rounded-lg bg-panel-2"
                  >
                    <Thumb
                      videoId={job.projectVideoId}
                      alt={job.clipTitle}
                      className="size-full scale-[1.6] object-cover object-center"
                    />
                    <span className="absolute left-1 top-1 rounded bg-acid px-1 font-mono text-[9px] font-bold text-ink">
                      #{job.clipIdx}
                    </span>
                  </Link>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <p className="truncate text-[15px] font-medium">
                        {job.clipTitle}
                      </p>
                      {job.autoQueued && (
                        <span className="chip !py-0.5 !text-[9px] border-acid/40 text-acid">
                          <Zap className="size-2.5" /> autopilot
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-wider text-mute">
                      {job.projectTitle} ·{" "}
                      <span style={{ color: scoreColor(job.clipScore) }}>
                        {job.clipScore}
                      </span>{" "}
                      · {fmtDuration(job.clipStart)}–{fmtDuration(job.clipEnd)} ·{" "}
                      {timeAgo(job.createdAt)}
                    </p>
                    <p className="mt-1 line-clamp-1 text-[13px] italic text-cream-2/80">
                      “{job.caption}”{" "}
                      <span className="not-italic text-mute">
                        {job.hashtags.slice(0, 3).map((h) => `#${h}`).join(" ")}
                      </span>
                    </p>
                    {job.status === "uploading" && (
                      <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-cream/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] transition-[width] duration-700"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}
                    {job.error && (
                      <p className="mt-1.5 line-clamp-2 font-mono text-[11px] leading-snug text-ember">
                        {job.error}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2.5 sm:flex-col sm:items-end">
                  <StatusChip job={job} />
                  <div className="flex items-center gap-2">
                    {job.status === "posted" && job.remoteUrl && (
                      <a
                        href={job.remoteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost h-8 px-3 text-xs"
                      >
                        Open <ExternalLink className="size-3" />
                      </a>
                    )}
                    {["queued", "uploading"].includes(job.status) && (
                      <button
                        onClick={() => cancelJob(job.id)}
                        disabled={busy === job.id}
                        aria-label="Cancel job"
                        className="btn-ghost h-8 w-8 !rounded-lg !p-0"
                      >
                        {busy === job.id ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : (
                          <X className="size-3.5" />
                        )}
                      </button>
                    )}
                    {["failed", "canceled"].includes(job.status) && (
                      <button
                        onClick={() => retryJob(job)}
                        disabled={busy === job.id}
                        className="btn-ghost h-8 px-3 text-xs"
                      >
                        {busy === job.id ? (
                          <LoaderCircle className="size-3 animate-spin" />
                        ) : (
                          <RotateCcw className="size-3" />
                        )}
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
