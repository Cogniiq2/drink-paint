# BoLaGio Atelier

Digital brand and ticketing platform for BoLaGio Atelier – a Paint & Drink
evening for ~20 guests in Bayreuth. Next.js 16, Tailwind 4, Supabase, Stripe,
Resend. German first, `/en`-ready.

## Quick start

```bash
npm install
cp .env.example .env.local      # leave Supabase/Stripe empty for the demo store
npm run dev                     # http://localhost:3000
```

Without Supabase credentials the site runs on an in-memory demo store with
four seeded evenings (one nearly full, one sold out, one not yet on sale).
Without a Stripe key, checkout ends on a clearly labelled payment simulator
that only works when `NEXT_PUBLIC_SITE_URL` is localhost.

Admin: `/admin` – set `ADMIN_PASSWORD` (≥12 chars) and `ADMIN_SESSION_SECRET`
(`openssl rand -hex 32`).

## Scripts

| Command             | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | Development server                                        |
| `npm run check`     | Lint + typecheck + production build                       |
| `npm run qa`        | End-to-end flow tests (needs a build; spawns port 3100)   |
| `npm run shots`     | Desktop/mobile screenshots of every page into `screenshots/` |
| `npm run placeholders` | Regenerate abstract placeholder media                  |

Playwright uses its bundled Chromium; set `CHROME_PATH` to use another binary.

## Where things live

- `src/config/site.ts` – brand name, address, Instagram, ticket defaults
- `src/content/de/` – all customer-facing copy, FAQ, legal placeholders
- `src/lib/data/` – `DataStore` interface, Supabase + in-memory implementations
- `src/lib/inventory/availability.ts` – the only place scarcity labels are derived
- `src/lib/payments/` – Stripe session creation and fulfilment
- `src/app/api/stripe/webhook` – payment truth, idempotent
- `src/lib/email/templates/` – transactional emails
- `supabase/migrations/0001_init.sql` – schema, RLS, atomic hold functions
- `docs/ARCHITECTURE.md`, `docs/LAUNCH-CHECKLIST.md`

## Media

`public/media/*` are generated placeholders. Replace them with real
photography using the same filenames (see `public/media/README.md`) and set
`NEXT_PUBLIC_HERO_FILM_ENABLED=true` once `hero-film.mp4` exists.
