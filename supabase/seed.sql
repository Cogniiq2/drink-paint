-- Development seed. Replace with real evenings via /admin.
insert into site_settings (key, value) values
  ('public_sales_enabled', 'false'::jsonb),
  ('instagram_url', '"https://www.instagram.com/bolagioatelier/"'::jsonb),
  ('contact_email', '"hallo@bolagio-atelier.de"'::jsonb)
on conflict (key) do nothing;

insert into events (slug, title, edition, subtitle, description, starts_at, ends_at, doors_at, capacity, price_cents, minimum_age, status, hero_image_path, hero_image_alt)
values
  ('paint-the-night-no-01', 'Paint the Night', 'No. 01', 'Eröffnungsabend',
   'Ein Abend an einem langen Tisch. Wir beginnen mit einem Glas, dann mit der Leinwand.',
   now() + interval '12 days', now() + interval '12 days 3 hours', now() + interval '12 days' - interval '30 minutes',
   20, 5400, 18, 'published', '/media/table-wide.webp', 'Langer Tisch mit Leinwänden und Weingläsern');
