import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline — KLYP" };

export default function OfflinePage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-5">
      <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]" />
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-acid/[0.06] blur-[120px]" />
      <div className="relative text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-line-2 bg-panel">
          <WifiOff className="size-7 text-acid" />
        </span>
        <p className="eyebrow mt-8">no signal</p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight md:text-6xl">
          YOU&apos;RE OFFLINE<span className="text-acid">.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-cream-2">
          The clip engine needs a connection to reach YouTube and TikTok. Your
          installed app and already-rendered pages still work from cache.
        </p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="btn-acid mt-8 h-11 px-6 text-sm">
          Retry connection
        </a>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-mute">
          klyp shell — served from service worker cache
        </p>
      </div>
    </main>
  );
}
