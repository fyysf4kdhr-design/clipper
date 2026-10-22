"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanSearch, FileAudio2, Gauge, Wand2 } from "lucide-react";

const TRANSCRIPT = [
  { t: "04:12", text: "…and that's when the entire model collapsed in training", hot: false },
  { t: "04:31", text: "nobody expects the loss curve to behave like that", hot: true },
  { t: "04:44", text: "so we rebuilt the dataset overnight, twice", hot: false },
  { t: "05:02", text: "the result genuinely surprised all of us", hot: true },
  { t: "05:18", text: "if you take one thing away, it's this", hot: true },
  { t: "05:26", text: "simple scales better than clever — always", hot: false },
];

const CANDIDATES = [
  { range: "04:29 → 05:07", score: 94, label: "cold open + payoff" },
  { range: "11:02 → 11:41", score: 88, label: "quotable one-liner" },
  { range: "19:55 → 20:33", score: 82, label: "loopable ending" },
];

export default function EngineViz() {
  const bars = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const x = Math.sin(i * 12.9898) * 43758.5453;
        const r = x - Math.floor(x);
        return 12 + Math.round(r * 88);
      }),
    [],
  );
  const [hotRow, setHotRow] = useState(1);
  const [candidate, setCandidate] = useState(0);

  useEffect(() => {
    const hot = TRANSCRIPT.map((r, i) => (r.hot ? i : -1)).filter((i) => i >= 0);
    let hi = 0;
    const iv = setInterval(() => {
      hi = (hi + 1) % hot.length;
      setHotRow(hot[hi]);
      setCandidate((c) => (c + 1) % CANDIDATES.length);
    }, 2600);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="beam-inner relative overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="pulse-dot" />
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cream-2">
            Engine room — live view
          </span>
        </div>
        <div className="flex h-5 items-end gap-[3px]" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="eq-bar"
              style={{ height: 18, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-2">
        {/* waveform */}
        <div className="relative border-b border-line p-5 md:border-r md:border-b-0">
          <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-mute">
            <FileAudio2 className="size-3.5 text-acid" /> audio energy
          </div>
          <div className="relative flex h-36 items-end gap-[3px] overflow-hidden">
            {bars.map((h, i) => {
              const inHot = i >= (hotRow * 11) % 60 && i <= ((hotRow * 11) % 60) + 12;
              return (
                <span
                  key={i}
                  className="flex-1 rounded-sm transition-colors duration-500"
                  style={{
                    height: `${h}%`,
                    background: inHot ? "#C8FF2E" : "rgba(237,237,230,0.16)",
                  }}
                />
              );
            })}
            <motion.div
              className="absolute inset-y-0 w-px bg-cream/80 shadow-[0_0_12px_rgba(237,237,230,0.8)]"
              animate={{ left: ["0%", "100%"] }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-mute">
            <span>00:00</span>
            <span className="text-acid">peak window locked</span>
            <span>24:16</span>
          </div>

          {/* candidate chip */}
          <div className="mt-5 h-[54px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={candidate}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="flex items-center justify-between rounded-xl border border-acid/30 bg-acid/5 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <ScanSearch className="size-4 text-acid" />
                  <span className="font-mono text-xs text-cream">
                    candidate <span className="text-acid">#{candidate + 1}</span>{" "}
                    {CANDIDATES[candidate].range}
                  </span>
                </div>
                <span className="font-mono text-xs text-cream-2">
                  {CANDIDATES[candidate].label} ·{" "}
                  <span className="font-semibold text-acid">
                    {CANDIDATES[candidate].score}
                  </span>
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* transcript */}
        <div className="relative overflow-hidden p-5">
          <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-mute">
            <Wand2 className="size-3.5 text-acid" /> transcript scan
          </div>
          <div className="space-y-2">
            {TRANSCRIPT.map((row, i) => {
              const active = i === hotRow;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-all duration-500 ${
                    active
                      ? "border-acid/40 bg-acid/5"
                      : "border-transparent bg-panel-2/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 font-mono text-[10px] ${active ? "text-acid" : "text-mute"}`}
                  >
                    {row.t}
                  </span>
                  <p
                    className={`text-[13px] leading-snug transition-colors duration-500 ${
                      active ? "text-cream" : "text-cream-2/70"
                    }`}
                  >
                    {row.text}
                  </p>
                  {active && (
                    <Gauge className="ml-auto mt-0.5 size-3.5 shrink-0 text-acid" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="scan-line" aria-hidden />
        </div>
      </div>
    </div>
  );
}
