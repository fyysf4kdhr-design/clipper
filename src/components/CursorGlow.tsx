"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Holographic cursor aura + delegated spotlight positioning.
 * Any element with the `.spot` class receives --mx/--my CSS vars tracking
 * the pointer so its ::after glow follows the cursor — zero per-card JS.
 */
export default function CursorGlow() {
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-800);
  const y = useMotionValue(-800);
  const sx = useSpring(x, { stiffness: 150, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 150, damping: 22, mass: 0.6 });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);

    const move = (e: PointerEvent) => {
      x.set(e.clientX - 300);
      y.set(e.clientY - 300);
    };

    let last: Element | null = null;
    const spot = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.(".spot") ?? null;
      if (el !== last) last = el;
      if (last instanceof HTMLElement) {
        const r = last.getBoundingClientRect();
        last.style.setProperty("--mx", `${e.clientX - r.left}px`);
        last.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointermove", spot, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointermove", spot);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[92] size-[600px] mix-blend-screen"
      style={{
        x: sx,
        y: sy,
        background:
          "radial-gradient(circle, rgba(200,255,46,0.075) 0%, rgba(110,231,255,0.055) 32%, rgba(167,139,250,0.04) 52%, transparent 68%)",
      }}
    />
  );
}
