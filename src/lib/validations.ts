import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const patientRegisterSchema = z.object({
  fullName: z.string().min(3, "Nombre requerido"),
  email: z.string().email("Correo inválido"),
  phone: z.string().min(8, "Teléfono inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  invitationCode: z
    .string()
    .length(8, "El código debe tener 8 caracteres")
    .transform((value) => value.toUpperCase()),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "therapist", "patient"]),
  fullName: z.string().min(3),
  phone: z.string().min(8),
  clinicId: z.string().uuid(),
});

export const createInvitationCodeSchema = z.object({
  clinicId: z.string().uuid(),
  maxUses: z.number().int().positive().max(500).default(50),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  therapistId: z.string().uuid(),
  clinicId: z.string().uuid(),
  scheduledAtUtc: z.string().datetime(),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
});

export const painEventSchema = z.object({
  recordedAt: z.string().datetime().optional(),
  bodyPart: z.enum(["neck", "upper_back", "lower_back", "shoulder", "knee", "other"]),
  intensity: z.number().int().min(0).max(10),
  trigger: z.enum(["exercise", "sitting", "sport", "lifting", "sleep", "stress", "other"]),
  notes: z.string().max(500).optional(),
});

export const exerciseCompletionSchema = z.object({
  planItemId: z.string().uuid(),
  hadPain: z.boolean(),
  notes: z.string().max(300).optional(),
});

export const therapistExerciseSchema = z.object({
  name: z.string().min(3),
  youtubeUrl: z.string().url(),
  instructions: z.string().min(5),
  series: z.number().int().positive().max(20),
  reps: z.number().int().positive().max(100),
  frequencyPerWeek: z.number().int().positive().max(14),
  category: z.string().min(2),
  bodyPart: z.enum(["neck", "upper_back", "lower_back", "shoulder", "knee", "other"]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export const sessionNoteSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  sessionDate: z.string().date(),
  notes: z.string().min(3),
});
