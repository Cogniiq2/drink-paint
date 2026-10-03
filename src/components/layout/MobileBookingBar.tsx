"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Persistent bottom CTA on phones, visible only after the hero has scrolled
 * away and hidden again near the footer. Transform-only transitions.
 */
export function MobileBookingBar({ href, label, detail }: { href: string; label: string; detail?: string | null }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const nearBottom = window.innerHeight + y > document.body.scrollHeight - 480;
        setVisible(y > window.innerHeight * 0.8 && !nearBottom);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-30 px-4 transition-transform duration-500 ease-out"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", transform: visible ? "translateY(0)" : "translateY(120%)" }}
      aria-hidden={!visible}
    >
      <Link href={href} tabIndex={visible ? 0 : -1} className="btn btn-primary w-full !justify-between shadow-[0_18px_40px_-16px_rgb(0_0_0/0.5)]">
        <span>{label}</span>
        {detail && <span className="text-xs opacity-75 font-normal">{detail}</span>}
      </Link>
    </div>
  );
}
