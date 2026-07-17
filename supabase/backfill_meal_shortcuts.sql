-- Run this ONCE in the Supabase SQL editor, after applying the updated
-- schema.sql (specifically, after meal_shortcuts and the updated
-- handle_new_user trigger exist).
--
-- Seeds the same starting set new signups get, for any existing user who
-- currently has zero meal shortcuts — so their Manual Entry screen isn't
-- suddenly empty after this feature ships. Safe to run multiple times: users
-- who already have at least one shortcut (their own, or already backfilled)
-- are skipped entirely.

insert into public.meal_shortcuts (user_id, label)
select u.id, label
from public.users u
cross join (values
  ('2 eggs and toast'),
  ('Chicken biryani'),
  ('Paneer tikka'),
  ('Dal rice')
) as defaults(label)
where not exists (
  select 1 from public.meal_shortcuts ms where ms.user_id = u.id
);
