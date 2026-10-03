"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Desktop-only, pointer-fine, motion-safe parallax using GSAP ScrollTrigger.
 * Loads GSAP lazily; on phones or with reduced motion it renders static.
 */
export function Parallax({ children, amount = 60, className = "" }: { children: ReactNode; amount?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ok = window.matchMedia("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
    if (!ok) return;
    let cleanup = () => {};
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const tween = gsap.fromTo(
        el,
        { y: amount },
        { y: -amount, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
      );
      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [amount]);
  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
