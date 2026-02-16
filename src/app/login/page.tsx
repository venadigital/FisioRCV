import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function LogoMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4d74b9] text-xl text-white shadow-sm">
      ⚕
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f5f4f8]">
      <header className="px-8 py-6 md:px-12">
        <Link href="/" className="inline-flex items-center gap-3">
          <LogoMark />
          <p className="text-4xl font-semibold tracking-tight text-slate-900">
            Fisio <span className="text-[#4d74b9]">RCV</span>
          </p>
        </Link>
      </header>

      <main className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 pb-10">
        <section className="w-full max-w-[640px] rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-300/30 md:p-14">
          <h1 className="text-6xl font-bold tracking-tight text-[#17223d]">Iniciar sesión</h1>
          <p className="mt-4 text-4xl text-slate-500">Ingresa con tu correo y contraseña.</p>

          <div className="mt-9">
            <LoginForm />
          </div>

          <p className="mt-10 text-center text-2xl text-slate-500">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-semibold text-[#4d74b9] hover:text-[#3c5f9c]">
              Crear cuenta
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
