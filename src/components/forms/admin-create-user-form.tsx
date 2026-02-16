"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage, safeParseJson } from "@/lib/http";

type ClinicOption = {
  id: string;
  name: string;
  active: boolean;
};

type AdminCreateUserFormProps = {
  clinicId: string;
  clinics: ClinicOption[];
};

type RuntimeCheckResponse = {
  canCreateUsers?: boolean;
  missing?: string[];
  error?: string;
  code?: string;
};

function formatMissingEnvLabel(missing: string[]) {
  if (missing.length === 0) return "`SUPABASE_SECRET_KEY`";
  return missing.map((name) => `\`${name}\``).join(", ");
}

function mapCreateUserError(payload: RuntimeCheckResponse | null) {
  const code = payload?.code;
  if (code === "MISSING_SERVICE_ROLE_ENV") {
    return "Configuración incompleta del servidor para crear usuarios. Configura `SUPABASE_SECRET_KEY` en Hostinger y vuelve a desplegar.";
  }
  if (code === "PATIENT_CLINICS_TABLE_MISSING") {
    return "Falta la migración `patient_clinics` en producción. Ejecuta migraciones pendientes y reintenta.";
  }

  return getApiErrorMessage(payload, "No se pudo crear el usuario");
}

export function AdminCreateUserForm({ clinicId, clinics }: AdminCreateUserFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"therapist" | "admin" | "patient">("therapist");
  const [selectedPatientClinicIds, setSelectedPatientClinicIds] = useState<string[]>([clinicId]);
  const [runtimeChecked, setRuntimeChecked] = useState(false);
  const [canCreateUsers, setCanCreateUsers] = useState(true);
  const [runtimeMissing, setRuntimeMissing] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function checkRuntime() {
      try {
        const response = await fetch("/api/admin/runtime-check", {
          method: "GET",
          cache: "no-store",
        });

        const payload = await safeParseJson<RuntimeCheckResponse>(response);
        if (cancelled) return;

        if (!response.ok) {
          setCanCreateUsers(true);
          setRuntimeMissing([]);
          setRuntimeChecked(true);
          return;
        }

        const enabled = Boolean(payload?.canCreateUsers);
        setCanCreateUsers(enabled);
        setRuntimeMissing(payload?.missing ?? []);
        setRuntimeChecked(true);
      } catch {
        if (cancelled) return;
        setCanCreateUsers(true);
        setRuntimeMissing([]);
        setRuntimeChecked(true);
      }
    }

    void checkRuntime();

    return () => {
      cancelled = true;
    };
  }, []);

  function togglePatientClinic(clinicOptionId: string) {
    setSelectedPatientClinicIds((previous) =>
      previous.includes(clinicOptionId)
        ? previous.filter((value) => value !== clinicOptionId)
        : [...previous, clinicOptionId],
    );
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setIsError(false);

    if (runtimeChecked && !canCreateUsers) {
      setIsError(true);
      setMessage(
        `No puedes crear usuarios todavía. Configura ${formatMissingEnvLabel(runtimeMissing)} en Hostinger y vuelve a desplegar.`,
      );
      setLoading(false);
      return;
    }

    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (role === "patient" && selectedPatientClinicIds.length === 0) {
      setIsError(true);
      setMessage("Selecciona al menos una sede para el paciente");
      setLoading(false);
      return;
    }

    const payload = {
      email: formData.get("email"),
      password,
      role,
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      clinicId,
      clinicIds: role === "patient" ? selectedPatientClinicIds : undefined,
    };

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await safeParseJson<RuntimeCheckResponse>(response);

      if (response.ok) {
        setMessage("Usuario creado correctamente");
        formRef.current?.reset();
        setRole("therapist");
        setSelectedPatientClinicIds([clinicId]);
        router.refresh();
      } else {
        setIsError(true);
        setMessage(mapCreateUserError(json));
      }
    } catch {
      setIsError(true);
      setMessage("Error de red. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await onSubmit(formData);
      }}
      className="space-y-4"
    >
      <Input
        name="fullName"
        placeholder="Nombre completo"
        required
        className="h-12 rounded-xl border-slate-300 px-4 text-base"
      />
      <Input
        type="email"
        name="email"
        placeholder="correo@centro.com"
        required
        className="h-12 rounded-xl border-slate-300 px-4 text-base"
      />
      <Input
        name="phone"
        placeholder="Teléfono"
        required
        className="h-12 rounded-xl border-slate-300 px-4 text-base"
      />

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          type="password"
          name="password"
          placeholder="Contraseña"
          required
          minLength={8}
          className="h-12 rounded-xl border-slate-300 px-4 text-base"
        />
        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirmar contraseña"
          required
          minLength={8}
          className="h-12 rounded-xl border-slate-300 px-4 text-base"
        />
      </div>

      <Select
        name="role"
        value={role}
        onChange={(event) => setRole(event.target.value as "therapist" | "admin" | "patient")}
        className="h-12 rounded-xl border-slate-300 px-4 text-base"
      >
        <option value="therapist">Fisioterapeuta</option>
        <option value="admin">Admin</option>
        <option value="patient">Paciente</option>
      </Select>

      {role === "patient" ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Sedes asignadas al paciente</p>
          <p className="mt-1 text-sm text-slate-500">Puedes asignarlo a una o varias sedes.</p>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {clinics.map((clinicOption) => (
              <label
                key={clinicOption.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={selectedPatientClinicIds.includes(clinicOption.id)}
                  onChange={() => togglePatientClinic(clinicOption.id)}
                  className="h-4 w-4 accent-[#0e7a9a]"
                />
                <span className="text-sm text-slate-700">
                  {clinicOption.name}
                  {!clinicOption.active ? " (inactiva)" : ""}
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {runtimeChecked && !canCreateUsers ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Configuración requerida para crear usuarios</p>
          <p className="mt-1">
            Configura {formatMissingEnvLabel(runtimeMissing)} en Hostinger y vuelve a desplegar para habilitar este
            formulario.
          </p>
        </div>
      ) : null}

      {message ? (
        <p
          className={
            isError
              ? "rounded-xl bg-[#fff1f1] px-4 py-3 text-sm text-[#b84747]"
              : "rounded-xl bg-[#e8f4ef] px-4 py-3 text-sm text-[#2a885b]"
          }
        >
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={loading || (runtimeChecked && !canCreateUsers)}
        className="h-12 rounded-xl bg-[#0e7a9a] px-8 text-base font-semibold text-white hover:bg-[#0b6682]"
      >
        {loading ? "Guardando..." : "Crear usuario"}
      </Button>
    </form>
  );
}
