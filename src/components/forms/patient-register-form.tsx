"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { patientRegisterSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.infer<typeof patientRegisterSchema>;

export function PatientRegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(patientRegisterSchema),
  });

  async function onSubmit(values: FormData) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/patient-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.error ?? "No se pudo registrar");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInError) {
      setError(`Registro exitoso. Inicia sesión manualmente: ${signInError.message}`);
      setLoading(false);
      return;
    }

    router.replace("/patient");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Nombre completo</label>
        <Input {...register("fullName")} placeholder="María Pérez" />
        {errors.fullName ? <p className="mt-1 text-xs text-rose-700">{errors.fullName.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Correo</label>
        <Input type="email" {...register("email")} placeholder="correo@ejemplo.com" />
        {errors.email ? <p className="mt-1 text-xs text-rose-700">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Teléfono</label>
        <Input {...register("phone")} placeholder="55 1234 5678" />
        {errors.phone ? <p className="mt-1 text-xs text-rose-700">{errors.phone.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Contraseña</label>
        <Input type="password" {...register("password")} placeholder="********" />
        {errors.password ? <p className="mt-1 text-xs text-rose-700">{errors.password.message}</p> : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Código de invitación</label>
        <Input {...register("invitationCode")} maxLength={8} placeholder="AB12CD34" />
        {errors.invitationCode ? (
          <p className="mt-1 text-xs text-rose-700">{errors.invitationCode.message}</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        ¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-cyan-700">Iniciar sesión</Link>
      </p>
    </form>
  );
}
