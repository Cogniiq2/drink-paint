# BoLaGio Atelier — Architecture

This document is the contract between design, data and code. Read it before
changing the booking model.

## 1. Product shape

A small number of public **evenings** (events), each with ~20 seats, sold as
tickets through Stripe Checkout. Everything that is visible on the public site
is derived from the database. Nothing scarce is ever invented in the UI.

```
Visitor → Homepage → Event page → Quantity → Customer details → Stripe → Success
                                       │
                                       └─ hold created atomically (DB)  ──► webhook confirms → tickets
```

## 2. Stack

| Layer          | Choice                                    | Why                                                 |
| -------------- | ----------------------------------------- | --------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack)        | RSC keeps client JS small; Vercel-native            |
| Styling        | Tailwind v4 + CSS design tokens           | Tokens live in `globals.css`; Tailwind reads them   |
| Motion         | CSS first, GSAP + ScrollTrigger lazily    | Only scroll-linked work uses GSAP; loaded on demand |
| Data           | Supabase / PostgreSQL                     | Atomic inventory in SQL functions; RLS              |
| Payments       | Stripe Checkout (hosted)                  | No raw card data; wallets + PayPal via dashboard    |
| Email          | Resend (dev: console outbox)              | Plain HTML templates, no framework                  |
| Validation     | zod                                       | Every external input is parsed                      |

## 3. Data access

`src/lib/data/store.ts` defines a `DataStore` interface. Two implementations:

- `supabase-store.ts` — production. Uses the **service role** key on the server only.
- `memory-store.ts` — used automatically when Supabase env vars are absent. Seeded
  with demo evenings so the site can be developed and reviewed without credentials.
  State lives in-process (resets on restart). Never used when env vars exist.

Inventory maths is identical in both: `remaining = capacity − confirmed tickets − active holds`.

## 4. Inventory & holds (the scarcity engine)

- `create_hold(event, qty, minutes, order)` locks the event row (`FOR UPDATE`),
  computes remaining, and inserts a hold or raises `insufficient_capacity`.
- A **pending order + hold** are created *before* the Stripe session.
- Stripe Checkout `expires_at` is set to the hold expiry. Stripe enforces a
  minimum of 30 minutes, so `HOLD_MINUTES` defaults to 30. Shorter holds are
  allowed; if a payment lands after the hold expired, `confirm_order` tries to
  re-acquire seats and, failing that, marks the order `requires_review` (admin
  sees it, refund is a deliberate manual action — never automatic).
- Webhooks are idempotent: every Stripe event id is inserted into
  `stripe_webhook_events` first; duplicates are ignored.
- Payment truth comes only from verified webhooks. `/checkout/success` reads the
  order by Stripe session id and shows "we're confirming" until the webhook
  landed.

Availability thresholds (`low`, `few`) are per-event, with defaults in
`site_settings` / `src/config/site.ts`.

## 5. Feature flags

- `PUBLIC_SALES_ENABLED` — when false the site is live, events are visible,
  waitlist/notify works, but no Stripe session can be created.
- `NEXT_PUBLIC_HERO_FILM_ENABLED` — switch on once `/public/media/hero-film.mp4` exists.
- `VOUCHERS_ENABLED` — `/gutschein` shows a scaffolded "coming soon" state until true.
- `TESTIMONIALS_ENABLED` — social-proof section stays hidden until real reviews exist.

## 6. Routes

Public: `/`, `/events`, `/events/[slug]`, `/atelier`, `/private-events`,
`/gutschein`, `/faq`, `/contact`, `/waitlist`, `/checkout/[slug]`,
`/checkout/success`, `/checkout/cancelled`, `/impressum`, `/datenschutz`,
`/ticketbedingungen`.

Admin (password + signed cookie, see `src/lib/admin/auth.ts`): `/admin`,
`/admin/events`, `/admin/events/new`, `/admin/events/[id]`,
`/admin/attendees`, `/admin/waitlist`, `/admin/inquiries`, `/admin/login`.

API: `/api/stripe/webhook`, `/api/events/[slug]/availability`,
`/api/events/[slug]/calendar.ics`, `/api/admin/export`.

## 7. Content

Customer-facing German copy lives in `src/content/de/`. The brand name, address,
Instagram handle and contact data live in `src/config/site.ts` and can be
overridden from `site_settings` in the database. Legal texts are separate
modules with explicit `{{PLACEHOLDER}}` tokens — nothing is fabricated.

## 8. Internationalisation

Copy is accessed through `getCopy()` so an `/en` tree can be added by
introducing `src/content/en/` and a locale segment. Dates and money are
formatted with `Intl` using the active locale.
