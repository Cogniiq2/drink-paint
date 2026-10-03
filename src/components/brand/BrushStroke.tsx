"use client";

import { useEffect, useRef } from "react";

/**
 * The signature motif: one imperfect brush line that draws itself.
 * `mode="scroll"` ties progress to the element's position in the viewport,
 * `mode="enter"` draws once when visible, `mode="static"` renders fully drawn.
 * Pure SVG + stroke-dashoffset; GSAP is loaded lazily only for scroll mode.
 */
export function BrushStroke({
  mode = "enter",
  className = "",
  variant = "wide",
}: {
  mode?: "scroll" | "enter" | "static";
  className?: string;
  variant?: "wide" | "short";
}) {
  const ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = ref.current;
    if (!path || mode === "static") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    if (reduce) {
      path.style.strokeDashoffset = "0";
      return;
    }
    path.style.strokeDashoffset = `${length}`;

    if (mode === "enter") {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            path.style.transition = "stroke-dashoffset 1.6s cubic-bezier(0.65, 0, 0.35, 1)";
            path.style.strokeDashoffset = "0";
            io.disconnect();
          }
        },
        { threshold: 0.4 },
      );
      io.observe(path);
      return () => io.disconnect();
    }

    let cleanup = () => {};
    let cancelled = false;
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const tween = gsap.fromTo(
        path,
        { strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: path, start: "top 85%", end: "bottom 35%", scrub: 0.6 },
        },
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
  }, [mode]);

  const d =
    variant === "wide"
      ? "M4 38 C 120 10, 260 62, 400 34 S 700 8, 860 40 S 1120 70, 1196 30"
      : "M4 30 C 60 8, 140 52, 220 28 S 360 12, 436 32";
  const vb = variant === "wide" ? "0 0 1200 72" : "0 0 440 60";

  return (
    <svg viewBox={vb} className={`block w-full h-auto ${className}`} aria-hidden="true" preserveAspectRatio="none" focusable="false">
      <path
        ref={ref}
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={variant === "wide" ? 7 : 6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.9 }}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
