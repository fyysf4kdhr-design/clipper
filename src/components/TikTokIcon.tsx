export default function TikTokIcon({
  className = "",
  glitch = false,
}: {
  className?: string;
  glitch?: boolean;
}) {
  const path =
    "M16.6 3c.35 2.2 1.9 3.9 4.4 4.1v3.05c-1.72 0-3.25-.52-4.4-1.46v6.13A5.82 5.82 0 1 1 10.8 9c.31 0 .62.02.92.06v3.13a2.72 2.72 0 1 0 1.88 2.6V3h3z";
  if (glitch) {
    return (
      <span className={`relative inline-block ${className}`}>
        <svg
          viewBox="0 0 24 24"
          fill="#25F4EE"
          className="absolute inset-0 -translate-x-[1.5px] translate-y-[1px] opacity-80"
          aria-hidden
        >
          <path d={path} />
        </svg>
        <svg
          viewBox="0 0 24 24"
          fill="#FE2C55"
          className="absolute inset-0 translate-x-[1.5px] -translate-y-[1px] opacity-80"
          aria-hidden
        >
          <path d={path} />
        </svg>
        <svg viewBox="0 0 24 24" fill="currentColor" className="relative" aria-hidden>
          <path d={path} />
        </svg>
      </span>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={path} />
    </svg>
  );
}
