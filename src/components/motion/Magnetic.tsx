"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Tiny magnetic response for desktop CTAs. Transform-only, pointer-fine only. */
export function Magnetic({ children, strength = 0.18 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const target = el.firstElementChild as HTMLElement | null;
    if (!target) return;
    target.style.transition = "transform 0.35s cubic-bezier(0.16,1,0.3,1)";
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      target.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };
    const leave = () => {
      target.style.transform = "";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return (
    <div ref={ref} className="inline-block p-2 -m-2">
      {children}
    </div>
  );
}
