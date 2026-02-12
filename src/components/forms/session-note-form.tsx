"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SessionNoteForm({
  appointmentId,
  patientId,
}: {
  appointmentId: string;
  patientId: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const payload = {
      appointmentId,
      patientId,
      sessionDate: formData.get("sessionDate"),
      notes: formData.get("notes"),
    };

    const response = await fetch("/api/therapist/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    setMessage(response.ok ? "Nota guardada" : json.error ?? "No se pudo guardar");
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
        <label className="mb-1 block text-sm font-medium">Fecha de sesión</label>
        <Input name="sessionDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notas</label>
        <Textarea name="notes" rows={4} required />
      </div>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar nota"}
      </Button>
    </form>
  );
}
