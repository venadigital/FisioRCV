"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Mode = "request" | "update";

function isStrongPassword(value: string) {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [isClientReady, setIsClientReady] = useState(false);

  const [mode, setMode] = useState<Mode>("request");
  const [checkingLink, setCheckingLink] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    if (!isClientReady) return;

    const supabase = createClient();
    let cancelled = false;

    async function initRecoverySession() {
      try {
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const code = query.get("code");
        const type = hash.get("type");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;
          if (exchangeError) {
            setError("El enlace de recuperación es inválido o expiró.");
            setMode("request");
          } else {
            setMode("update");
            setMessage("Enlace validado. Ya puedes definir tu nueva contraseña.");
          }
          window.history.replaceState({}, "", "/reset-password");
          return;
        }

        if (type === "recovery" && accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (cancelled) return;

          if (setSessionError) {
            setError("El enlace de recuperación es inválido o expiró.");
            setMode("request");
          } else {
            setMode("update");
            setMessage("Enlace validado. Ya puedes definir tu nueva contraseña.");
          }

          window.history.replaceState({}, "", "/reset-password");
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setMode("update");
        } else {
          setMode("request");
        }
      } catch {
        if (!cancelled) {
          setMode("request");
          setError("No se pudo validar el enlace de recuperación.");
        }
      } finally {
        if (!cancelled) {
          setCheckingLink(false);
        }
      }
    }

    void initRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [isClientReady]);

  async function onRequestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isClientReady) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setMessage("Te enviamos un enlace de recuperación. Revisa tu correo.");
    setLoading(false);
  }

  async function onUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isClientReady) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    if (!isStrongPassword(password)) {
      setError("La contraseña debe tener mínimo 8 caracteres e incluir letras y números.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setMessage("Contraseña actualizada. Ahora puedes iniciar sesión.");
    setLoading(false);
    setTimeout(() => {
      router.replace("/login");
      router.refresh();
    }, 1000);
  }

  if (checkingLink) {
    return <p className="text-sm text-slate-500">Validando enlace de recuperación...</p>;
  }

  return (
    <div className="space-y-6">
      {mode === "request" ? (
        <form onSubmit={onRequestReset} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Correo</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              required
              className="h-11 rounded-xl border-slate-300 px-4"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-[#4d74b9] text-base font-semibold text-white hover:bg-[#3f64a8]"
          >
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </Button>
        </form>
      ) : (
        <form onSubmit={onUpdatePassword} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Nueva contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              required
              minLength={8}
              className="h-11 rounded-xl border-slate-300 px-4"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Confirmar contraseña</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="********"
              required
              minLength={8}
              className="h-11 rounded-xl border-slate-300 px-4"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-[#4d74b9] text-base font-semibold text-white hover:bg-[#3f64a8]"
          >
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </Button>
        </form>
      )}

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <p className="text-sm text-slate-600">
        <Link href="/login" className="font-semibold text-[#4d74b9] hover:text-[#3f64a8]">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
