"use client";

import { useSyncExternalStore } from "react";

type PwaSnapshot = {
  canInstall: boolean;
  installed: boolean;
  isIos: boolean;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SERVER_SNAPSHOT: PwaSnapshot = {
  canInstall: false,
  installed: false,
  isIos: false,
};

let snapshot: PwaSnapshot = SERVER_SNAPSHOT;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  snapshot = { ...snapshot };
  listeners.forEach((l) => l());
}

export function initPwa() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;

  const ua = window.navigator.userAgent;
  const isIos =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  snapshot = {
    canInstall: false,
    installed: standalone,
    isIos: isIos && !standalone,
  };
  emit();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    snapshot = { ...snapshot, canInstall: true };
    emit();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    snapshot = { ...snapshot, installed: true, canInstall: false };
    emit();
  });
}

export type InstallOutcome =
  | "accepted"
  | "dismissed"
  | "ios"
  | "installed"
  | "unavailable";

export async function promptInstall(): Promise<InstallOutcome> {
  if (snapshot.installed) return "installed";
  if (deferredPrompt) {
    const evt = deferredPrompt;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === "accepted") {
      deferredPrompt = null;
      snapshot = { ...snapshot, installed: true, canInstall: false };
      emit();
      return "accepted";
    }
    return "dismissed";
  }
  if (snapshot.isIos) return "ios";
  return "unavailable";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function usePwa(): PwaSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

/** Child components can ask the provider to surface the install banner. */
export function requestInstallBanner() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("klyp:show-install"));
  }
}
