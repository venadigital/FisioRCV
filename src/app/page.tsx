import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHomePath } from "@/lib/utils";

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
    <div className="flex min-h-screen items-center justify-center p-6">
      <main className="w-full max-w-5xl rounded-3xl border border-cyan-100 bg-white p-8 shadow-xl md:p-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <section>
            <p className="mb-3 inline-block rounded-full bg-cyan-100 px-3 py-1 text-sm font-semibold text-cyan-800">
              Plataforma clínica
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              FisioAPP para seguimiento de dolor y rehabilitación
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Registra evolución del paciente en segundos y centraliza citas, ejercicios y notas clínicas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-xl bg-cyan-700 px-6 py-3 text-center font-semibold text-white hover:bg-cyan-800"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-3 text-center font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Crear cuenta
              </Link>
            </div>
          </section>

          <section className="rounded-2xl bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-cyan-800">MVP listo para operación clínica</h2>
            <ul className="mt-4 space-y-2 text-slate-700">
              <li>Portal paciente mobile-first</li>
              <li>Portal fisioterapeuta desktop-first</li>
              <li>Panel admin con agenda maestra</li>
              <li>Registro seguro con código de invitación</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
