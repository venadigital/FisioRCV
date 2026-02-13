"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BODY_PART_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function AdminExerciseForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setIsError(false);

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
    if (response.ok) {
      setMessage("Ejercicio guardado correctamente");
      formRef.current?.reset();
      router.refresh();
    } else {
      setIsError(true);
      setMessage(json.error ?? "No se pudo guardar");
    }
    setLoading(false);
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await onSubmit(formData);
      }}
      className="space-y-5"
    >
      <div>
        <label className="mb-2 block text-base font-medium text-slate-800">Nombre del ejercicio</label>
        <Input
          name="name"
          placeholder="Ej: Sentadilla isométrica"
          required
          className="h-12 rounded-xl border-slate-300 px-4 text-xl text-slate-700"
        />
      </div>

      <div>
        <label className="mb-2 block text-base font-medium text-slate-800">Enlace de video</label>
        <Input
          name="youtubeUrl"
          type="url"
          placeholder="https://youtube.com/..."
          required
          className="h-12 rounded-xl border-slate-300 px-4 text-xl text-slate-700"
        />
      </div>

      <div>
        <label className="mb-2 block text-base font-medium text-slate-800">Instrucciones</label>
        <Textarea
          name="instructions"
          rows={4}
          placeholder="Describe paso a paso cómo realizar el ejercicio..."
          required
          className="rounded-xl border-slate-300 px-4 py-3 text-xl text-slate-700"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xl font-semibold uppercase tracking-wide text-slate-500">Series</label>
          <Input
            name="series"
            type="number"
            min={1}
            defaultValue={3}
            required
            className="h-11 rounded-xl px-3 text-xl text-slate-700"
          />
        </div>
        <div>
          <label className="mb-1 block text-xl font-semibold uppercase tracking-wide text-slate-500">
            Repeticiones
          </label>
          <Input
            name="reps"
            type="number"
            min={1}
            defaultValue={12}
            required
            className="h-11 rounded-xl px-3 text-xl text-slate-700"
          />
        </div>
        <div>
          <label className="mb-1 block text-xl font-semibold uppercase tracking-wide text-slate-500">Frecuencia</label>
          <Input
            name="frequencyPerWeek"
            type="number"
            min={1}
            defaultValue={4}
            required
            className="h-11 rounded-xl px-3 text-xl text-slate-700"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-base font-medium text-slate-800">Categoría</label>
        <Input
          name="category"
          placeholder="Ej: Fortalecimiento, Estiramiento"
          required
          className="h-12 rounded-xl border-slate-300 px-4 text-xl text-slate-700"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-base font-medium text-slate-800">Zona Corporal</label>
          <Select name="bodyPart" defaultValue="lower_back" className="h-12 rounded-xl px-4 text-xl">
            {BODY_PART_OPTIONS.map((part) => (
              <option key={part.value} value={part.value}>
                {part.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-base font-medium text-slate-800">Dificultad</label>
          <Select name="difficulty" defaultValue="medium" className="h-12 rounded-xl px-4 text-xl">
            <option value="easy">Bajo</option>
            <option value="medium">Medio</option>
            <option value="hard">Alto</option>
          </Select>
        </div>
      </div>

      {message ? (
        <p
          className={
            isError
              ? "rounded-xl bg-[#fff1f1] px-4 py-3 text-xl text-[#b84747]"
              : "rounded-xl bg-[#e8f4ef] px-4 py-3 text-xl text-[#2a885b]"
          }
        >
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={loading}
        className="mt-2 h-14 rounded-xl bg-[#0d7b97] px-8 text-base font-semibold text-white hover:bg-[#0a647b]"
      >
        {loading ? "Guardando..." : "Guardar ejercicio"}
      </Button>
    </form>
  );
}
