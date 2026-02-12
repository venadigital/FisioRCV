"use client";

import { useState } from "react";
import { BODY_PART_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function TherapistExerciseForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const payload = {
      name: formData.get("name"),
      youtubeUrl: formData.get("youtubeUrl"),
      instructions: formData.get("instructions"),
      series: Number(formData.get("series")),
      reps: Number(formData.get("reps")),
      frequencyPerWeek: Number(formData.get("frequencyPerWeek")),
      category: formData.get("category"),
      bodyPart: formData.get("bodyPart"),
      difficulty: formData.get("difficulty"),
    };

    const response = await fetch("/api/therapist/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    setMessage(response.ok ? "Ejercicio creado" : json.error ?? "No se pudo crear");
    setLoading(false);
  }

  return (
    <form
      action={async (formData) => {
        await onSubmit(formData);
      }}
      className="space-y-3"
    >
      <Input name="name" placeholder="Nombre del ejercicio" required />
      <Input name="youtubeUrl" placeholder="https://youtube.com/..." type="url" required />
      <Textarea name="instructions" placeholder="Instrucciones" rows={3} required />

      <div className="grid gap-3 md:grid-cols-3">
        <Input name="series" type="number" min={1} defaultValue={3} required />
        <Input name="reps" type="number" min={1} defaultValue={12} required />
        <Input name="frequencyPerWeek" type="number" min={1} defaultValue={4} required />
      </div>

      <Input name="category" placeholder="Categoría" required />

      <div className="grid gap-3 md:grid-cols-2">
        <Select name="bodyPart" defaultValue="lower_back">
          {BODY_PART_OPTIONS.map((part) => (
            <option key={part.value} value={part.value}>
              {part.label}
            </option>
          ))}
        </Select>
        <Select name="difficulty" defaultValue="medium">
          <option value="easy">Fácil</option>
          <option value="medium">Medio</option>
          <option value="hard">Difícil</option>
        </Select>
      </div>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar ejercicio"}
      </Button>
    </form>
  );
}
