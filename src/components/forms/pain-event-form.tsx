"use client";

import { useState } from "react";
import { BODY_PART_OPTIONS, TRIGGER_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function PainEventForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const payload = {
      recordedAt: new Date(formData.get("recordedAt") as string).toISOString(),
      bodyPart: formData.get("bodyPart"),
      intensity,
      trigger: formData.get("trigger"),
      notes: formData.get("notes") || null,
    };

    const response = await fetch("/api/patient/pain-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    setMessage(response.ok ? "Registro guardado" : json.error ?? "No se pudo guardar");
    setLoading(false);
  }

  return (
    <form
      action={async (formData) => {
        await onSubmit(formData);
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Fecha y hora</label>
        <Input
          type="datetime-local"
          name="recordedAt"
          defaultValue={new Date().toISOString().slice(0, 16)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Zona corporal</label>
        <Select name="bodyPart" required>
          {BODY_PART_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Intensidad: {intensity}</label>
        <input
          type="range"
          min={0}
          max={10}
          value={intensity}
          onChange={(event) => setIntensity(Number(event.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Trigger principal</label>
        <Select name="trigger" required>
          {TRIGGER_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notas (opcional)</label>
        <Textarea name="notes" rows={3} />
      </div>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Guardando..." : "Guardar dolor"}
      </Button>
    </form>
  );
}
