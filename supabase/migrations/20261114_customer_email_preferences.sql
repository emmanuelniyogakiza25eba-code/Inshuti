-- Customer profile and explicit marketing consent for INSHUTI arrival emails.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  marketing_opt_in boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Customers can read their own profile" on public.profiles;
create policy "Customers can read their own profile" on public.profiles for select to authenticated using (auth.uid() = id);

grant select on public.profiles to authenticated;

alter table public.store_subscribers add column if not exists full_name text not null default '';
alter table public.store_subscribers add column if not exists marketing_opt_in boolean not null default true;
create index if not exists profiles_marketing_opt_in_idx on public.profiles (marketing_opt_in) where marketing_opt_in = true;
create index if not exists store_subscribers_marketing_opt_in_idx on public.store_subscribers (marketing_opt_in) where marketing_opt_in = true;

create or replace function public.handle_new_inshuti_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, marketing_opt_in)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, true)
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else profiles.full_name end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_inshuti_profile on auth.users;
create trigger on_auth_user_created_inshuti_profile
after insert on auth.users
for each row execute procedure public.handle_new_inshuti_profile();
