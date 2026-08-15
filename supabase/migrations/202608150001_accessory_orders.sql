-- Accessory order storage for Smarter Capture.
--
-- Lives in the shared OrbitStack Supabase project, which uses one schema per
-- app (orbitstack, gamespeak, wanderbites, ...). Smarter Capture follows that
-- convention: everything here is in the `smartercapture` schema.
--
-- Access model: server-only, via a direct Postgres connection as the
-- dedicated smartercapture_app role (see the provisioning block at the end).
-- The schema is deliberately NOT exposed through PostgREST, and anon /
-- authenticated get nothing — the browser can never reach this data.

create extension if not exists pgcrypto;

create schema if not exists smartercapture;

grant usage on schema smartercapture to service_role;
revoke all on schema smartercapture from anon, authenticated;

create table if not exists smartercapture.accessory_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  stripe_session_id text not null unique,
  stripe_payment_intent_id text unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb not null,
  currency text not null check (char_length(currency) = 3),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_charged_cents integer not null check (shipping_charged_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  payment_status text not null default 'PAID' check (payment_status in ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  fulfillment_status text not null default 'NEEDS_ORDERING' check (fulfillment_status in (
    'NEW', 'PAID', 'NEEDS_ORDERING', 'ORDERED_FROM_SUPPLIER', 'SHIPPED',
    'DELIVERED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED', 'SUPPLIER_ISSUE'
  )),
  supplier_order_number text,
  actual_product_cost_cents integer check (actual_product_cost_cents is null or actual_product_cost_cents >= 0),
  actual_shipping_cost_cents integer check (actual_shipping_cost_cents is null or actual_shipping_cost_cents >= 0),
  ordered_at timestamptz,
  expected_delivery date,
  carrier text,
  tracking_number text,
  tracking_url text,
  notes jsonb not null default '[]'::jsonb check (jsonb_typeof(notes) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists smartercapture.accessory_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references smartercapture.accessory_orders(id) on delete cascade,
  product_id text not null,
  product_slug text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0 and quantity <= 10),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  supplier_name text not null,
  supplier_product_url text not null,
  supplier_variant text not null,
  supplier_estimated_cost_cents integer check (supplier_estimated_cost_cents is null or supplier_estimated_cost_cents >= 0),
  expected_profit_cents integer,
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create table if not exists smartercapture.accessory_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references smartercapture.accessory_orders(id) on delete cascade,
  stripe_event_id text unique,
  event_type text not null,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists accessory_orders_fulfillment_created_idx
  on smartercapture.accessory_orders (fulfillment_status, created_at desc);
create index if not exists accessory_orders_customer_email_idx
  on smartercapture.accessory_orders (lower(customer_email));
create index if not exists accessory_order_items_product_created_idx
  on smartercapture.accessory_order_items (product_id, created_at desc);

alter table smartercapture.accessory_orders enable row level security;
alter table smartercapture.accessory_order_items enable row level security;
alter table smartercapture.accessory_order_events enable row level security;

revoke all on smartercapture.accessory_orders from anon, authenticated;
revoke all on smartercapture.accessory_order_items from anon, authenticated;
revoke all on smartercapture.accessory_order_events from anon, authenticated;
grant all on smartercapture.accessory_orders to service_role;
grant all on smartercapture.accessory_order_items to service_role;
grant all on smartercapture.accessory_order_events to service_role;

create or replace function smartercapture.record_accessory_checkout_order(
  p_stripe_event_id text,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text,
  p_customer_email text,
  p_customer_name text,
  p_customer_phone text,
  p_shipping_address jsonb,
  p_currency text,
  p_subtotal_cents integer,
  p_shipping_charged_cents integer,
  p_total_cents integer,
  p_product_id text,
  p_product_slug text,
  p_product_name text,
  p_quantity integer,
  p_unit_price_cents integer,
  p_supplier_name text,
  p_supplier_product_url text,
  p_supplier_variant text,
  p_supplier_estimated_cost_cents integer,
  p_expected_profit_cents integer
)
returns table (order_id uuid, order_number text)
language plpgsql
security definer
set search_path = smartercapture
as $$
#variable_conflict use_column
declare
  v_order_id uuid;
  v_order_number text;
begin
  if p_stripe_event_id is null or p_stripe_session_id is null then
    raise exception 'Stripe identifiers are required';
  end if;
  if p_customer_email is null or p_customer_name is null or p_shipping_address is null then
    raise exception 'Customer delivery details are required';
  end if;
  if p_quantity < 1 or p_quantity > 10 then
    raise exception 'Quantity is outside the supported range';
  end if;

  select ao.id, ao.order_number
    into v_order_id, v_order_number
    from smartercapture.accessory_orders ao
   where ao.stripe_session_id = p_stripe_session_id;

  if v_order_id is null then
    v_order_number := 'SC-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    insert into smartercapture.accessory_orders (
      order_number, stripe_session_id, stripe_payment_intent_id,
      customer_name, customer_email, customer_phone, shipping_address,
      currency, subtotal_cents, shipping_charged_cents, total_cents,
      payment_status, fulfillment_status
    ) values (
      v_order_number, p_stripe_session_id, p_stripe_payment_intent_id,
      p_customer_name, lower(p_customer_email), p_customer_phone, p_shipping_address,
      lower(p_currency), p_subtotal_cents, p_shipping_charged_cents, p_total_cents,
      'PAID', 'NEEDS_ORDERING'
    )
    returning id into v_order_id;
  else
    update smartercapture.accessory_orders
       set payment_status = 'PAID',
           fulfillment_status = case when fulfillment_status in ('NEW', 'PAID') then 'NEEDS_ORDERING' else fulfillment_status end,
           stripe_payment_intent_id = coalesce(stripe_payment_intent_id, p_stripe_payment_intent_id),
           updated_at = now()
     where id = v_order_id;
  end if;

  insert into smartercapture.accessory_order_items (
    order_id, product_id, product_slug, product_name, quantity, unit_price_cents,
    supplier_name, supplier_product_url, supplier_variant,
    supplier_estimated_cost_cents, expected_profit_cents
  ) values (
    v_order_id, p_product_id, p_product_slug, p_product_name, p_quantity, p_unit_price_cents,
    p_supplier_name, p_supplier_product_url, p_supplier_variant,
    p_supplier_estimated_cost_cents, p_expected_profit_cents
  ) on conflict (order_id, product_id) do nothing;

  insert into smartercapture.accessory_order_events (
    order_id, stripe_event_id, event_type, from_status, to_status, note
  ) values (
    v_order_id, p_stripe_event_id, 'STRIPE_PAYMENT_CONFIRMED', null, 'NEEDS_ORDERING', 'Payment confirmed by verified Stripe webhook.'
  ) on conflict (stripe_event_id) do nothing;

  return query select v_order_id, v_order_number;
end;
$$;

revoke all on function smartercapture.record_accessory_checkout_order(
  text, text, text, text, text, text, jsonb, text, integer, integer, integer,
  text, text, text, integer, integer, text, text, text, integer, integer
) from public, anon, authenticated;
grant execute on function smartercapture.record_accessory_checkout_order(
  text, text, text, text, text, text, jsonb, text, integer, integer, integer,
  text, text, text, integer, integer, text, text, text, integer, integer
) to service_role;

-- ---------------------------------------------------------------------------
-- App role provisioning (run once per environment; password managed outside
-- source control — set it as a SCRAM verifier or via the dashboard, and put
-- the resulting connection string in DATABASE_URL).
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'smartercapture_app') then
    create role smartercapture_app login noinherit;
  end if;
end $$;
-- alter role smartercapture_app with login password '<set out-of-band>';
grant usage on schema smartercapture to smartercapture_app;
grant select, insert, update on smartercapture.accessory_orders to smartercapture_app;
grant select, insert, update on smartercapture.accessory_order_items to smartercapture_app;
grant select, insert, update on smartercapture.accessory_order_events to smartercapture_app;
grant execute on function smartercapture.record_accessory_checkout_order(
  text, text, text, text, text, text, jsonb, text, integer, integer, integer,
  text, text, text, integer, integer, text, text, text, integer, integer
) to smartercapture_app;
-- RLS is enabled with no policies for anon/authenticated; the app role gets
-- explicit permissive policies (it is not the table owner, so RLS applies).
drop policy if exists app_rw_orders on smartercapture.accessory_orders;
drop policy if exists app_rw_items on smartercapture.accessory_order_items;
drop policy if exists app_rw_events on smartercapture.accessory_order_events;
create policy app_rw_orders on smartercapture.accessory_orders for all to smartercapture_app using (true) with check (true);
create policy app_rw_items on smartercapture.accessory_order_items for all to smartercapture_app using (true) with check (true);
create policy app_rw_events on smartercapture.accessory_order_events for all to smartercapture_app using (true) with check (true);
