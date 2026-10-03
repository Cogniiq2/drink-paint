"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format/money";

/** Phone-only sticky action for event pages; hides while the purchase module is on screen. */
export function MobileEventBar({ priceCents, currency, label, href }: { priceCents: number; currency: string; label: string; href: string }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const target = document.getElementById("buchen");
    if (!target) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { threshold: 0.2 });
    io.observe(target);
    return () => io.disconnect();
  }, []);
  return (
    <div
      className="lg:hidden fixed inset-x-0 bottom-0 z-30 transition-transform duration-500 ease-out bg-ivory/95 backdrop-blur-md hairline-t"
      style={{ transform: hidden ? "translateY(110%)" : "translateY(0)", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden={hidden}
    >
      <div className="container-x flex items-center justify-between gap-4 py-3">
        <span className="font-display text-2xl tabular">
          {formatPrice(priceCents, currency)}
          <span className="font-sans text-xs text-muted ml-1.5">p. P.</span>
        </span>
        <Link href={href} tabIndex={hidden ? -1 : 0} className="btn btn-primary">
          {label}
        </Link>
      </div>
    </div>
  );
}
