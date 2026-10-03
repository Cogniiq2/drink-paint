-- BoLaGio Atelier — initial schema
-- Inventory rule: remaining = capacity - confirmed tickets - active holds.
-- All writes from the application go through the service role; the anon role
-- can only read published events through the public_events view.

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
create type event_status as enum ('draft', 'published', 'cancelled', 'archived');
create type order_status as enum ('pending', 'paid', 'cancelled', 'expired', 'refunded', 'requires_review');
create type hold_status as enum ('active', 'converted', 'released', 'expired');
create type ticket_status as enum ('valid', 'checked_in', 'cancelled', 'refunded');
create type waitlist_status as enum ('waiting', 'notified', 'converted', 'removed');
create type inquiry_status as enum ('new', 'contacted', 'closed');
create type voucher_status as enum ('draft', 'active', 'redeemed', 'expired', 'void');

-- ── updated_at trigger ──────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── site_settings ───────────────────────────────────────────────────────────
create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── events ──────────────────────────────────────────────────────────────────
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  edition text,
  subtitle text,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  doors_at timestamptz not null check (doors_at <= starts_at),
  capacity integer not null check (capacity >= 0),
  price_cents integer not null check (price_cents >= 0),
  currency char(3) not null default 'EUR',
  vat_rate numeric(4,2) not null default 19.00,
  minimum_age integer check (minimum_age is null or minimum_age between 0 and 99),
  status event_status not null default 'draft',
  sales_open_at timestamptz,
  sales_close_at timestamptz,
  hero_image_path text not null default '/media/table-wide.webp',
  hero_image_alt text not null default '',
  max_tickets_per_order integer not null default 6 check (max_tickets_per_order between 1 and 50),
  low_threshold integer not null default 14,
  few_threshold integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_public_idx on events (status, starts_at);
create trigger events_updated before update on events for each row execute function set_updated_at();

create table event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  path text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index event_media_event_idx on event_media (event_id, sort_order);

-- ── orders ──────────────────────────────────────────────────────────────────
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  event_id uuid not null references events(id),
  status order_status not null default 'pending',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency char(3) not null default 'EUR',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  marketing_consent boolean not null default false,
  terms_accepted_at timestamptz not null default now(),
  locale text not null default 'de-DE',
  paid_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_event_idx on orders (event_id, status);
create index orders_email_idx on orders (lower(email));
create index orders_created_idx on orders (created_at desc);
create trigger orders_updated before update on orders for each row execute function set_updated_at();

-- ── ticket_holds ────────────────────────────────────────────────────────────
create table ticket_holds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  order_id uuid not null references orders(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  expires_at timestamptz not null,
  status hold_status not null default 'active',
  created_at timestamptz not null default now()
);
create index holds_active_idx on ticket_holds (event_id) where status = 'active';
create index holds_order_idx on ticket_holds (order_id);

-- ── tickets ─────────────────────────────────────────────────────────────────
create table tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  event_id uuid not null references events(id),
  code text not null unique,
  status ticket_status not null default 'valid',
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);
create index tickets_event_idx on tickets (event_id) where status in ('valid', 'checked_in');
create index tickets_order_idx on tickets (order_id);

-- ── waitlist ────────────────────────────────────────────────────────────────
create table waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  email text not null,
  quantity integer not null default 1 check (quantity between 1 and 20),
  status waitlist_status not null default 'waiting',
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index waitlist_unique_idx on waitlist_entries (event_id, lower(email)) where status <> 'removed';

-- ── private inquiries ───────────────────────────────────────────────────────
create table private_event_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  event_type text not null,
  guests integer not null check (guests > 0),
  preferred_date date,
  alternative_date date,
  message text not null default '',
  status inquiry_status not null default 'new',
  created_at timestamptz not null default now()
);
create index inquiries_status_idx on private_event_inquiries (status, created_at desc);

-- ── vouchers (scaffold — not live until VOUCHERS_ENABLED) ───────────────────
create table vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  initial_value_cents integer not null check (initial_value_cents > 0),
  remaining_value_cents integer not null check (remaining_value_cents >= 0),
  currency char(3) not null default 'EUR',
  status voucher_status not null default 'draft',
  purchaser_email text,
  recipient_email text,
  recipient_name text,
  message text,
  order_id uuid references orders(id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger vouchers_updated before update on vouchers for each row execute function set_updated_at();

create table voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references vouchers(id),
  order_id uuid not null references orders(id),
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now()
);

-- ── testimonials (hidden until TESTIMONIALS_ENABLED and rows exist) ─────────
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  text text not null,
  event_id uuid references events(id) on delete set null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── stripe webhook idempotency ──────────────────────────────────────────────
create table stripe_webhook_events (
  id text primary key,            -- Stripe event id (evt_...)
  type text not null,
  processed_at timestamptz not null default now()
);

-- ── Inventory helpers ───────────────────────────────────────────────────────
create or replace function expire_stale_holds() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with expired as (
    update ticket_holds set status = 'expired'
    where status = 'active' and expires_at < now()
    returning order_id
  )
  update orders o set status = 'expired'
  from expired e where o.id = e.order_id and o.status = 'pending';
  get diagnostics n = row_count;
  return n;
end $$;

create or replace view event_inventory as
select
  e.id as event_id,
  coalesce((select count(*) from tickets t where t.event_id = e.id and t.status in ('valid','checked_in')), 0)::int as sold,
  coalesce((select sum(h.quantity) from ticket_holds h where h.event_id = e.id and h.status = 'active' and h.expires_at > now()), 0)::int as held
from events e;

-- Public-safe projection: only published events, never customer data.
create or replace view public_events with (security_invoker = false) as
select e.*, i.sold, i.held, greatest(0, e.capacity - i.sold - i.held) as remaining
from events e join event_inventory i on i.event_id = e.id
where e.status = 'published';

-- Atomic order + hold creation. Locks the event row so concurrent checkouts
-- serialise on the capacity check.
create or replace function create_order_with_hold(
  p_event_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_quantity integer,
  p_unit_price_cents integer,
  p_currency char(3),
  p_marketing_consent boolean,
  p_locale text,
  p_order_number text,
  p_hold_minutes integer
) returns table (order_id uuid, hold_id uuid, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_capacity integer;
  v_sold integer;
  v_held integer;
  v_remaining integer;
  v_order uuid;
  v_hold uuid;
  v_expires timestamptz := now() + make_interval(mins => p_hold_minutes);
begin
  perform expire_stale_holds();
  select capacity into v_capacity from events where id = p_event_id and status = 'published' for update;
  if not found then raise exception 'event_not_available'; end if;

  select sold, held into v_sold, v_held from event_inventory where event_id = p_event_id;
  v_remaining := v_capacity - v_sold - v_held;
  if p_quantity > v_remaining then
    raise exception 'insufficient_capacity' using detail = v_remaining::text;
  end if;

  insert into orders (order_number, event_id, first_name, last_name, email, phone, quantity,
    unit_price_cents, total_cents, currency, marketing_consent, locale)
  values (p_order_number, p_event_id, p_first_name, p_last_name, lower(p_email), p_phone, p_quantity,
    p_unit_price_cents, p_unit_price_cents * p_quantity, p_currency, p_marketing_consent, p_locale)
  returning id into v_order;

  insert into ticket_holds (event_id, order_id, quantity, expires_at)
  values (p_event_id, v_order, p_quantity, v_expires)
  returning id into v_hold;

  return query select v_order, v_hold, v_expires;
end $$;

-- Convert hold → tickets. Idempotent. If the hold already expired and seats are
-- gone, the order is flagged for manual review instead of overselling.
create or replace function confirm_order_paid(p_order_id uuid, p_payment_intent_id text)
returns order_status
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_capacity integer;
  v_sold integer;
  v_held integer;
  v_hold ticket_holds%rowtype;
  v_available integer;
  i integer;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status = 'paid' then return 'paid'; end if;

  perform 1 from events where id = v_order.event_id for update;
  select * into v_hold from ticket_holds where order_id = p_order_id order by created_at desc limit 1 for update;
  select capacity into v_capacity from events where id = v_order.event_id;
  select sold, held into v_sold, v_held from event_inventory where event_id = v_order.event_id;

  v_available := v_capacity - v_sold - v_held;
  if v_hold.id is not null and v_hold.status = 'active' and v_hold.expires_at > now() then
    v_available := v_available + v_hold.quantity;
  end if;

  if v_available < v_order.quantity then
    update orders set status = 'requires_review', stripe_payment_intent_id = p_payment_intent_id where id = p_order_id;
    return 'requires_review';
  end if;

  if v_hold.id is not null then
    update ticket_holds set status = 'converted' where id = v_hold.id;
  end if;

  for i in 1..v_order.quantity loop
    insert into tickets (order_id, event_id, code)
    values (p_order_id, v_order.event_id, upper(encode(gen_random_bytes(8), 'hex')));
  end loop;

  update orders set status = 'paid', paid_at = now(), stripe_payment_intent_id = p_payment_intent_id where id = p_order_id;
  return 'paid';
end $$;

create or replace function cancel_pending_order(p_order_id uuid, p_reason order_status)
returns void language plpgsql security definer set search_path = public as $$
begin
  update orders set status = p_reason where id = p_order_id and status = 'pending';
  update ticket_holds set status = 'released' where order_id = p_order_id and status = 'active';
end $$;

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table site_settings enable row level security;
alter table events enable row level security;
alter table event_media enable row level security;
alter table orders enable row level security;
alter table ticket_holds enable row level security;
alter table tickets enable row level security;
alter table waitlist_entries enable row level security;
alter table private_event_inquiries enable row level security;
alter table vouchers enable row level security;
alter table voucher_redemptions enable row level security;
alter table testimonials enable row level security;
alter table stripe_webhook_events enable row level security;

-- Anonymous/authenticated browser clients may only read published events and
-- their media. Every other table is service-role only (no policies = no access).
create policy "public read published events" on events for select to anon, authenticated using (status = 'published');
create policy "public read event media" on event_media for select to anon, authenticated
  using (exists (select 1 from events e where e.id = event_media.event_id and e.status = 'published'));
create policy "public read published testimonials" on testimonials for select to anon, authenticated using (published);

grant select on public_events to anon, authenticated;
revoke all on event_inventory from anon, authenticated;
