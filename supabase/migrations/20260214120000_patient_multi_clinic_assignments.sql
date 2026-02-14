create table if not exists public.patient_clinics (
  patient_id uuid not null references public.profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (patient_id, clinic_id)
);

create index if not exists idx_patient_clinics_patient on public.patient_clinics(patient_id);
create index if not exists idx_patient_clinics_clinic on public.patient_clinics(clinic_id);

insert into public.patient_clinics (patient_id, clinic_id, created_by)
select p.id, p.clinic_id, p.id
from public.profiles p
join public.user_roles ur on ur.user_id = p.id
where ur.role = 'patient'
  and p.clinic_id is not null
on conflict (patient_id, clinic_id) do nothing;

alter table public.patient_clinics enable row level security;

drop policy if exists "patient_clinics_admin_manage" on public.patient_clinics;
create policy "patient_clinics_admin_manage" on public.patient_clinics
for all
using (public.has_role('admin'))
with check (public.has_role('admin'));

drop policy if exists "patient_clinics_patient_read" on public.patient_clinics;
create policy "patient_clinics_patient_read" on public.patient_clinics
for select
using (auth.uid() = patient_id);

drop policy if exists "patient_clinics_therapist_read" on public.patient_clinics;
create policy "patient_clinics_therapist_read" on public.patient_clinics
for select
using (
  public.has_role('therapist')
  and exists (
    select 1
    from public.patient_assignments pa
    where pa.patient_id = patient_clinics.patient_id
      and pa.clinic_id = patient_clinics.clinic_id
      and pa.therapist_id = auth.uid()
      and pa.active = true
  )
);
