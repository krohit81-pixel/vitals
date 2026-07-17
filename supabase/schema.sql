-- Nutri AI — Milestone 1 schema
-- Run via: supabase db push   (or paste into the SQL editor in the Supabase dashboard)

create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users — never store secrets here)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  diet_type text check (diet_type in ('vegetarian', 'vegan', 'non_vegetarian')) default 'non_vegetarian',
  activity_level text check (activity_level in ('sedentary','light','moderate','active','very_active')) default 'moderate',
  height_cm numeric,
  weight_kg numeric,
  age int,
  gender text check (gender in ('male','female','other','prefer_not_to_say')),
  allergies text[] default '{}',
  units text check (units in ('metric','imperial')) default 'metric',
  created_at timestamptz default now()
);

create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  calorie_target int not null default 2000,
  protein_target_g int not null default 120,
  carb_target_g int not null default 220,
  fat_target_g int not null default 65,
  fibre_target_g int not null default 30,
  water_target_ml int not null default 2500,
  goal_weight_kg numeric,
  updated_at timestamptz default now()
);

-- Needed for ON CONFLICT (user_id) in handle_new_user() below. Added via ALTER
-- rather than inline in the CREATE TABLE above, because CREATE TABLE IF NOT
-- EXISTS is a no-op on a database that already has this table — this way the
-- constraint gets added even on a database created before this fix existed.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'goals_user_id_key'
  ) then
    alter table public.goals add constraint goals_user_id_key unique (user_id);
  end if;
end $$;

create table if not exists public.meal_images (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  storage_path text not null, -- path within the `meal-photos` storage bucket
  created_at timestamptz default now()
);

create table if not exists public.meal_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  meal_image_id uuid references public.meal_images(id) on delete set null,
  meal_type text check (meal_type in ('breakfast','lunch','dinner','snack')) not null,
  source text check (source in ('photo','manual','voice','barcode')) not null default 'manual',
  raw_input text, -- original text/voice transcript, if applicable
  detected_items jsonb default '[]', -- [{name, quantity, unit, confidence}]
  calories numeric not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  fibre_g numeric not null default 0,
  sugar_g numeric not null default 0,
  sodium_mg numeric not null default 0,
  confidence numeric, -- 0-1, from the AI vision/estimation pass
  ai_explanation text,
  logged_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.daily_totals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  calories numeric not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  fibre_g numeric not null default 0,
  water_ml numeric not null default 0,
  unique (user_id, date)
);

create table if not exists public.weight_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  weight_kg numeric not null,
  body_fat_pct numeric,
  photo_url text,
  logged_at timestamptz default now()
);

create table if not exists public.ai_feedback (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  period text check (period in ('daily','weekly')) not null,
  summary text not null,
  recommendations jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists public.settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  dark_mode boolean default false,
  notifications jsonb default '{"breakfast": true, "lunch": true, "dinner": true, "water": true, "protein": true, "weekly_summary": true}',
  updated_at timestamptz default now()
);

-- Apple Health sync bridge (see workout_logs below) — added via ALTER since
-- CREATE TABLE IF NOT EXISTS is a no-op on a database that already has this table.
alter table public.settings add column if not exists health_connected boolean default false;
alter table public.settings add column if not exists health_sync_token_hash text;
alter table public.settings add column if not exists health_last_sync_at timestamptz;

create table if not exists public.workout_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  workout_type text check (workout_type in (
    'walking','running','elliptical','cycling','swimming','strength_training',
    'hiit','yoga','rowing','hiking','sports','other'
  )) not null,
  date date not null,
  start_time time not null default '00:00',
  duration_minutes int not null default 0,
  calories_burned numeric not null default 0,
  source text check (source in ('manual','apple_health')) not null default 'manual',
  health_workout_id text, -- HealthKit's workout UUID, for dedup on re-sync
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prevents the same Apple Health workout being imported twice on repeat syncs.
-- No WHERE clause needed: Postgres already treats NULL health_workout_id values
-- (i.e. every manual entry) as distinct from each other in a unique constraint,
-- so manual workouts are never blocked by this. Using a plain constraint (not a
-- partial index) also matters for ON CONFLICT (user_id, health_workout_id) in
-- the sync route to actually match it — a partial index can't be inferred by a
-- plain ON CONFLICT target.
alter table public.workout_logs drop constraint if exists workout_logs_health_dedup;
alter table public.workout_logs add constraint workout_logs_health_dedup
  unique (user_id, health_workout_id);

-- Weight tracking. The Milestone 1 version of this table (weight_kg,
-- body_fat_pct, photo_url, logged_at) was never wired to any UI or written
-- to — confirmed via a full codebase search before doing this — so it's safe
-- to drop and recreate with the shape this milestone actually needs, rather
-- than fight CREATE TABLE IF NOT EXISTS silently skipping a column rename on
-- a table that already exists.
drop table if exists public.weight_logs cascade;

-- Deliberately narrow (just weight) rather than a generic "body metrics"
-- table — future metrics (body fat %, waist, muscle mass, etc.) get their own
-- columns or their own table when they're actually built, per the same
-- "don't design for hypothetical futures" principle used elsewhere. The JSON
-- import below (health_metrics) already covers the truly open-ended case,
-- since HealthSave/Health can export arbitrary metric types.
create table public.weight_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  weight numeric not null,
  unit text check (unit in ('kg', 'lb')) not null default 'kg',
  measured_at timestamptz not null default now(),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Raw imported health readings (steps, heart rate, HRV, SpO2, etc.), from a
-- manually-uploaded HealthSave JSON export — see the "Apple Health Import"
-- design note in Milestone 4's brief for why this isn't a live sync. `metric`
-- is plain text, not a check-constrained enum: the whole point is that new
-- metric types (sleep, VO2 max, blood pressure, ...) can start flowing in
-- the moment HealthSave/Health exports them, with zero migration required.
create table if not exists public.health_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  metric text not null,
  value numeric not null,
  unit text not null,
  source text not null,
  recorded_at timestamptz not null, -- true absolute instant, for precise ordering
  recorded_date date not null, -- literal wall-clock date the reading happened on;
                                -- used for "steps per day" style aggregation, so it's
                                -- not silently reinterpreted through some other
                                -- timezone later (same bug class fixed elsewhere)
  created_at timestamptz default now()
);

-- Dedup key for re-importing the same (or overlapping) export file — matches
-- the exact shape HealthSave gives us per reading, so importing the same
-- period twice is always a safe no-op.
alter table public.health_metrics drop constraint if exists health_metrics_dedup;
alter table public.health_metrics add constraint health_metrics_dedup
  unique (user_id, metric, recorded_at, source);

create index if not exists health_metrics_user_metric_date
  on public.health_metrics (user_id, metric, recorded_date desc);
create index if not exists health_metrics_user_metric_at
  on public.health_metrics (user_id, metric, recorded_at desc);

-- Auto-provision public.users + public.goals whenever someone signs up.
-- SECURITY DEFINER lets this run as the table owner, bypassing RLS — so it
-- works regardless of whether the client has an active session yet (e.g.
-- during email-confirmation flows), unlike a client-side insert right after
-- signUp(), which can silently fail RLS if no session exists yet.
-- Quick-add phrases shown as chips on the Manual Entry screen (e.g. "Dal
-- rice") — user-managed reference data, edited from Profile → Meal Shortcuts.
create table if not exists public.meal_shortcuts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  label text not null check (char_length(label) <= 50),
  created_at timestamptz default now()
);

-- Row Level Security: every user can only touch their own rows
alter table public.users enable row level security;
alter table public.goals enable row level security;
alter table public.meal_images enable row level security;
alter table public.meal_logs enable row level security;
alter table public.daily_totals enable row level security;
alter table public.weight_logs enable row level security;
alter table public.ai_feedback enable row level security;
alter table public.settings enable row level security;
alter table public.workout_logs enable row level security;
alter table public.health_metrics enable row level security;
alter table public.meal_shortcuts enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'users','goals','meal_images','meal_logs',
    'daily_totals','weight_logs','ai_feedback','settings','workout_logs','health_metrics','meal_shortcuts'
  ])
  loop
    execute format($f$
      drop policy if exists "%1$s_select_own" on public.%1$s;
      create policy "%1$s_select_own" on public.%1$s
        for select using (auth.uid() = %2$s);
      drop policy if exists "%1$s_insert_own" on public.%1$s;
      create policy "%1$s_insert_own" on public.%1$s
        for insert with check (auth.uid() = %2$s);
      drop policy if exists "%1$s_update_own" on public.%1$s;
      create policy "%1$s_update_own" on public.%1$s
        for update using (auth.uid() = %2$s);
      drop policy if exists "%1$s_delete_own" on public.%1$s;
      create policy "%1$s_delete_own" on public.%1$s
        for delete using (auth.uid() = %2$s);
    $f$, t, case when t = 'users' then 'id' else 'user_id' end);
  end loop;
end $$;

-- Storage bucket for meal photos (private; served via signed URLs)
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

drop policy if exists "meal_photos_owner_access" on storage.objects;
create policy "meal_photos_owner_access" on storage.objects
  for all using (bucket_id = 'meal-photos' and auth.uid()::text = (storage.foldername(name))[1]);



create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;

  insert into public.goals (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  -- Same starting set the app used to hardcode — now editable per-user from
  -- day one instead of being fixed in code.
  insert into public.meal_shortcuts (user_id, label)
  values
    (new.id, '2 eggs and toast'),
    (new.id, 'Chicken biryani'),
    (new.id, 'Paneer tikka'),
    (new.id, 'Dal rice')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
