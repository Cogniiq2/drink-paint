/** Every measurable event, typed. Providers only ever see these names. */
export type AnalyticsEvent =
  | { name: "homepage_view" }
  | { name: "event_view"; props: { slug: string; state: string } }
  | { name: "event_cta_click"; props: { slug: string; quantity: number } }
  | { name: "checkout_started"; props: { slug: string; quantity: number } }
  | { name: "checkout_completed"; props: { slug: string; quantity: number; valueCents: number } }
  | { name: "waitlist_signup"; props: { slug: string | null } }
  | { name: "private_event_lead"; props: { type: string } }
  | { name: "voucher_interest" };
