-- Bootstrap inicial para entorno local/staging
-- 1) Crea un usuario en Supabase Auth (dashboard) y copia su UUID en :admin_user_id

-- Reemplaza estos valores antes de ejecutar.
-- :admin_user_id = '00000000-0000-0000-0000-000000000000'

with new_clinic as (
  insert into public.clinics (name, address, phone, timezone, active)
  values ('Sede Principal', 'Dirección por definir', '555-000-0000', 'America/Mexico_City', true)
  returning id
)
insert into public.profiles (id, clinic_id, full_name, phone, active)
select '00000000-0000-0000-0000-000000000000'::uuid, id, 'Admin Inicial', '555-000-0000', true
from new_clinic
on conflict (id)
do nothing;

insert into public.user_roles (user_id, role)
values ('00000000-0000-0000-0000-000000000000'::uuid, 'admin')
on conflict (user_id)
do update set role = excluded.role;
