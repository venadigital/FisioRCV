"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: FormData) {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) {
      setError("No se pudo cargar el perfil del usuario");
      setLoading(false);
      return;
    }

    const json = await response.json();
    router.replace(json.homePath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-2 block text-3xl font-semibold text-[#1f2a45]">Correo</label>
        <Input
          type="email"
          {...register("email")}
          placeholder="correo@ejemplo.com"
          className="h-16 rounded-2xl border-slate-300 px-5 text-2xl"
        />
        {errors.email ? <p className="mt-2 text-xl text-rose-700">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-3xl font-semibold text-[#1f2a45]">Contraseña</label>
        <Input
          type="password"
          {...register("password")}
          placeholder="********"
          className="h-16 rounded-2xl border-slate-300 px-5 text-2xl"
        />
        {errors.password ? <p className="mt-2 text-xl text-rose-700">{errors.password.message}</p> : null}
      </div>

      {error ? <p className="text-xl text-rose-700">{error}</p> : null}

      <Button
        type="submit"
        className="mt-1 h-16 w-full rounded-2xl bg-[#4d74b9] text-3xl font-semibold hover:bg-[#4066aa]"
        disabled={loading}
      >
        {loading ? "Ingresando..." : "Iniciar sesión"}
      </Button>
    </form>
  );
}
