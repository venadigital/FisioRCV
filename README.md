# FisioAPP MVP

Aplicación web para un centro de fisioterapia con tres portales:
- Paciente (mobile-first)
- Fisioterapeuta (desktop-first)
- Admin (desktop-first)

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth + RLS)
- React Hook Form + Zod
- Recharts

## Funcionalidad implementada

### Fase 1 (DB + Auth)
- Migración SQL completa en `supabase/migrations/20260211160000_mvp_init.sql`
- Tablas del MVP: `clinics`, `profiles`, `user_roles`, `invitation_codes`, `invitation_code_usages`, `patient_assignments`, `pain_events`, `exercises`, `exercise_plans`, `exercise_plan_items`, `exercise_completions`, `appointments`, `sessions`
- Funciones SQL:
  - `has_role(_role)`
  - `current_clinic_id()`
  - `validate_invitation_code(_code)`
  - `consume_invitation_code_and_create_patient(_code, _full_name, _phone)`
  - `consume_invitation_code_and_create_patient_for_user(_code, _user_id, _full_name, _phone)`
- RLS por rol (admin, therapist, patient)
- Landing pública, login y registro de pacientes con código de invitación
- Alta de staff por invitación email (API admin)

### Fase 2 (Paciente)
- Home con próxima cita, promedio dolor semanal y contador de registros
- Registro de dolor rápido (`/patient/pain/new`)
- Evolución con gráfica Recharts (`/patient/evolution`)
- Ejercicios asignados con video embebido + marcado de completado
- Citas próximas e historial

### Fase 3 (Fisioterapeuta)
- Dashboard de pacientes asignados
- Ficha de paciente con timeline y eventos
- Nota de sesión vinculada a cita
- Agenda semanal con cambio de estado
- Biblioteca de ejercicios

### Fase 4 (Admin)
- Dashboard de métricas
- Gestión de usuarios (invitaciones)
- Gestión de códigos de invitación
- Agenda maestra + creación de citas
- Biblioteca global de ejercicios
- Vista de sedes
- Reportes básicos

## API routes
- `POST /api/auth/patient-register`
- `GET /api/auth/me`
- `POST /api/admin/users/invite`
- `POST /api/admin/invitation-codes`
- `POST /api/appointments`
- `PATCH /api/appointments/:id/status`
- `POST /api/patient/pain-events`
- `POST /api/patient/exercise-completions`
- `POST /api/therapist/exercises`
- `POST /api/therapist/sessions`

## Setup local
1. Copia `.env.example` a `.env.local` y completa credenciales Supabase.
2. Ejecuta migración en Supabase SQL Editor o con CLI:
   - `supabase db push` (si tienes proyecto linkeado)
   - o pegar `supabase/migrations/20260211160000_mvp_init.sql` en SQL Editor
3. (Opcional recomendado) Bootstrap de admin inicial:
   - Edita UUID en `supabase/seed.sql`
   - Ejecuta `supabase/seed.sql` en SQL Editor
4. Instala dependencias:
   - `npm install`
5. Levanta la app:
   - `npm run dev`

## Notas de operación
- MVP configurado para una sola sede activa, pero el modelo está preparado para escalar a multi-sede.
- Citas de 30 minutos con validación de solapamiento por terapeuta.
- Pacientes se registran solo con código válido.
- Terapeutas/admins se crean vía invitación desde panel admin.
