import { formatDay, formatMonthShort, formatWeekdayShort } from "@/lib/format/date";

/** Large placard numerals: "FR / 14 / NOV". */
export function DateBlock({ iso, className = "" }: { iso: string; className?: string }) {
  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <span className="eyebrow">{formatWeekdayShort(iso)}</span>
      <span className="font-display text-[4.5rem] md:text-[6rem] leading-[0.9] tabular mt-1">{formatDay(iso)}</span>
      <span className="eyebrow mt-2">{formatMonthShort(iso)}</span>
    </div>
  );
}
