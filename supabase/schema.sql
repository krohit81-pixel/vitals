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
      create policy "%1$s_select_own" on public.%1$s
        for select using (auth.uid() = %2$s);
      create policy "%1$s_insert_own" on public.%1$s
        for insert with check (auth.uid() = %2$s);
      create policy "%1$s_update_own" on public.%1$s
        for update using (auth.uid() = %2$s);
      create policy "%1$s_delete_own" on public.%1$s
        for delete using (auth.uid() = %2$s);
    $f$, t, case when t = 'users' then 'id' else 'user_id' end);
  end loop;
end $$;

-- Storage bucket for meal photos (private; served via signed URLs)
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

create policy "meal_photos_owner_access" on storage.objects
  for all using (bucket_id = 'meal-photos' and auth.uid()::text = (storage.foldername(name))[1]);
