-- Run the entire file in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  country_code text default 'NG',
  created_at timestamptz not null default now()
);

create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('Movie','Series')),
  year integer,
  genre text[] not null default '{}',
  synopsis text,
  poster_url text,
  backdrop_url text,
  playback_url text,
  rating text,
  featured boolean not null default false,
  published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles(id) on delete cascade,
  season_number integer not null,
  title text,
  unique(title_id, season_number)
);

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  episode_number integer not null,
  title text not null,
  synopsis text,
  duration_seconds integer,
  playback_asset_id text,
  created_at timestamptz not null default now(),
  unique(season_id, episode_number)
);

create table if not exists public.watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,title_id)
);

create table if not exists public.watch_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  episode_id uuid references public.episodes(id) on delete cascade,
  position_seconds integer not null default 0,
  duration_seconds integer,
  updated_at timestamptz not null default now(),
  primary key(user_id,title_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('Basic','Standard','Premium')),
  status text not null default 'pending',
  provider text not null default 'paystack',
  provider_reference text unique,
  amount_minor integer,
  currency text default 'NGN',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_reference text unique,
  event_type text not null,
  payload jsonb not null default '{}',
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name) values(new.id, coalesce(new.raw_user_meta_data->>'display_name',''));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.titles enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;
alter table public.watchlist enable row level security;
alter table public.watch_progress enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;

create policy "Profiles readable by owner" on public.profiles for select to authenticated using (auth.uid()=id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "Profiles editable by owner" on public.profiles for update to authenticated using (auth.uid()=id) with check (auth.uid()=id);
create policy "Public can view published titles" on public.titles for select to anon, authenticated using (published=true or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "Admins can add titles" on public.titles for insert to authenticated with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "Admins can edit titles" on public.titles for update to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "Admins can delete titles" on public.titles for delete to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "Published seasons visible" on public.seasons for select to anon, authenticated using (exists(select 1 from public.titles t where t.id=title_id and t.published=true) or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "Published episodes visible" on public.episodes for select to anon, authenticated using (exists(select 1 from public.seasons s join public.titles t on t.id=s.title_id where s.id=season_id and t.published=true) or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "Users manage own watchlist" on public.watchlist for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Users manage own progress" on public.watch_progress for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "Users read own subscriptions" on public.subscriptions for select to authenticated using (auth.uid()=user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
-- Subscription writes should be done only by a trusted server/webhook in production. Do not add a public INSERT policy.
create policy "Admins read payment events" on public.payment_events for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- After creating your account, promote YOUR user ID using the SQL editor:
-- update public.profiles set role='admin' where id='YOUR-AUTH-USER-UUID';
