"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  LoaderCircle,
  TriangleAlert,
  ExternalLink,
  RotateCcw,
  BadgeCheck,
  Send,
  Clock3,
} from "lucide-react";
import TikTokIcon from "./TikTokIcon";
import { fmtDuration } from "@/lib/format";
import type { ConnectionView } from "@/lib/publishing";
import type { ProjectData, ClipData } from "./ProjectView";

type JobLite = {
  id: string;
  status: string;
  progress: number;
  remoteUrl: string | null;
  error: string | null;
  scheduledFor: string | null;
};

function stageLabel(job: JobLite): string {
  if (job.scheduledFor && new Date(job.scheduledFor).getTime() > Date.now()) {
    const mins = Math.max(
      1,
      Math.round((new Date(job.scheduledFor).getTime() - Date.now()) / 60_000),
    );
    return `scheduled — uploads in ${mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`}`;
  }
  if (job.status === "queued") return "in queue — preparing render";
  const p = job.progress;
  if (p < 25) return "rendering 9:16 crop + captions";
  if (p < 65) return "uploading to TikTok";
  if (p < 99) return "processing on TikTok";
  return "publishing…";
}

export default function TikTokDialog({
  clip,
  project,
  onClose,
}: {
  clip: ClipData;
  project: ProjectData;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"live" | "unavailable">("unavailable");
  const [conn, setConn] = useState<ConnectionView | null>(null);
  const [loadingConn, setLoadingConn] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [caption, setCaption] = useState(clip.hook);
  const [tags, setTags] = useState(clip.hashtags.join(" "));
  const [privacy, setPrivacy] = useState("PUBLIC_TO_EVERYONE");
  const [schedule, setSchedule] = useState("now");
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<JobLite | null>(null);
  const jobIdRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/integrations/tiktok")
      .then((r) => r.json())
      .then((d) => {
        setConn(d.connection ?? null);
        setMode(d.mode ?? "unavailable");
        setLoadingConn(false);
      })
      .catch(() => setLoadingConn(false));

    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // poll active job
  const pollJob = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/publish/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      setJob(d.job);
    } catch {
      /* keep polling */
    }
  }, []);

  useEffect(() => {
    if (!job || !["queued", "uploading"].includes(job.status)) return;
    jobIdRef.current = job.id;
    const iv = setInterval(() => pollJob(job.id), 1200);
    return () => clearInterval(iv);
  }, [job, pollJob]);

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

  function trackJob(j: JobLite) {
    setJob(j);
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const scheduledFor =
        schedule === "now"
          ? null
          : new Date(
              Date.now() +
                (schedule === "15m" ? 15 : schedule === "1h" ? 60 : 180) * 60_000,
            ).toISOString();
      const res = await fetch(`/api/clips/${clip.id}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caption,
          hashtags: tags
            .split(/[\s,]+/)
            .map((t) => t.replace(/^#/, ""))
            .filter(Boolean),
          privacyLevel: privacy,
          scheduledFor,
        }),
      });
      const d = await res.json();
      if (res.status === 409 && d.error === "not_connected") {
        setConn(null);
        return;
      }
      if ((res.status === 201 || res.status === 409) && d.job) {
        trackJob(d.job);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel() {
    if (!job) return;
    await fetch(`/api/publish/${job.id}`, { method: "DELETE" });
    setJob(null);
  }

  if (!mounted) return null;

  const activeJob = job && ["queued", "uploading"].includes(job.status);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[130] grid place-items-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-ink/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="card relative w-full max-w-md overflow-hidden"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl border border-line-2 bg-black">
              <TikTokIcon glitch className="size-5 text-cream" />
            </span>
            <div>
              <p className="text-sm font-semibold">Post to TikTok</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-mute">
                {mode === "live" ? "content posting api — live" : "live posting unavailable"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg border border-line-2 text-cream-2 transition-colors hover:text-cream"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5">
          {/* clip strip */}
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-panel-2/50 p-3">
            <span className="rounded-md bg-acid px-2 py-0.5 font-mono text-[10px] font-bold text-ink">
              #{clip.idx}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{clip.title}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
                {fmtDuration(clip.startSeconds)}–{fmtDuration(clip.endSeconds)} ·
                score {clip.score} · {project.channel}
              </p>
            </div>
          </div>

          {loadingConn ? (
            <div className="flex h-40 items-center justify-center text-mute">
              <LoaderCircle className="size-5 animate-spin" />
            </div>
          ) : !conn ? (
            /* --- connect view --- */
            <div className="text-center">
              <TikTokIcon glitch className="mx-auto size-10 text-cream" />
              <p className="mt-4 text-lg font-semibold">Connect TikTok</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-cream-2">
                {mode === "live"
                  ? "Authorize KLYP with the TikTok Content Posting API to upload clips straight to your account."
                  : "Configure TikTok API credentials to authorize an account and publish real videos."}
              </p>
              <button
                onClick={connect}
                disabled={connecting || mode !== "live"}
                className="btn-acid mx-auto mt-6 h-11 px-6 text-sm"
              >
                {connecting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <TikTokIcon className="size-4" />
                )}
                {mode === "live" ? "Authorize with TikTok" : "TikTok unavailable"}
              </button>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-mute">
                {mode === "live"
                  ? "scope: user.info.basic, video.upload, video.publish"
                  : "configure TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET"}
              </p>
            </div>
          ) : job && job.status === "posted" ? (
            /* --- success --- */
            <div className="text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-acid/10">
                <BadgeCheck className="size-6 text-acid" />
              </span>
              <p className="mt-4 text-lg font-semibold">Posted to TikTok</p>
              <p className="mt-1.5 text-sm text-cream-2">
                Clip #{clip.idx} is live on{" "}
                <span className="text-cream">{conn.handle}</span>.
              </p>
              {job.remoteUrl && (
                <a
                  href={job.remoteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost mx-auto mt-5 h-10 px-5 text-sm"
                >
                  Open on TikTok <ExternalLink className="size-3.5" />
                </a>
              )}
              <div className="mt-6 flex justify-center gap-2.5">
                <button onClick={() => setJob(null)} className="btn-ghost h-10 px-4 text-sm">
                  <RotateCcw className="size-4" /> New post
                </button>
                <button onClick={onClose} className="btn-acid h-10 px-5 text-sm">
                  Done
                </button>
              </div>
            </div>
          ) : job && job.status === "failed" ? (
            /* --- failed --- */
            <div className="text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-ember/10">
                <TriangleAlert className="size-6 text-ember" />
              </span>
              <p className="mt-4 text-lg font-semibold">Upload failed</p>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-cream-2">
                {job.error ?? "TikTok rejected the upload."}
              </p>
              <div className="mt-6 flex justify-center gap-2.5">
                <button onClick={() => setJob(null)} className="btn-ghost h-10 px-4 text-sm">
                  <RotateCcw className="size-4" /> Try again
                </button>
                <button onClick={onClose} className="btn-ghost h-10 px-4 text-sm">
                  Close
                </button>
              </div>
            </div>
          ) : activeJob ? (
            /* --- progress --- */
            <div>
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <LoaderCircle className="size-4 animate-spin text-[#25F4EE]" />
                  {job.status === "queued" ? "Queued" : "Uploading"}
                </p>
                <span className="font-mono text-sm text-cream">{job.progress}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] shadow-[0_0_14px_rgba(37,244,238,0.45)] transition-[width] duration-700"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <p className="mt-3 font-mono text-[11px] text-mute">
                {stageLabel(job)}
              </p>
              <div className="mt-5 flex justify-end gap-2.5">
                <button onClick={cancel} className="btn-ghost h-9 px-4 text-sm">
                  Cancel
                </button>
                <button onClick={onClose} className="btn-ghost h-9 px-4 text-sm">
                  Run in background
                </button>
              </div>
            </div>
          ) : (
            /* --- form --- */
            <div>
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#25F4EE]/25 bg-[#25F4EE]/5 px-3 py-2">
                <TikTokIcon className="size-3.5 text-[#25F4EE]" />
                <span className="text-xs text-cream-2">
                  posting as <span className="font-medium text-cream">{conn.handle}</span>
                </span>
              </div>

              <label className="eyebrow">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                maxLength={2200}
                className="mt-1.5 w-full resize-none rounded-xl border border-line-2 bg-panel-2/60 px-3.5 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-acid/50"
              />

              <label className="eyebrow mt-4 block">Hashtags</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                spellCheck={false}
                className="mt-1.5 w-full rounded-xl border border-line-2 bg-panel-2/60 px-3.5 py-2.5 font-mono text-sm outline-none transition-colors focus:border-acid/50"
                placeholder="shorts viral clips"
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="eyebrow">Visibility</label>
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-line-2 bg-panel-2/60 px-3 py-2.5 text-sm outline-none focus:border-acid/50"
                  >
                    <option value="PUBLIC_TO_EVERYONE">Public</option>
                    <option value="MUTUAL_FOLLOW_FRIENDS">Mutual friends</option>
                    <option value="FOLLOWER_OF_CREATOR">Followers</option>
                    <option value="SELF_ONLY">Only me</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow">When</label>
                  <select
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-line-2 bg-panel-2/60 px-3 py-2.5 text-sm outline-none focus:border-acid/50"
                  >
                    <option value="now">Right now</option>
                    <option value="15m">In 15 minutes</option>
                    <option value="1h">In 1 hour</option>
                    <option value="3h">In 3 hours</option>
                  </select>
                </div>
              </div>

              {schedule !== "now" && (
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-mute">
                  <Clock3 className="size-3.5" /> sits in queue until its slot,
                  then uploads automatically
                </p>
              )}

              <button
                onClick={submit}
                disabled={submitting || !caption.trim()}
                className="btn-acid mt-5 h-11 w-full text-sm"
              >
                {submitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {schedule === "now" ? "Post to TikTok" : "Schedule post"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
