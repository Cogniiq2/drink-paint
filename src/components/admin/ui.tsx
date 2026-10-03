import type { ReactNode } from "react";

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => <div className={`bg-white border border-hairline rounded-md p-5 ${className}`}>{children}</div>;
export const Stat = ({ label, value, tone }: { label: string; value: ReactNode; tone?: "warn" }) => (
  <Card className={tone === "warn" ? "border-amber-300 bg-amber-50" : ""}>
    <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
    <p className="font-display text-3xl mt-1 tabular">{value}</p>
  </Card>
);
export const H1 = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 mb-6">
    <h1 className="font-display text-3xl">{children}</h1>
    {action}
  </div>
);
export const Table = ({ children }: { children: ReactNode }) => (
  <div className="bg-white border border-hairline rounded-md overflow-x-auto">
    <table className="w-full text-sm">{children}</table>
  </div>
);
export const Th = ({ children, className = "" }: { children?: ReactNode; className?: string }) => <th className={`text-left text-xs uppercase tracking-wider text-muted font-medium px-4 py-3 border-b border-hairline ${className}`}>{children}</th>;
export const Td = ({ children, className = "" }: { children?: ReactNode; className?: string }) => <td className={`px-4 py-3 border-b border-hairline align-top ${className}`}>{children}</td>;
export const Badge = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" }) => {
  const c = { neutral: "bg-stone-100 text-stone-700", ok: "bg-emerald-100 text-emerald-900", warn: "bg-amber-100 text-amber-900", bad: "bg-red-100 text-red-900" }[tone];
  return <span className={`inline-block px-2 py-0.5 rounded-xs text-xs ${c}`}>{children}</span>;
};
export const btn = "inline-flex items-center justify-center min-h-9 px-3 rounded-xs border border-ink bg-ink text-ivory text-sm hover:bg-wine hover:border-wine transition-colors disabled:opacity-50";
export const btnOutline = "inline-flex items-center justify-center min-h-9 px-3 rounded-xs border border-hairline-strong bg-white text-sm hover:border-ink transition-colors disabled:opacity-50";
export const input = "w-full min-h-10 px-3 rounded-xs border border-hairline-strong bg-white focus:border-ink outline-none";
export const label = "block text-xs text-muted mb-1";
