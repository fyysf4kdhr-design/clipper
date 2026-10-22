import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import InstallAppButton from "./InstallAppButton";

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-ink/60 backdrop-blur-2xl">
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-holo/40 to-transparent"
      />
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-acid">
            {/* cut mark */}
            <svg viewBox="0 0 24 24" className="size-4.5" fill="none">
              <path d="M4 19 L13 4 L16 7 L9 19 Z" fill="#07070C" />
              <rect x="14" y="15" width="7" height="3" rx="1.5" fill="#07070C" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight">
            KLYP
            <span className="ml-1 font-mono text-[10px] font-normal uppercase tracking-[0.3em] text-mute group-hover:text-acid">
              .ai
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 font-mono text-[12px] uppercase tracking-[0.18em] text-cream-2 md:flex">
          <Link href="/#how" className="transition-colors hover:text-cream">
            Pipeline
          </Link>
          <Link href="/#engine" className="transition-colors hover:text-cream">
            Engine
          </Link>
          <Link href="/studio" className="transition-colors hover:text-cream">
            Studio
          </Link>
          <Link href="/publish" className="transition-colors hover:text-cream">
            Publish
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <span className="chip hidden xl:inline-flex">
            <span className="pulse-dot" /> v2.4 live
          </span>
          <InstallAppButton />
          <Link href="/studio" className="btn-acid h-9 px-4 text-[13px]">
            Open Studio <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
