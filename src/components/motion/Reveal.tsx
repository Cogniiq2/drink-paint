"use client";

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

/**
 * IntersectionObserver-driven reveal. Adds `.is-in` once; CSS does the rest
 * (opacity/transform only). No GSAP needed, no layout thrash.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  scale = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "figure" | "li" | "p" | "h2" | "h3" | "span";
  scale?: boolean;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.unobserve(el);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Comp = Tag as "div";
  return (
    <Comp ref={ref as never} className={`${scale ? "reveal-scale" : "reveal"} ${className}`} style={{ ...style, ["--delay" as string]: `${delay}ms` }}>
      {children}
    </Comp>
  );
}
