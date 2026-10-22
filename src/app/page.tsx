import Image from "next/image";
import type { CSSProperties } from "react";
import {
  Link2,
  BrainCircuit,
  Scissors,
  Captions,
  Gauge,
  Send,
  Zap,
  ArrowRight,
} from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import ClipInput from "@/components/ClipInput";
import EngineViz from "@/components/EngineViz";
import FreshProjects from "@/components/FreshProjects";

const STATS = [
  { n: "2.4M+", l: "clips cut" },
  { n: "16s", l: "avg analysis" },
  { n: "98", l: "top viral score" },
  { n: "9:16", l: "vertical ready" },
];

const STEPS = [
  {
    n: "01",
    icon: Link2,
    title: "Paste the link",
    body: "Any YouTube URL — watch, youtu.be, Shorts, live recordings. We pull the source, metadata and audio track.",
  },
  {
    n: "02",
    icon: BrainCircuit,
    title: "The engine watches",
    body: "Word-level transcription, hook detection, emotional-peak mapping and loop analysis. Every second gets a virality score.",
  },
  {
    n: "03",
    icon: Scissors,
    title: "Collect the cuts",
    body: "Ranked, captioned, vertical-ready clips with hooks, hashtags and one-click export. You just post them.",
  },
];

const FEATURES = [
  {
    icon: Captions,
    title: "Word-perfect captions",
    body: "Karaoke-style timed captions generated per clip, tuned to read well on mute.",
  },
  {
    icon: Gauge,
    title: "Virality scoring",
    body: "Every candidate ranked 0–99 on hook strength, pacing, context independence and loopability.",
  },
  {
    icon: Send,
    title: "Auto-post to TikTok",
    body: "Connect once, then ship straight from the clip view — or arm the autopilot and let every cut above your threshold publish itself.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Nav />

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden pt-36 pb-20 md:pt-44">
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]" />
        <div
          aria-hidden
          className="animate-aurora-a absolute -top-32 -left-40 h-[560px] w-[720px] rounded-full bg-[radial-gradient(circle,rgba(200,255,46,0.11),transparent_65%)] blur-[100px]"
        />
        <div
          aria-hidden
          className="animate-aurora-b absolute -top-16 right-[-15%] h-[520px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(110,231,255,0.10),transparent_65%)] blur-[100px]"
        />
        <div
          aria-hidden
          className="absolute bottom-[-20%] left-1/3 h-[420px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.08),transparent_65%)] blur-[110px]"
        />

        <div className="relative mx-auto max-w-[1400px] px-5 md:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <Reveal>
                <span className="chip border-acid/35 bg-acid/[0.07] shadow-[0_0_30px_-6px_rgba(200,255,46,0.4)]">
                  <Zap className="size-3.5 text-acid" />
                  AI clip engine — now scoring virality
                </span>
              </Reveal>

              <Reveal delay={0.08}>
                <h1 className="mt-6 text-[13.5vw] font-bold leading-[0.94] tracking-[-0.04em] sm:text-6xl md:text-7xl xl:text-[86px]">
                  LONG VIDEOS IN.
                  <br />
                  <span className="text-holo animate-holo">VIRAL CLIPS</span>
                  <br />
                  OUT<span className="text-acid glow-acid">.</span>
                </h1>
              </Reveal>

              <div aria-hidden className="horizon mt-7 h-px max-w-md" />

              <Reveal delay={0.16}>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-2 md:text-lg">
                  KLYP watches your YouTube video end to end, finds the moments
                  worth sharing, and cuts them into scored, captioned,
                  vertical clips. No timeline scrubbing. No editing degree.
                </p>
              </Reveal>

              <Reveal delay={0.24} className="mt-9 max-w-2xl">
                <ClipInput showExamples />
              </Reveal>

              <Reveal delay={0.3}>
                <dl className="mt-12 grid max-w-xl grid-cols-2 gap-y-6 border-t border-line pt-6 sm:grid-cols-4">
                  {STATS.map((s) => (
                    <div key={s.l}>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">
                        {s.l}
                      </dt>
                      <dd className="mt-1 font-mono text-xl font-semibold text-cream md:text-2xl">
                        {s.n}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            {/* hero visual */}
            <Reveal delay={0.2} className="relative hidden lg:block">
              <div className="relative animate-float">
                <div className="beam" style={{ "--beam-r": "28px" } as CSSProperties}>
                  <div className="beam-inner relative overflow-hidden">
                    <Image
                      src="/images/hero-collage.png"
                      alt="Floating vertical clips being cut from a long video"
                      width={880}
                      height={1100}
                      priority
                      className="h-auto w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                    <div
                      aria-hidden
                      className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-holo/70 to-transparent"
                    />
                  </div>
                </div>
                {/* floating badges */}
                <div className="absolute -left-6 top-10 -rotate-3 rounded-xl border border-line-2 bg-ink/90 px-4 py-3 backdrop-blur">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-mute">
                    clip #1
                  </p>
                  <p className="font-mono text-lg font-semibold text-acid">
                    94 <span className="text-[10px] text-cream-2">viral</span>
                  </p>
                </div>
                <div className="absolute -right-4 bottom-16 rotate-2 rounded-xl border border-line-2 bg-ink/90 px-4 py-3 backdrop-blur">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-mute">
                    captions
                  </p>
                  <p className="text-sm font-medium">word-synced ✦ timed</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <Marquee
        dark
        items={[
          "auto captions",
          "hook detection",
          "virality score",
          "9:16 reframe",
          "zero scrubbing",
          "auto-post to TikTok",
          "autopilot queue",
        ]}
      />

      {/* ---------- HOW ---------- */}
      <section id="how" className="relative py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8">
          <Reveal>
            <p className="eyebrow">The pipeline</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
              Three steps.{" "}
              <span className="text-holo animate-holo">Sixteen seconds.</span>{" "}
              <span className="text-mute">Zero timelines.</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="card spot card-hover group relative h-full overflow-hidden p-7">
                  <span className="pointer-events-none absolute -right-4 -top-6 font-mono text-[100px] font-bold leading-none text-cream/[0.04] transition-colors group-hover:text-acid/10">
                    {s.n}
                  </span>
                  <div className="grid size-11 place-items-center rounded-xl border border-line-2 bg-panel-2">
                    <s.icon className="size-5 text-acid" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-cream-2">
                    {s.body}
                  </p>
                  <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-mute">
                    step {s.n} <span className="text-acid">/</span>{" "}
                    {i === 2 ? "done" : "auto"}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ENGINE ---------- */}
      <section id="engine" className="relative border-t border-line py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_20%,rgba(200,255,46,0.05),transparent)]" />
        <div className="relative mx-auto max-w-[1400px] px-5 md:px-8">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <Reveal>
              <p className="eyebrow">Under the hood</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
                It watches like an editor.{" "}
                <span className="text-holo animate-holo">
                  It scores like an algorithm.
                </span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <span className="chip">
                <span className="pulse-dot" /> model klyp-scout v2.4
              </span>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="mt-12">
            <div
              className="beam"
              style={{ "--beam-r": "22px" } as CSSProperties}
            >
              <EngineViz />
            </div>
          </Reveal>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <div className="card spot card-hover h-full p-6">
                  <f.icon className="size-5 text-acid" />
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream-2">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FRESH ---------- */}
      <section className="relative border-t border-line py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-8">
          <div className="flex items-end justify-between gap-6">
            <Reveal>
              <p className="eyebrow">Live wall</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                Fresh from the pipeline
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="hidden sm:block">
              <a href="/studio" className="btn-ghost h-10 px-5 text-sm">
                Open Studio <ArrowRight className="size-4" />
              </a>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="mt-10">
            <FreshProjects />
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative overflow-hidden border-t border-line py-28 md:py-36">
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
        <div className="animate-aurora-a absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-acid/[0.07] blur-[120px]" />
        <div className="animate-aurora-b absolute left-[18%] top-[28%] h-[300px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(110,231,255,0.08),transparent_65%)] blur-[100px]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center md:px-8">
          <Reveal>
            <p className="eyebrow">Ready when you are</p>
            <h2 className="mt-4 text-5xl font-bold leading-[0.95] tracking-[-0.03em] md:text-7xl">
              STOP SCRUBBING<span className="text-acid glow-acid">.</span>
              <br />
              <span className="text-holo animate-holo">START CLIPPING.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.15} className="mx-auto mt-10 max-w-xl">
            <ClipInput size="md" />
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
