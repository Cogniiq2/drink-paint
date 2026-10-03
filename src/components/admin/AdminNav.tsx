"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/admin";

const items = [
  { href: "/admin", label: "Übersicht" },
  { href: "/admin/events", label: "Abende" },
  { href: "/admin/attendees", label: "Gäste" },
  { href: "/admin/waitlist", label: "Warteliste" },
  { href: "/admin/inquiries", label: "Anfragen" },
  { href: "/admin/settings", label: "Einstellungen" },
];

export function AdminNav() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;
  return (
    <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Admin">
      {items.map((i) => {
        const active = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={`px-3 py-1.5 rounded-xs whitespace-nowrap ${active ? "bg-ink text-ivory" : "hover:bg-stone-100"}`}>
            {i.label}
          </Link>
        );
      })}
      <form action={logout}>
        <button className="px-3 py-1.5 text-muted hover:text-ink">Abmelden</button>
      </form>
    </nav>
  );
}
