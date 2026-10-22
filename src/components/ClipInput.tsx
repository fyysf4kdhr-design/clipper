"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, ArrowRight, LoaderCircle, TriangleAlert } from "lucide-react";

const EXAMPLES = [
  { label: "Me at the zoo", url: "https://www.youtube.com/watch?v=jNQXAC9IVRw" },
  { label: "3Blue1Brown — Neural nets", url: "https://www.youtube.com/watch?v=aircAruvnKk" },
  { label: "Gangnam Style", url: "https://www.youtube.com/watch?v=9bZkp7q19f0" },
];

export default function ClipInput({
  size = "lg",
  showExamples = false,
  autoFocus = false,
}: {
  size?: "lg" | "md";
  showExamples?: boolean;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(target?: string) {
    const value = (target ?? url).trim();
    if (!value || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: value, mediaUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(`/project/${data.project.id}`);
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  }

  const pad = size === "lg" ? "pl-14 pr-2 py-2" : "pl-12 pr-2 py-1.5";
  const height = size === "lg" ? "h-14 md:h-16" : "h-12";

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor="clip-source-media-url"
          className="font-mono text-[10px] uppercase tracking-widest text-mute"
        >
          Direct MP4 source for automatic clip rendering
        </label>
        <a
          href="https://cloudconvert.com/mp4-converter"
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] uppercase tracking-widest text-holo transition-colors hover:text-cream"
        >
          CloudConvert MP4 converter ↗
        </a>
      </div>
      <input
        id="clip-source-media-url"
        type="url"
        value={mediaUrl}
        onChange={(e) => setMediaUrl(e.target.value)}
        placeholder="https://media.example.com/source.mp4"
        spellCheck={false}
        className="mb-3 h-10 w-full rounded-xl border border-line-2 bg-panel/70 px-4 font-mono text-xs text-cream outline-none transition-colors placeholder:text-mute/70 focus:border-holo/50"
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={`relative flex w-full items-center rounded-full border bg-panel/80 backdrop-blur transition-all ${
          error
            ? "border-ember/60"
            : "border-line-2 focus-within:border-holo/50 focus-within:shadow-[0_0_45px_-8px_rgba(110,231,255,0.35)]"
        }`}
      >
        <Link2
          className={`absolute left-5 text-mute ${size === "lg" ? "size-5" : "size-4"}`}
        />
        <input
          value={url}
          autoFocus={autoFocus}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          placeholder="Paste a YouTube link — watch?v=…, youtu.be/…, /shorts/…"
          spellCheck={false}
          className={`${height} ${pad} w-full bg-transparent font-mono text-sm text-cream caret-acid outline-none md:text-[15px]`}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className={`btn-acid m-1.5 shrink-0 ${size === "lg" ? "h-11 px-5 md:h-[52px] md:px-7" : "h-9 px-4"} text-sm`}
        >
          {loading ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              <span className="hidden sm:inline">Analyzing link…</span>
            </>
          ) : (
            <>
              <span>Clip it</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {error && (
        <p className="mt-3 flex items-center gap-2 font-mono text-xs text-ember">
          <TriangleAlert className="size-3.5" /> {error}
        </p>
      )}

      {showExamples && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-mute">
            Try:
          </span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.url}
              type="button"
              disabled={loading}
              onClick={() => {
                setUrl(ex.url);
                submit(ex.url);
              }}
              className="chip cursor-pointer transition-colors hover:border-acid/50 hover:text-cream disabled:opacity-50"
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
