"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage, safeParseJson } from "@/lib/http";

export function AdminCreateUserForm({ clinicId }: { clinicId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setIsError(false);

    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const payload = {
      email: formData.get("email"),
      password,
      role: formData.get("role"),
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      clinicId,
    };

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await safeParseJson<{ error?: string }>(response);

      if (response.ok) {
        setMessage("Usuario creado correctamente");
        formRef.current?.reset();
        router.refresh();
      } else {
        setIsError(true);
        setMessage(getApiErrorMessage(json, "No se pudo crear el usuario"));
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

      <Select name="role" defaultValue="therapist" className="h-12 rounded-xl border-slate-300 px-4 text-base">
        <option value="therapist">Fisioterapeuta</option>
        <option value="admin">Admin</option>
        <option value="patient">Paciente</option>
      </Select>

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
        disabled={loading}
        className="h-12 rounded-xl bg-[#0e7a9a] px-8 text-base font-semibold text-white hover:bg-[#0b6682]"
      >
        {loading ? "Guardando..." : "Crear usuario"}
      </Button>
    </form>
  );
}
