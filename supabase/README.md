# Database

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` (SQL editor or `supabase db push`).
3. Optionally run `seed.sql`.
4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the server environment.
   The service role key must never be exposed to the browser.

Operational notes:

- `expire_stale_holds()` is called inside `create_order_with_hold`, so holds
  expire lazily. For tidy reporting you can also schedule it with `pg_cron`:
  `select cron.schedule('expire-holds', '*/5 * * * *', $$select expire_stale_holds()$$);`
- Orders in `requires_review` were paid after their hold expired and the seats
  were gone. Refund them deliberately from the Stripe dashboard, then mark them
  refunded in `/admin`.
