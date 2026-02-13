"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Option = {
  id: string;
  label: string;
};

export function AppointmentForm({
  defaultClinicId,
  clinics,
  patients,
  therapists,
}: {
  defaultClinicId: string;
  clinics: Option[];
  patients: Option[];
  therapists: Option[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const scheduledAtValue = formData.get("scheduledAt") as string;
    const scheduledAt = new Date(scheduledAtValue);

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: formData.get("patientId"),
        therapistId: formData.get("therapistId"),
        clinicId: formData.get("clinicId") || defaultClinicId,
        scheduledAtUtc: scheduledAt.toISOString(),
      }),
    });

    const json = await response.json();
    setMessage(response.ok ? "Cita creada" : json.error ?? "No se pudo crear");
    setLoading(false);
  }

  return (
    <form
      action={async (formData) => {
        await onSubmit(formData);
      }}
      className="space-y-5"
    >
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <div>
          <label className="mb-2 block text-base font-medium text-slate-800">Sede</label>
          <Select name="clinicId" defaultValue={defaultClinicId} required className="h-12 rounded-xl px-4 text-lg">
            {clinics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-base font-medium text-slate-800">Paciente</label>
          <Select name="patientId" required className="h-12 rounded-xl px-4 text-lg">
            <option value="">Buscar paciente...</option>
            {patients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div>
          <label className="mb-2 block text-base font-medium text-slate-800">Terapeuta</label>
          <Select name="therapistId" required className="h-12 rounded-xl px-4 text-lg">
            <option value="">Seleccionar terapeuta</option>
            {therapists.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-base font-medium text-slate-800">Fecha y hora</label>
          <Input name="scheduledAt" type="datetime-local" required className="h-12 rounded-xl px-4 text-lg" />
        </div>
      </div>

      {message ? <p className="text-lg text-slate-700">{message}</p> : null}

      <Button
        type="submit"
        disabled={loading}
        className="h-12 rounded-xl bg-[#5478bd] px-7 text-base font-semibold text-white hover:bg-[#4364a2]"
      >
        + {loading ? "Creando..." : "Crear cita"}
      </Button>
    </form>
  );
}
