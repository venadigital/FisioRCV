import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <h1 className="text-2xl font-bold text-cyan-800">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-600">Ingresa con tu correo y contraseña.</p>

        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          ¿No tienes cuenta? <Link href="/register" className="font-semibold text-cyan-700">Crear cuenta</Link>
        </p>
      </main>
    </div>
  );
}
