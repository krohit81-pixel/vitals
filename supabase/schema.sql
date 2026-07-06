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

-- Row Level Security: every user can only touch their own rows
alter table public.users enable row level security;
alter table public.goals enable row level security;
alter table public.meal_images enable row level security;
alter table public.meal_logs enable row level security;
alter table public.daily_totals enable row level security;
alter table public.weight_logs enable row level security;
alter table public.ai_feedback enable row level security;
alter table public.settings enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'users','goals','meal_images','meal_logs',
    'daily_totals','weight_logs','ai_feedback','settings'
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

-- Auto-provision public.users + public.goals whenever someone signs up.
-- SECURITY DEFINER lets this run as the table owner, bypassing RLS — so it
-- works regardless of whether the client has an active session yet (e.g.
-- during email-confirmation flows), unlike a client-side insert right after
-- signUp(), which can silently fail RLS if no session exists yet.
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

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
