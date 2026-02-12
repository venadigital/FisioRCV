import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHomePath } from "@/lib/utils";

function LogoMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4d74b9] text-xl text-white shadow-sm">
      ⚕
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200/70 bg-white/85 p-7 text-center shadow-lg shadow-slate-200/40 backdrop-blur-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3ff] text-2xl text-[#4d74b9]">
        {icon}
      </div>
      <h3 className="text-3xl/[1.2] font-semibold tracking-tight text-slate-900 md:text-4xl/[1.1]">{title}</h3>
      <p className="mt-3 text-lg text-slate-600">{description}</p>
    </article>
  );
}

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleRow?.role) {
      redirect(roleHomePath(roleRow.role));
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-white/84" />

        <header className="relative z-10 border-b border-white/60 bg-white/75 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-10">
            <Link href="/" className="flex items-center gap-3">
              <LogoMark />
              <p className="text-3xl font-semibold tracking-tight text-slate-800 md:text-4xl">
                Fisio <span className="text-[#4d74b9]">RCV</span>
              </p>
            </Link>

            <nav className="flex items-center gap-6">
              <Link href="/login" className="hidden text-lg font-medium text-slate-700 hover:text-slate-900 md:block">
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[#4d74b9] px-5 py-3 text-base font-semibold text-white shadow-md shadow-blue-300/40 transition hover:bg-[#4066aa]"
              >
                Crear Cuenta
              </Link>
            </nav>
          </div>
        </header>

        <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-5 pb-10 pt-16 md:px-10 md:pt-24">
          <section className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight text-[#1d2a44] md:text-7xl">
              Tu recuperación,
              <br />
              <span className="text-[#4d74b9]">ahora más simple.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-slate-700 md:text-3xl">
              Accede rápidamente a tus rutinas de fisioterapia y conecta con tus especialistas en una sola
              plataforma unificada.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="w-full rounded-2xl bg-[#4d74b9] px-8 py-4 text-center text-xl font-semibold text-white shadow-lg shadow-blue-300/40 transition hover:bg-[#4066aa] sm:w-auto"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="w-full rounded-2xl border border-slate-200 bg-white px-8 py-4 text-center text-xl font-semibold text-slate-800 shadow-lg shadow-slate-200/60 transition hover:bg-slate-50 sm:w-auto"
              >
                Crear Cuenta
              </Link>
            </div>
          </section>

          <section className="mt-14 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon="🩹"
              title="Registra tu dolor"
              description="Lleva un diario simple de tus síntomas y progreso."
            />
            <FeatureCard
              icon="🏋️"
              title="Sigue tu rutina"
              description="Visualiza ejercicios asignados y marca completados."
            />
            <FeatureCard
              icon="📅"
              title="Gestiona tus citas"
              description="Agenda, modifica o cancela tus sesiones en un clic."
            />
          </section>
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 py-6 text-base text-slate-600 md:flex-row md:px-10">
          <p className="text-lg font-semibold text-slate-700">
            Fisio <span className="text-[#4d74b9]">RCV</span>
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-900">
              Términos
            </a>
            <a href="#" className="hover:text-slate-900">
              Privacidad
            </a>
            <a href="#" className="hover:text-slate-900">
              Ayuda
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
