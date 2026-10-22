export default function Marquee({
  items,
  className = "",
  dark = false,
}: {
  items: string[];
  className?: string;
  dark?: boolean;
}) {
  const row = [...items, ...items, ...items, ...items];
  return (
    <div
      className={`relative overflow-hidden border-y ${
        dark ? "band-holo border-ink/10 text-ink" : "border-line bg-ink-2"
      } ${className}`}
    >
      {dark && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      )}
      <div className="flex w-max animate-marquee items-center py-3.5">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center" aria-hidden={half === 1}>
            {row.map((item, i) => (
              <span
                key={`${half}-${i}`}
                className="flex items-center gap-6 pr-6 font-mono text-[12px] font-medium tracking-[0.22em] uppercase whitespace-nowrap"
              >
                {item}
                <span className={dark ? "text-ink/50" : "text-acid"}>✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
