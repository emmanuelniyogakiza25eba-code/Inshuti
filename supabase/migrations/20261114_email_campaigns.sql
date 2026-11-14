-- Campaign history and persistent Kigali morning drop queue.
alter table public.store_items add column if not exists notified_at timestamptz null;

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  intro_message text not null,
  product_ids text[] not null default '{}',
  product_payloads jsonb not null default '[]'::jsonb,
  recipient_count integer not null default 0,
  status text not null default 'sending' check (status in ('sending', 'sent', 'scheduled', 'failed')),
  sent_at timestamptz null,
  scheduled_for timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists email_campaigns_status_schedule_idx on public.email_campaigns (status, scheduled_for) where status = 'scheduled';
create index if not exists email_campaigns_created_at_idx on public.email_campaigns (created_at desc);
alter table public.email_campaigns enable row level security;
