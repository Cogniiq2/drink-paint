import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { getStore } from "@/lib/data";
import { env } from "@/config/env";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Operational shell: plain, fast, no cinematic styling. Pages gate themselves with requireAdmin(). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const mode = getStore().kind;
  const sales = env().PUBLIC_SALES_ENABLED;
  return (
    <div className="min-h-svh bg-[#f4f1ea] text-ink text-sm" style={{ fontFamily: "var(--font-sans)" }}>
      <header className="border-b border-hairline bg-white">
        <div className="mx-auto max-w-7xl px-5 h-14 flex items-center justify-between gap-6">
          <Link href="/admin" className="font-display text-lg">
            Atelier <span className="italic opacity-70">Admin</span>
          </Link>
          <AdminNav />
          <div className="flex items-center gap-3 text-xs">
            <span className={`px-2 py-1 rounded-xs ${mode === "memory" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>{mode === "memory" ? "Demo-Daten (kein Supabase)" : "Supabase"}</span>
            <span className={`px-2 py-1 rounded-xs ${sales ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-700"}`}>{sales ? "Verkauf aktiv" : "Verkauf gesperrt"}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
