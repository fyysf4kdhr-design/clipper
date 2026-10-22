"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Download, Share, SquarePlus, MonitorSmartphone } from "lucide-react";
import { initPwa, promptInstall, usePwa } from "@/lib/usePwa";

const DISMISS_KEY = "klyp-install-dismissed";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function wasDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_MS;
  } catch {
    return false;
  }
}

export default function PwaProvider() {
  const { canInstall, installed, isIos } = usePwa();
  const [dismissed, setDismissed] = useState(true);
  const [visible, setVisible] = useState(false);
  const [iosSheet, setIosSheet] = useState(false);

  useEffect(() => {
    initPwa();
    setDismissed(wasDismissed());
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const force = () => setVisible(true);
    window.addEventListener("klyp:show-install", force);
    return () => window.removeEventListener("klyp:show-install", force);
  }, []);

  const eligible = (canInstall || isIos) && !installed && !dismissed;

  useEffect(() => {
    if (!eligible) return;
    const t = setTimeout(() => setVisible(true), 6000);
    return () => clearTimeout(t);
  }, [eligible]);

  function dismiss() {
    setVisible(false);
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
  }

  async function install() {
    const outcome = await promptInstall();
    if (outcome === "ios") {
      setVisible(false);
      setIosSheet(true);
      return;
    }
    setVisible(false);
  }

  const showBanner = visible && !installed;

  return (
    <>
      {/* ---------- install banner ---------- */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-4 z-[96] flex justify-center px-4"
          >
            <div className="card w-full max-w-md border-line-2 bg-panel/95 p-4 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              <div className="flex items-start gap-3.5">
                <Image
                  src="/icons/icon-192.png"
                  alt="KLYP app icon"
                  width={48}
                  height={48}
                  className="rounded-xl border border-line"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug">
                    Install KLYP on this device
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-cream-2">
                    Runs fullscreen from your home screen — and you can share
                    YouTube links straight into the clipper.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={install}
                      className="btn-acid h-9 px-4 text-[13px]"
                    >
                      <Download className="size-3.5" />
                      {isIos && !canInstall ? "How to install" : "Install app"}
                    </button>
                    <button
                      onClick={dismiss}
                      className="btn-ghost h-9 px-3.5 text-[13px]"
                    >
                      Not now
                    </button>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  aria-label="Dismiss"
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-mute transition-colors hover:text-cream"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- iOS instructions ---------- */}
      <AnimatePresence>
        {iosSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[125] grid place-items-center p-5"
          >
            <div
              className="absolute inset-0 bg-ink/80 backdrop-blur-md"
              onClick={() => setIosSheet(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }}
              className="card relative w-full max-w-sm p-6 text-center"
            >
              <MonitorSmartphone className="mx-auto size-8 text-acid" />
              <p className="mt-4 text-lg font-semibold">Add KLYP to your home screen</p>
              <ol className="mx-auto mt-4 max-w-xs space-y-3 text-left text-sm leading-relaxed text-cream-2">
                <li className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line-2 bg-panel-2 font-mono text-xs text-acid">
                    1
                  </span>
                  <span>
                    Tap <Share className="inline size-4 text-cream" />{" "}
                    <span className="text-cream">Share</span> in Safari
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line-2 bg-panel-2 font-mono text-xs text-acid">
                    2
                  </span>
                  <span>
                    Choose{" "}
                    <SquarePlus className="inline size-4 text-cream" />{" "}
                    <span className="text-cream">Add to Home Screen</span>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line-2 bg-panel-2 font-mono text-xs text-acid">
                    3
                  </span>
                  <span>Done — KLYP opens fullscreen like a native app.</span>
                </li>
              </ol>
              <button
                onClick={() => setIosSheet(false)}
                className="btn-acid mt-6 h-10 w-full text-sm"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
