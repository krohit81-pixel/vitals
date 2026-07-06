-- Run this ONCE in the Supabase SQL editor, after applying the updated schema.sql
-- (specifically, after the handle_new_user trigger has been created).
--
-- It backfills public.users / public.goals for any auth.users that don't have
-- a matching row yet — i.e. accounts created before the trigger existed.

insert into public.users (id, full_name)
select u.id, u.raw_user_meta_data->>'full_name'
from auth.users u
left join public.users pu on pu.id = u.id
where pu.id is null;

insert into public.goals (user_id)
select u.id
from auth.users u
left join public.goals g on g.user_id = u.id
where g.user_id is null;

-- If your name still shows as missing after this, it means it wasn't captured
-- at signup either. Check what's actually stored with:
--   select id, email, raw_user_meta_data->>'full_name' as full_name from auth.users;
-- and fix it directly if needed:
--   update public.users set full_name = 'Your Name' where id = '<your-user-id>';
