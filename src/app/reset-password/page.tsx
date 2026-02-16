import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

function LogoMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4d74b9] text-xl text-white shadow-sm">
      ⚕
    </div>
  );
}

export default function ResetPasswordPage() {
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
        <section className="w-full max-w-[640px] rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-300/20 md:p-10">
          <h1 className="text-4xl font-bold tracking-tight text-[#17223d]">Recuperar contraseña</h1>
          <p className="mt-3 text-base text-slate-500">
            Solicita un enlace o define una nueva contraseña desde el correo que recibiste.
          </p>

          <div className="mt-8">
            <ResetPasswordForm />
          </div>
        </section>
      </main>
    </div>
  );
}
