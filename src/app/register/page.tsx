import { PatientRegisterForm } from "@/components/forms/patient-register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <h1 className="text-2xl font-bold text-cyan-800">Crear cuenta de paciente</h1>
        <p className="mt-1 text-sm text-slate-600">
          Necesitas un código de invitación emitido por el centro.
        </p>

        <div className="mt-6">
          <PatientRegisterForm />
        </div>
      </main>
    </div>
  );
}
