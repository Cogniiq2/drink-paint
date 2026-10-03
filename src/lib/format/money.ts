import { site } from "@/config/site";

export function formatMoney(cents: number, currency: string = site.locale.currency, locale: string = site.locale.default): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** "54 €" style for placards; always whole euros when possible. */
export const formatPrice = (cents: number, currency?: string) => formatMoney(cents, currency);

export function vatIncluded(totalCents: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.round(totalCents - totalCents / (1 + rate / 100));
}
