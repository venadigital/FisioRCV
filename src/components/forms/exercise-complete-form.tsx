"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ExerciseCompleteForm({ planItemId }: { planItemId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const payload = {
      planItemId,
      hadPain: formData.get("hadPain") === "yes",
      notes: formData.get("notes") || null,
    };

    const response = await fetch("/api/patient/exercise-completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    setMessage(response.ok ? "Completado" : json.error ?? "No se pudo registrar");
    setLoading(false);
  }

  return (
    <form
      action={async (formData) => {
        await onSubmit(formData);
      }}
      className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
    >
      <label className="block text-xs font-semibold text-slate-700">¿Dolió?</label>
      <Select name="hadPain" defaultValue="no">
        <option value="no">No</option>
        <option value="yes">Sí</option>
      </Select>
      <Textarea name="notes" rows={2} placeholder="Observaciones" />
      {message ? <p className="text-xs text-slate-700">{message}</p> : null}
      <Button type="submit" variant="secondary" disabled={loading}>
        {loading ? "Guardando..." : "Hecho"}
      </Button>
    </form>
  );
}
