"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type PersonOption = {
  id: string;
  label: string;
};

export function AppointmentForm({
  clinicId,
  patients,
  therapists,
}: {
  clinicId: string;
  patients: PersonOption[];
  therapists: PersonOption[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const scheduledAt = new Date(formData.get("scheduledAt") as string);

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: formData.get("patientId"),
        therapistId: formData.get("therapistId"),
        clinicId,
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
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Paciente</label>
        <Select name="patientId" required>
          {patients.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Terapeuta</label>
        <Select name="therapistId" required>
          {therapists.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Fecha y hora</label>
        <Input name="scheduledAt" type="datetime-local" required />
      </div>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Crear cita"}
      </Button>
    </form>
  );
}
