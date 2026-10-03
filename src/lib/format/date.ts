import { site } from "@/config/site";

const TZ = site.locale.timeZone;
const LOCALE = site.locale.default;

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, ...opts });

export const formatWeekday = (iso: string) => fmt({ weekday: "long" }).format(new Date(iso));
export const formatWeekdayShort = (iso: string) => fmt({ weekday: "short" }).format(new Date(iso)).replace(".", "");
export const formatDateLong = (iso: string) => fmt({ day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
export const formatDateShort = (iso: string) => fmt({ day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
export const formatDay = (iso: string) => fmt({ day: "2-digit" }).format(new Date(iso));
export const formatMonthShort = (iso: string) => fmt({ month: "short" }).format(new Date(iso)).replace(".", "");
export const formatMonthLong = (iso: string) => fmt({ month: "long" }).format(new Date(iso));
export const formatYear = (iso: string) => fmt({ year: "numeric" }).format(new Date(iso));
export const formatTime = (iso: string) => fmt({ hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
export const formatDateTime = (iso: string) =>
  `${formatWeekday(iso)}, ${formatDateLong(iso)} · ${formatTime(iso)} Uhr`;

/** "Freitag, 14. November 2026" */
export const formatEventDate = (iso: string) => `${formatWeekday(iso)}, ${formatDateLong(iso)}`;
/** "19:00–22:30 Uhr" */
export const formatTimeRange = (startIso: string, endIso: string) => `${formatTime(startIso)}–${formatTime(endIso)} Uhr`;

/** Date-only string (YYYY-MM-DD) in the venue time zone, for grouping. */
export const toLocalDateKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

/** For <input type="datetime-local"> values in the venue time zone. */
export function toDateTimeLocalValue(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Parse a datetime-local string entered in the venue time zone to a UTC ISO
 * string. Handles DST by iterating the offset once.
 */
export function fromDateTimeLocalValue(value: string): string {
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm);
  const offset = tzOffsetMs(utcGuess);
  const corrected = utcGuess - offset;
  const offset2 = tzOffsetMs(corrected);
  return new Date(utcGuess - offset2).toISOString();
}

function tzOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(utcMs));
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return asUtc - utcMs;
}
