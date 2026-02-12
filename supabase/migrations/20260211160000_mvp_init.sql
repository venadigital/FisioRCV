-- FisioAPP MVP: schema + functions + RLS

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.app_role as enum ('admin', 'therapist', 'patient');
create type public.body_part_enum as enum ('neck', 'upper_back', 'lower_back', 'shoulder', 'knee', 'other');
create type public.pain_trigger_enum as enum ('exercise', 'sitting', 'sport', 'lifting', 'sleep', 'stress', 'other');
create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type public.exercise_difficulty as enum ('easy', 'medium', 'hard');

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  phone text,
  timezone text not null default 'America/Mexico_City',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id),
  full_name text not null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);

create table if not exists public.invitation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 8),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  max_uses integer not null default 50 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.invitation_code_usages (
  id uuid primary key default gen_random_uuid(),
  invitation_code_id uuid not null references public.invitation_codes(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  used_at timestamptz not null default now(),
  unique(invitation_code_id, patient_id)
);

create table if not exists public.patient_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  therapist_id uuid not null references public.profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  active boolean not null default true,
  unique(patient_id, therapist_id, clinic_id)
);

create table if not exists public.pain_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  body_part public.body_part_enum not null,
  intensity integer not null check (intensity between 0 and 10),
  trigger public.pain_trigger_enum not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  name text not null,
  youtube_url text,
  instructions text not null,
  series integer not null check (series > 0),
  reps integer not null check (reps > 0),
  frequency_per_week integer not null check (frequency_per_week > 0),
  category text not null,
  body_part public.body_part_enum not null,
  difficulty public.exercise_difficulty not null default 'medium',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  therapist_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.exercise_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.exercise_plans(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  custom_instructions text,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.exercise_completions (
  id uuid primary key default gen_random_uuid(),
  plan_item_id uuid not null references public.exercise_plan_items(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  had_pain boolean not null,
  notes text
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  therapist_id uuid not null references public.profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes = 30),
  status public.appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now()
);

create or replace function public.prevent_appointment_overlap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('scheduled', 'completed') and exists (
    select 1
    from public.appointments a
    where a.therapist_id = new.therapist_id
      and a.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
      and a.status in ('scheduled', 'completed')
      and a.scheduled_at < (new.scheduled_at + interval '30 minutes')
      and (a.scheduled_at + interval '30 minutes') > new.scheduled_at
  ) then
    raise exception 'La cita se solapa con otra existente para el terapeuta'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_appointment_overlap on public.appointments;
create trigger trg_prevent_appointment_overlap
before insert or update of therapist_id, scheduled_at, status
on public.appointments
for each row
execute function public.prevent_appointment_overlap();

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  therapist_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  notes text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_clinic on public.profiles(clinic_id);
create index if not exists idx_roles_role on public.user_roles(role);
create index if not exists idx_inv_codes_clinic on public.invitation_codes(clinic_id);
create index if not exists idx_assignments_therapist on public.patient_assignments(therapist_id, active);
create index if not exists idx_pain_patient_recorded on public.pain_events(patient_id, recorded_at desc);
create index if not exists idx_exercises_clinic on public.exercises(clinic_id);
create index if not exists idx_plans_patient on public.exercise_plans(patient_id, active);
create index if not exists idx_appointments_therapist on public.appointments(therapist_id, scheduled_at);
create index if not exists idx_appointments_patient on public.appointments(patient_id, scheduled_at);

create or replace function public.has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = _role
  );
$$;

create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.clinic_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

create or replace function public.can_access_patient(_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = _patient_id
    or (
      public.has_role('admin')
      and exists (
        select 1
        from public.profiles p
        where p.id = _patient_id
          and p.clinic_id = public.current_clinic_id()
      )
    )
    or (
      public.has_role('therapist')
      and exists (
        select 1
        from public.patient_assignments pa
        where pa.patient_id = _patient_id
          and pa.therapist_id = auth.uid()
          and pa.active = true
      )
    );
$$;

create or replace function public.validate_invitation_code(_code text)
returns table(valid boolean, clinic_id uuid, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.invitation_codes;
begin
  select *
  into v_code
  from public.invitation_codes
  where code = upper(_code)
  limit 1;

  if v_code.id is null then
    return query select false, null::uuid, 'Código no encontrado';
    return;
  end if;

  if not v_code.active then
    return query select false, null::uuid, 'Código inactivo';
    return;
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    return query select false, null::uuid, 'Código expirado';
    return;
  end if;

  if v_code.used_count >= v_code.max_uses then
    return query select false, null::uuid, 'Código sin cupo';
    return;
  end if;

  return query select true, v_code.clinic_id, null::text;
end;
$$;

create or replace function public.consume_invitation_code_and_create_patient(
  _code text,
  _full_name text,
  _phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.invitation_codes;
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuario no autenticado';
  end if;

  select *
  into v_code
  from public.invitation_codes
  where code = upper(_code)
  for update;

  if v_code.id is null then
    raise exception 'Código no encontrado';
  end if;

  if not v_code.active then
    raise exception 'Código inactivo';
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    raise exception 'Código expirado';
  end if;

  if v_code.used_count >= v_code.max_uses then
    raise exception 'Código sin cupo';
  end if;

  insert into public.profiles(id, clinic_id, full_name, phone, active)
  values (v_user_id, v_code.clinic_id, _full_name, _phone, true)
  on conflict (id)
  do update set
    clinic_id = excluded.clinic_id,
    full_name = excluded.full_name,
    phone = excluded.phone;

  insert into public.user_roles(user_id, role)
  values (v_user_id, 'patient')
  on conflict (user_id)
  do update set role = excluded.role;

  insert into public.invitation_code_usages(invitation_code_id, patient_id)
  values (v_code.id, v_user_id)
  on conflict do nothing;

  update public.invitation_codes
  set used_count = used_count + 1
  where id = v_code.id;

  return v_user_id;
end;
$$;

create or replace function public.consume_invitation_code_and_create_patient_for_user(
  _code text,
  _user_id uuid,
  _full_name text,
  _phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.invitation_codes;
begin
  if _user_id is null then
    raise exception 'Usuario inválido';
  end if;

  select *
  into v_code
  from public.invitation_codes
  where code = upper(_code)
  for update;

  if v_code.id is null then
    raise exception 'Código no encontrado';
  end if;

  if not v_code.active then
    raise exception 'Código inactivo';
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    raise exception 'Código expirado';
  end if;

  if v_code.used_count >= v_code.max_uses then
    raise exception 'Código sin cupo';
  end if;

  insert into public.profiles(id, clinic_id, full_name, phone, active)
  values (_user_id, v_code.clinic_id, _full_name, _phone, true)
  on conflict (id)
  do update set
    clinic_id = excluded.clinic_id,
    full_name = excluded.full_name,
    phone = excluded.phone;

  insert into public.user_roles(user_id, role)
  values (_user_id, 'patient')
  on conflict (user_id)
  do update set role = excluded.role;

  insert into public.invitation_code_usages(invitation_code_id, patient_id)
  values (v_code.id, _user_id)
  on conflict do nothing;

  update public.invitation_codes
  set used_count = used_count + 1
  where id = v_code.id;

  return _user_id;
end;
$$;

grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.current_clinic_id() to authenticated;
grant execute on function public.validate_invitation_code(text) to anon, authenticated, service_role;
grant execute on function public.consume_invitation_code_and_create_patient(text, text, text) to authenticated;
grant execute on function public.consume_invitation_code_and_create_patient_for_user(text, uuid, text, text) to service_role;

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.invitation_codes enable row level security;
alter table public.invitation_code_usages enable row level security;
alter table public.patient_assignments enable row level security;
alter table public.pain_events enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_plans enable row level security;
alter table public.exercise_plan_items enable row level security;
alter table public.exercise_completions enable row level security;
alter table public.appointments enable row level security;
alter table public.sessions enable row level security;

-- clinics
create policy "clinic_select_by_membership" on public.clinics
for select using (
  id = public.current_clinic_id()
  or public.has_role('admin')
);

create policy "clinic_admin_manage" on public.clinics
for all using (public.has_role('admin'))
with check (public.has_role('admin'));

-- profiles
create policy "profile_select_self_or_clinic" on public.profiles
for select using (
  id = auth.uid()
  or (public.has_role('admin') and clinic_id = public.current_clinic_id())
  or (
    public.has_role('therapist')
    and exists (
      select 1
      from public.patient_assignments pa
      where pa.patient_id = profiles.id
        and pa.therapist_id = auth.uid()
        and pa.active = true
    )
  )
);

create policy "profile_update_self_limited" on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid());

create policy "profile_admin_manage" on public.profiles
for all using (public.has_role('admin') and clinic_id = public.current_clinic_id())
with check (public.has_role('admin') and clinic_id = public.current_clinic_id());

-- user_roles
create policy "roles_select_self_or_admin" on public.user_roles
for select using (
  user_id = auth.uid()
  or public.has_role('admin')
);

create policy "roles_admin_manage" on public.user_roles
for all using (public.has_role('admin'))
with check (public.has_role('admin'));

-- invitation_codes
create policy "invitation_codes_admin_crud" on public.invitation_codes
for all using (public.has_role('admin') and clinic_id = public.current_clinic_id())
with check (public.has_role('admin') and clinic_id = public.current_clinic_id());

create policy "invitation_codes_therapist_read" on public.invitation_codes
for select using (
  public.has_role('therapist')
  and clinic_id = public.current_clinic_id()
);

-- invitation_code_usages
create policy "invitation_usage_admin_read" on public.invitation_code_usages
for select using (
  public.has_role('admin')
  and exists (
    select 1 from public.invitation_codes ic
    where ic.id = invitation_code_usages.invitation_code_id
      and ic.clinic_id = public.current_clinic_id()
  )
);

-- patient_assignments
create policy "assignments_patient_read" on public.patient_assignments
for select using (
  patient_id = auth.uid()
  or therapist_id = auth.uid()
  or (public.has_role('admin') and clinic_id = public.current_clinic_id())
);

create policy "assignments_admin_manage" on public.patient_assignments
for all using (public.has_role('admin') and clinic_id = public.current_clinic_id())
with check (public.has_role('admin') and clinic_id = public.current_clinic_id());

-- pain_events
create policy "pain_patient_crud" on public.pain_events
for all using (patient_id = auth.uid())
with check (patient_id = auth.uid());

create policy "pain_therapist_read_assigned" on public.pain_events
for select using (
  public.has_role('therapist')
  and exists (
    select 1
    from public.patient_assignments pa
    where pa.patient_id = pain_events.patient_id
      and pa.therapist_id = auth.uid()
      and pa.active = true
  )
);

create policy "pain_admin_read_clinic" on public.pain_events
for select using (
  public.has_role('admin')
  and exists (
    select 1
    from public.profiles p
    where p.id = pain_events.patient_id
      and p.clinic_id = public.current_clinic_id()
  )
);

-- exercises
create policy "exercises_select_visibility" on public.exercises
for select using (
  clinic_id is null
  or clinic_id = public.current_clinic_id()
  or created_by = auth.uid()
);

create policy "exercises_therapist_manage_own" on public.exercises
for all using (
  public.has_role('therapist')
  and created_by = auth.uid()
)
with check (
  public.has_role('therapist')
  and created_by = auth.uid()
  and (clinic_id = public.current_clinic_id() or clinic_id is null)
);

create policy "exercises_admin_manage_clinic" on public.exercises
for all using (
  public.has_role('admin')
  and (clinic_id = public.current_clinic_id() or clinic_id is null)
)
with check (
  public.has_role('admin')
  and (clinic_id = public.current_clinic_id() or clinic_id is null)
);

-- exercise_plans
create policy "plans_patient_read" on public.exercise_plans
for select using (patient_id = auth.uid());

create policy "plans_therapist_crud_assigned" on public.exercise_plans
for all using (
  public.has_role('therapist')
  and therapist_id = auth.uid()
  and exists (
    select 1 from public.patient_assignments pa
    where pa.patient_id = exercise_plans.patient_id
      and pa.therapist_id = auth.uid()
      and pa.active = true
  )
)
with check (
  public.has_role('therapist')
  and therapist_id = auth.uid()
  and exists (
    select 1 from public.patient_assignments pa
    where pa.patient_id = exercise_plans.patient_id
      and pa.therapist_id = auth.uid()
      and pa.active = true
  )
);

create policy "plans_admin_crud_clinic" on public.exercise_plans
for all using (
  public.has_role('admin')
  and exists (
    select 1 from public.profiles p
    where p.id = exercise_plans.patient_id
      and p.clinic_id = public.current_clinic_id()
  )
)
with check (
  public.has_role('admin')
  and exists (
    select 1 from public.profiles p
    where p.id = exercise_plans.patient_id
      and p.clinic_id = public.current_clinic_id()
  )
);

-- exercise_plan_items
create policy "plan_items_read_for_patient_and_staff" on public.exercise_plan_items
for select using (
  exists (
    select 1
    from public.exercise_plans ep
    where ep.id = exercise_plan_items.plan_id
      and (
        ep.patient_id = auth.uid()
        or ep.therapist_id = auth.uid()
        or public.has_role('admin')
      )
  )
);

create policy "plan_items_manage_therapist_admin" on public.exercise_plan_items
for all using (
  exists (
    select 1
    from public.exercise_plans ep
    where ep.id = exercise_plan_items.plan_id
      and (
        (public.has_role('therapist') and ep.therapist_id = auth.uid())
        or public.has_role('admin')
      )
  )
)
with check (
  exists (
    select 1
    from public.exercise_plans ep
    where ep.id = exercise_plan_items.plan_id
      and (
        (public.has_role('therapist') and ep.therapist_id = auth.uid())
        or public.has_role('admin')
      )
  )
);

-- exercise_completions
create policy "completions_patient_insert_own" on public.exercise_completions
for insert with check (patient_id = auth.uid());

create policy "completions_patient_read_own" on public.exercise_completions
for select using (patient_id = auth.uid());

create policy "completions_staff_read" on public.exercise_completions
for select using (
  public.has_role('admin')
  or (
    public.has_role('therapist')
    and exists (
      select 1
      from public.patient_assignments pa
      where pa.patient_id = exercise_completions.patient_id
        and pa.therapist_id = auth.uid()
        and pa.active = true
    )
  )
);

-- appointments
create policy "appointments_patient_read_own" on public.appointments
for select using (patient_id = auth.uid());

create policy "appointments_therapist_read_write_own" on public.appointments
for all using (
  public.has_role('therapist')
  and therapist_id = auth.uid()
)
with check (
  public.has_role('therapist')
  and therapist_id = auth.uid()
  and clinic_id = public.current_clinic_id()
);

create policy "appointments_admin_manage_clinic" on public.appointments
for all using (
  public.has_role('admin')
  and clinic_id = public.current_clinic_id()
)
with check (
  public.has_role('admin')
  and clinic_id = public.current_clinic_id()
);

-- sessions
create policy "sessions_patient_read" on public.sessions
for select using (patient_id = auth.uid());

create policy "sessions_therapist_manage" on public.sessions
for all using (
  public.has_role('therapist')
  and therapist_id = auth.uid()
)
with check (
  public.has_role('therapist')
  and therapist_id = auth.uid()
);

create policy "sessions_admin_manage" on public.sessions
for all using (
  public.has_role('admin')
  and exists (
    select 1
    from public.profiles p
    where p.id = sessions.patient_id
      and p.clinic_id = public.current_clinic_id()
  )
)
with check (
  public.has_role('admin')
  and exists (
    select 1
    from public.profiles p
    where p.id = sessions.patient_id
      and p.clinic_id = public.current_clinic_id()
  )
);
