import Link from "next/link";
import { site } from "@/config/site";

export function Wordmark({ className = "", href = "/" }: { className?: string; href?: string }) {
  const [a, b] = site.brand.wordmark;
  return (
    <Link href={href} className={`inline-flex items-baseline gap-1.5 font-display text-[1.375rem] leading-none tracking-tight ${className}`} aria-label={`${site.brand.name} – Startseite`}>
      <span>{a}</span>
      <span className="italic opacity-80">{b}</span>
    </Link>
  );
}
