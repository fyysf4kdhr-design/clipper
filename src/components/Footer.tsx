import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink-2">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <p className="text-holo animate-holo text-3xl font-bold tracking-tight">
            KLYP<span className="glow-acid">.</span>
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-mute">
            An AI clipping engine for long-form video. Built for creators who
            would rather post than scrub timelines.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-4 font-mono text-[12px] uppercase tracking-[0.18em] text-cream-2">
          <Link href="/studio" className="transition-colors hover:text-cream">
            Studio
          </Link>
          <Link href="/publish" className="transition-colors hover:text-cream">
            Publish
          </Link>
          <Link href="/#how" className="transition-colors hover:text-cream">
            Pipeline
          </Link>
          <Link href="/#engine" className="transition-colors hover:text-cream">
            Engine
          </Link>
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-cream"
          >
            YouTube ↗
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-5 py-4 font-mono text-[11px] uppercase tracking-widest text-mute md:px-8">
          <span>© 2026 KLYP Labs — clip responsibly</span>
          <span>
            ffmpeg of the mind <span className="text-acid">/</span> est. render queue
            00:00:16
          </span>
        </div>
      </div>
    </footer>
  );
}
