import { clsx, type ClassValue } from "clsx";
import { AppRole } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function roleHomePath(role: AppRole) {
  if (role === "admin") return "/admin";
  if (role === "therapist") return "/therapist";
  return "/patient";
}

export function randomCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
