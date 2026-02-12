import { TherapistExerciseForm } from "@/components/forms/therapist-exercise-form";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function TherapistExercisesPage() {
  const context = await requireRole("therapist");
  const supabase = await createClient();

  const { data: exercisesData } = await supabase
    .from("exercises")
    .select("id, name, category, body_part, difficulty, clinic_id")
    .or(`clinic_id.is.null,clinic_id.eq.${context.clinicId},created_by.eq.${context.userId}`)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(50);
  const exercises = exercisesData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Biblioteca de ejercicios" description="Globales + de tu sede + propios." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Crear ejercicio</h2>
          <TherapistExerciseForm />
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Ejercicios disponibles</h2>
          <ul className="space-y-2 text-sm">
            {exercises.length === 0 ? (
              <li className="text-slate-500">No hay ejercicios todavía.</li>
            ) : (
              exercises.map((exercise) => (
                <li key={exercise.id} className="rounded-md border border-slate-200 p-2">
                  <p className="font-semibold text-slate-900">{exercise.name}</p>
                  <p className="text-slate-600">
                    {exercise.category} | {exercise.body_part} | {exercise.difficulty}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
