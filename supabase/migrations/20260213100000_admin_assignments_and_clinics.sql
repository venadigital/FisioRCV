alter table if exists public.patient_assignments
  add column if not exists is_primary boolean not null default false;

-- Ensure previous data has a deterministic primary assignment per patient and clinic.
with ranked as (
  select
    id,
    row_number() over (
      partition by patient_id, clinic_id
      order by assigned_at desc, id desc
    ) as rn
  from public.patient_assignments
  where active = true
)
update public.patient_assignments pa
set is_primary = (ranked.rn = 1)
from ranked
where ranked.id = pa.id;

create unique index if not exists patient_assignments_one_primary_active_idx
  on public.patient_assignments (patient_id, clinic_id)
  where active = true and is_primary = true;

alter table if exists public.patient_assignments
  drop constraint if exists patient_assignments_primary_requires_active;

alter table if exists public.patient_assignments
  add constraint patient_assignments_primary_requires_active
  check ((not is_primary) or active);
