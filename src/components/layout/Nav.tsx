"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { copy } from "@/content/de/copy";

const links = [
  { href: "/events", label: copy.nav.evenings },
  { href: "/atelier", label: copy.nav.atelier },
  { href: "/private-events", label: copy.nav.privateEvents },
  { href: "/faq", label: copy.nav.faq },
];

/**
 * Floats transparent over the hero (`overHero`), becomes a minimal solid bar
 * after ~80px of scroll. Mobile: full-screen dialog menu with focus trap.
 */
export function Nav({ overHero = false, ctaHref = "/events" }: { overHero?: boolean; ctaHref?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  // Menu is "open for a path": navigating closes it without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (v: boolean) => setOpenPath(v ? pathname : null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 80);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = dialogRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenPath(null);
        triggerRef.current?.focus();
      }
      if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>("a, button");
        const firstEl = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dark = overHero && !scrolled;
  const bar = scrolled
    ? "bg-[color:var(--ivory)]/92 text-ink backdrop-blur-md hairline-b"
    : dark
      ? "text-ivory"
      : "text-ink";

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-40 transition-[background-color,color,box-shadow] duration-500 ease-out ${bar}`} style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="container-x mx-auto max-w-[1680px] flex items-center justify-between h-16 md:h-[4.5rem]">
          <Wordmark className={dark ? "fade" : ""} />
          <nav aria-label="Hauptnavigation" className="hidden md:flex items-center gap-8">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined} className="relative text-sm tracking-wide py-2 group">
                  {l.label}
                  <span className={`absolute left-0 right-0 -bottom-0.5 h-px bg-current origin-left transition-transform duration-300 ease-out ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} aria-hidden="true" />
                </Link>
              );
            })}
            <Link href={ctaHref} className={`btn ${dark ? "btn-outline !text-ivory !border-ivory/60 hover:!border-ivory" : "btn-primary"} !min-h-10 !py-2.5 !px-5 text-sm`}>
              {copy.nav.cta}
            </Link>
          </nav>
          <button
            ref={triggerRef}
            type="button"
            className="md:hidden inline-flex items-center gap-3 h-11 px-2 -mr-2 text-sm tracking-wide"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <span>Menü</span>
            <span aria-hidden="true" className="flex flex-col gap-1.5">
              <span className="block h-px w-6 bg-current" />
              <span className="block h-px w-6 bg-current" />
            </span>
            <span className="sr-only">{copy.nav.menuOpen}</span>
          </button>
        </div>
      </header>

      {open && (
        <div
          id="mobile-menu"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menü"
          className="fixed inset-0 z-50 surface-dark flex flex-col fade"
          style={{ animationDuration: "0.35s", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="container-x flex items-center justify-between h-16">
            <Wordmark />
            <button type="button" className="h-11 px-2 -mr-2 text-sm tracking-wide" onClick={() => { setOpen(false); triggerRef.current?.focus(); }}>
              Schließen
            </button>
          </div>
          <nav aria-label="Mobile Navigation" className="container-x flex-1 flex flex-col justify-center gap-2">
            {links.map((l, i) => (
              <Link key={l.href} href={l.href} className="font-display text-4xl leading-tight py-2 rise" style={{ ["--delay" as string]: `${80 + i * 60}ms` }}>
                {l.label}
              </Link>
            ))}
            <Link href={ctaHref} className="btn btn-primary mt-8 self-start rise" style={{ ["--delay" as string]: "380ms" }}>
              {copy.nav.cta}
            </Link>
          </nav>
          <div className="container-x py-6 text-sm text-muted flex gap-6">
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
          </div>
        </div>
      )}
    </>
  );
}
