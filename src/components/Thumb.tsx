"use client";

import { useState } from "react";

/** YouTube thumbnail with graceful maxres → hq fallback. */
export default function Thumb({
  videoId,
  alt,
  className = "",
}: {
  videoId: string;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState(
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
  );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => {
        const hq = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        if (src !== hq) setSrc(hq);
      }}
      className={className}
      draggable={false}
    />
  );
}
