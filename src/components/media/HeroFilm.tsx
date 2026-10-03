"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Silent, looping hero film. Mounted only when the flag is on; starts loading
 * after the page is interactive and fades in over the poster — never LCP.
 * Honors reduced motion and Save-Data.
 */
export function HeroFilm({ src, srcMobile }: { src: string; srcMobile?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || nav.connection?.saveData) return;
    const start = () => setEnabled(true);
    if ("requestIdleCallback" in window) (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(start);
    else setTimeout(start, 600);
  }, []);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const v = ref.current;
    const onCanPlay = () => {
      setReady(true);
      v.play().catch(() => {});
    };
    v.addEventListener("canplay", onCanPlay);
    v.load();
    return () => v.removeEventListener("canplay", onCanPlay);
  }, [enabled]);

  if (!enabled) return null;
  const portrait = typeof window !== "undefined" && window.matchMedia("(max-width: 640px) and (orientation: portrait)").matches;

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out"
      style={{ opacity: ready ? 1 : 0 }}
    >
      <source src={portrait && srcMobile ? srcMobile : src} type="video/mp4" />
    </video>
  );
}
