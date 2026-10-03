# Deploying to Cloudflare Workers

The app runs on Cloudflare Workers through [vinext](https://github.com/cloudflare/vinext)
(Next.js API surface on Vite). The standard Next.js scripts (`dev`, `build`, `start`) are
unchanged and still work; the Cloudflare build is a second, parallel build.

| File | Purpose |
| --- | --- |
| `wrangler.jsonc` | Worker config: name, entry, compatibility date/flags, assets, Images binding, cron |
| `vite.config.ts` | vinext + Cloudflare Vite plugin + Images optimizer (only used by `*:cf` scripts) |
| `worker/index.ts` | Worker entry: vinext `fetch` unchanged + `scheduled()` for the hourly reminder cron |
| `.dev.vars.example` | Template for local preview variables (copy to git-ignored `.dev.vars`) |
| `package.json` `"type": "module"` | Required by vinext/Vite 8 (server bundle must be emitted as `.js`) |

## Cloudflare dashboard (Workers Builds) settings

| Setting | Value |
| --- | --- |
| Root directory | `/` |
| Build command | `npm run build:cf` |
| Deploy command | `npx wrangler deploy` |
| Non-production branch deploy command | `npx wrangler versions upload` |
| Production branch | see "Branches" below |
| Worker name | `drink-paint` (must equal `name` in `wrangler.jsonc`; edit one or the other) |
| Compatibility date | `2026-09-01` (set in `wrangler.jsonc`) |
| Compatibility flags | `nodejs_compat` (set in `wrangler.jsonc`) |

`npm run build:cf` runs `vite build`, which writes `dist/` and a `.wrangler/deploy/config.json`
redirect. `wrangler deploy` follows that redirect, so no `--config` flag is needed.

### Build variables (Settings -> Build -> Variables and secrets)

These are read while the build runs and `NEXT_PUBLIC_*` values are inlined into the bundle.

| Name | Required | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | Production origin, no trailing slash, e.g. `https://www.example.de` |
| `NODE_VERSION` | recommended | `22` (also pinned by `.node-version`) |
| `NEXT_PUBLIC_HERO_FILM_ENABLED` | no | `true` once `public/media/hero-film.mp4` exists |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | no | `none` (default), `plausible`, `meta`, `console` |
| `NEXT_PUBLIC_META_PIXEL_ID` | only for `meta` | Pixel id |

No secret is needed at build time.

### Runtime variables and secrets (Worker -> Settings -> Variables and secrets)

Build variables are NOT available at runtime and vice versa. `NEXT_PUBLIC_SITE_URL` must be set in both places, identical.

| Name | Type | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | variable | Same value as the build variable |
| `SUPABASE_URL` | variable | Required in production. Without it the app falls back to the in-memory demo store, which must never serve a public Worker |
| `SUPABASE_SERVICE_ROLE_KEY` | secret | Required in production |
| `PUBLIC_SALES_ENABLED` | variable | Keep `false` until licensing is final, then `true` |
| `STRIPE_SECRET_KEY` | secret | Needed before sales open |
| `STRIPE_WEBHOOK_SECRET` | secret | From the Stripe webhook endpoint |
| `RESEND_API_KEY` | secret | Without it emails go to a dev console outbox and are not sent |
| `EMAIL_FROM` | variable | Verified Resend sender, e.g. `BoLaGio Atelier <tickets@your-domain>` |
| `EMAIL_REPLY_TO` | variable | optional |
| `PRIVATE_EVENTS_RECIPIENT` | variable | Inbox for private-event enquiries |
| `ADMIN_NOTIFICATION_EMAIL` | variable | Gets "order needs review" alerts |
| `ADMIN_PASSWORD` | secret | min 12 chars |
| `ADMIN_SESSION_SECRET` | secret | `openssl rand -hex 32` |
| `CRON_SECRET` | secret | min 16 chars; without it the hourly reminder job logs a warning and skips |
| `HOLD_MINUTES` | variable | optional, default `30` |
| `VOUCHERS_ENABLED`, `TESTIMONIALS_ENABLED` | variable | optional, default off |

`wrangler.jsonc` sets `keep_vars: true`, so variables you add in the dashboard are not wiped by deploys.

### Branches

Workers Builds deploys the **production branch** with the deploy command, and every other branch
with the non-production command (a preview version, no cron/traffic change). The very first
deployment of a Worker must be a production deploy because `wrangler versions upload` needs an
existing Worker. If the repository has no `main` yet, either merge this branch into `main` and use
it as production, or temporarily set the production branch to the feature branch for the first
deploy, then switch it back.

## Stripe webhook

Endpoint: `https://<your-domain>/api/stripe/webhook`. Events: `checkout.session.completed`,
`checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
`checkout.session.expired`, `charge.refunded`. Verification uses `constructEventAsync` because
Workers only offer asynchronous WebCrypto.

## Cron (replaces the Vercel cron)

`wrangler.jsonc` declares `"crons": ["0 * * * *"]` (hourly, UTC). `worker/index.ts` handles
`scheduled()` by calling the existing `/api/cron/reminders` route in-process with
`Authorization: Bearer $CRON_SECRET`. The HTTP route is unchanged. `vercel.json` is left in
place for Vercel deployments; run only one platform in production. Reminders are idempotent
(`reminder_sent_at`), so an accidental double schedule cannot double-send.
Cron triggers are applied by `wrangler deploy`, not by `versions upload`.

## Images

`next/image` URLs (`/_next/image`) are resized and served as AVIF/WebP through the Cloudflare
Images binding (`IMAGES` in `wrangler.jsonc`, no dashboard setup). If a transform fails the
original file is served instead. Cloudflare Images transformations have a free monthly allowance
of unique transformations; check current pricing for your account.

## Local preview in workerd

```bash
cp .dev.vars.example .dev.vars        # before building; the build copies it to dist/server/
npm run build:cf
npm run preview:cf                    # http://127.0.0.1:8787
```

Add `--test-scheduled` to `wrangler dev` to trigger the cron at `/cdn-cgi/handler/scheduled`.
Against a running preview: `QA_BASE_URL=http://127.0.0.1:8787 npm run qa`.

## Workers-specific behavior to know

- The clock is frozen at epoch while modules initialise, so time-dependent values must be read
  inside request handlers (the demo seed data and footer year were changed accordingly).
- `/media/*` static files are served by Workers Assets with revalidation (`max-age=0, must-revalidate`)
  rather than the one-year immutable header from `next.config.ts`, because `headers()` does not apply
  to static assets there. This is safe when real photos replace placeholders under the same filenames.
- vinext writes its own `.next/types/routes.d.ts`; `npm run typecheck` regenerates Next's first.
- Bundle size is about 1.5 MiB gzipped, within the Free plan limit (3 MiB) and Paid (10 MiB).
