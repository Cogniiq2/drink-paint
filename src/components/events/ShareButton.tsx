"use client";

import { useState } from "react";
import { copy } from "@/content/de/copy";

/** Web Share API on supporting devices; clipboard fallback elsewhere. */
export function ShareButton({ title, text, path }: { title: string; text: string; path: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* user cancelled */
    }
  };
  return (
    <button type="button" onClick={share} className="btn btn-ghost" aria-live="polite">
      <span>{done ? "Link kopiert" : copy.cta.share}</span>
      <span className="btn-underline" aria-hidden="true" />
    </button>
  );
}
