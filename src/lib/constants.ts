import { NavItem } from "@/lib/types";

export const APP_NAME = "FisioAPP";

export const BODY_PART_OPTIONS = [
  { value: "neck", label: "Cuello" },
  { value: "upper_back", label: "Espalda alta" },
  { value: "lower_back", label: "Espalda baja" },
  { value: "shoulder", label: "Hombro" },
  { value: "knee", label: "Rodilla" },
  { value: "other", label: "Otro" },
] as const;

export const TRIGGER_OPTIONS = [
  { value: "exercise", label: "Ejercicio" },
  { value: "sitting", label: "Sentado" },
  { value: "sport", label: "Deporte" },
  { value: "lifting", label: "Cargar peso" },
  { value: "sleep", label: "Dormir" },
  { value: "stress", label: "Estrés" },
  { value: "other", label: "Otro" },
] as const;

export const PATIENT_NAV: NavItem[] = [
  { href: "/patient", label: "Inicio" },
  { href: "/patient/pain/new", label: "Registrar dolor" },
  { href: "/patient/evolution", label: "Mi evolución" },
  { href: "/patient/exercises", label: "Mis ejercicios" },
  { href: "/patient/appointments", label: "Mis citas" },
];

export const THERAPIST_NAV: NavItem[] = [
  { href: "/therapist", label: "Dashboard" },
  { href: "/therapist/agenda", label: "Mi agenda" },
  { href: "/therapist/exercises", label: "Biblioteca" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "◼" },
  { href: "/admin/clinics", label: "Sedes", icon: "▦" },
  { href: "/admin/users", label: "Usuarios", icon: "◉" },
  { href: "/admin/invitation-codes", label: "Códigos", icon: "⌗" },
  { href: "/admin/appointments", label: "Agenda", icon: "◷" },
  { href: "/admin/exercises", label: "Ejercicios", icon: "✕" },
  { href: "/admin/reports", label: "Reportes", icon: "◫" },
];
