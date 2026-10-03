# Launch checklist

## Before the site goes public (sales still locked)

- [ ] Supabase project created, `supabase/migrations/0001_init.sql` applied
- [ ] `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` set on Vercel (server only)
- [ ] `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` set; log in at `/admin`
- [ ] `RESEND_API_KEY`, `EMAIL_FROM` (verified domain), `EMAIL_REPLY_TO`
- [ ] `PRIVATE_EVENTS_RECIPIENT`, `ADMIN_NOTIFICATION_EMAIL`
- [ ] `CRON_SECRET` set (reminder cron in `vercel.json`)
- [ ] `NEXT_PUBLIC_SITE_URL` = production domain (also used for OG/JSON-LD)
- [ ] Real photography in `public/media/` (same filenames); hero film + `NEXT_PUBLIC_HERO_FILM_ENABLED=true`
- [ ] Impressum fields filled in `/admin/settings` (or `src/content/de/legal/placeholders.ts`) – no `{{…}}` left
- [ ] Datenschutz reviewed by counsel; hosting/database/email providers named
- [ ] Ticketbedingungen finalised: withdrawal (§ 312g Abs. 2 Nr. 9 BGB), cancellation, transfer
- [ ] FAQ policy answers set in `/admin/settings` (transfer, cancel)
- [ ] First evenings created in `/admin/events` and published
- [ ] Instagram handle in `src/config/site.ts`

## Before sales open

- [ ] Stripe account live; `STRIPE_SECRET_KEY`, webhook endpoint `/api/stripe/webhook` with `STRIPE_WEBHOOK_SECRET`
- [ ] Webhook events enabled: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`
- [ ] Stripe dashboard: cards, Apple Pay, Google Pay, PayPal on; delayed methods (SEPA, Klarna) off
- [ ] Test purchase in Stripe test mode end to end (hold → paid → email → QR)
- [ ] `PUBLIC_SALES_ENABLED=true`
- [ ] Analytics decision: `NEXT_PUBLIC_ANALYTICS_PROVIDER` (none/plausible/meta); consent banner appears automatically for providers that need it
- [ ] Lighthouse on `/` and an event page on a throttled phone profile

## Day-to-day

- New evening: `/admin/events/new` or duplicate an existing one
- Sold out → waitlist grows; when seats return, `/admin/waitlist` → "benachrichtigen"
- Change/cancel: `/admin/events/[id]` → "Gäste informieren"
- Check-in: `/admin/attendees` (search by name or reference), CSV export for the door list
- Orders flagged "zu prüfen" were paid after their hold expired and must be refunded manually in Stripe, then marked refunded
