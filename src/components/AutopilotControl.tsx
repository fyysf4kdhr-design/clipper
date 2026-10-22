"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Zap, LoaderCircle, ArrowRight } from "lucide-react";
import TikTokIcon from "./TikTokIcon";

const SCORE_OPTIONS = [60, 65, 70, 75, 80, 85, 90, 95];

export default function AutopilotControl({
  projectId,
  initialEnabled,
  initialMinScore,
}: {
  projectId: string;
  initialEnabled: boolean;
  initialMinScore: number;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [minScore, setMinScore] = useState(initialMinScore);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/integrations/tiktok")
      .then((r) => r.json())
      .then((d) => setHandle(d.connection?.handle ?? null))
      .catch(() => null);
  }, []);

  function flash(text: string) {
    setMsg(text);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 5000);
  }

  async function apply(nextEnabled: boolean, nextScore: number) {
    if (saving) return;
    setSaving(true);
    try {
      if (nextEnabled && !handle) {
        const r = await fetch("/api/integrations/tiktok", { method: "POST" });
        const d = await r.json();
        if (r.status === 409 && d.oauthUrl) {
          window.location.assign(d.oauthUrl);
          return;
        }
        if (d.connection) setHandle(d.connection.handle);
        else {
          setEnabled(false);
          flash(d.message ?? "could not connect TikTok");
          return;
        }
      }
      const res = await fetch(`/api/projects/${projectId}/autopilot`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled, minScore: nextScore }),
      });
      const d = await res.json();
      if (!res.ok) {
        flash(d.message ?? "autopilot error");
        if (d.error === "not_connected") setEnabled(false);
        return;
      }
      if (nextEnabled) {
        flash(
          d.queued > 0
            ? `${d.queued} clip${d.queued === 1 ? "" : "s"} queued for TikTok`
            : "autopilot armed — new cuts auto-post",
        );
      } else {
        flash("autopilot off");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <span className="chip">
        <Zap className="size-3.5 text-acid" /> autopilot
      </span>
      <span className="text-sm text-cream-2">
        auto-post every clip scoring ≥{" "}
        <span className="font-mono text-cream">{minScore}</span> to TikTok
      </span>
      <select
        value={minScore}
        disabled={saving}
        onChange={(e) => {
          const v = Number(e.target.value);
          setMinScore(v);
          if (enabled) apply(true, v);
        }}
        className="rounded-lg border border-line-2 bg-panel-2 px-2.5 py-1.5 font-mono text-sm outline-none focus:border-acid/50 disabled:opacity-50"
      >
        {SCORE_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <button
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle TikTok autopilot"
        disabled={saving}
        onClick={() => {
          const v = !enabled;
          setEnabled(v);
          apply(v, minScore);
        }}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-60 ${
          enabled
            ? "border-acid bg-acid shadow-[0_0_16px_rgba(200,255,46,0.45)]"
            : "border-line-2 bg-panel-2"
        }`}
      >
        <span
          className={`absolute top-[2.5px] size-[17px] rounded-full transition-all ${
            enabled ? "left-[24px] bg-ink" : "left-[3px] bg-cream-2"
          }`}
        />
      </button>

      {saving && <LoaderCircle className="size-4 animate-spin text-mute" />}

      {msg ? (
        <span className="font-mono text-[11px] text-acid">{msg}</span>
      ) : enabled && handle ? (
        <Link
          href="/publish"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-mute transition-colors hover:text-cream"
        >
          <TikTokIcon className="size-3" /> posting to {handle} — view queue
          <ArrowRight className="size-3" />
        </Link>
      ) : null}
    </div>
  );
}
