"use client";

import { useState } from "react";
import { Download, Check } from "lucide-react";
import { promptInstall, requestInstallBanner, usePwa } from "@/lib/usePwa";

export default function InstallAppButton() {
  const { installed } = usePwa();
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        setFlash(null);
        return;
      }
      if (outcome === "ios" || outcome === "dismissed" || outcome === "unavailable") {
        // surface the banner/instructions path
        requestInstallBanner();
        return;
      }
      if (outcome === "installed") {
        setFlash("already installed");
        setTimeout(() => setFlash(null), 2000);
      }
    } finally {
      setBusy(false);
    }
  }

  if (installed) {
    return (
      <span className="btn-ghost h-9 cursor-default px-4 text-[13px] !text-acid">
        <Check className="size-3.5" /> Installed
      </span>
    );
  }

  return (
    <button onClick={onClick} className="btn-ghost h-9 px-4 text-[13px]">
      <Download className="size-3.5" />
      <span className="hidden sm:inline">{flash ?? "Get app"}</span>
    </button>
  );
}
