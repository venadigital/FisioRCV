import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ExerciseCompleteForm } from "@/components/forms/exercise-complete-form";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";

export default async function PatientExercisesPage() {
  await requireRole("patient");
  const supabase = await createClient();

  const { data: planItemsData } = await supabase
    .from("exercise_plan_items")
    .select(
      "id, custom_instructions, exercises(name, youtube_url, instructions, series, reps, frequency_per_week)",
    )
    .eq("active", true)
    .order("sort_order", { ascending: true });
  const planItems = planItemsData ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Mis ejercicios" description="Sigue tus ejercicios y marca cada ejecución." />

      {planItems.length === 0 ? (
        <Card>
          <p className="text-slate-600">No tienes ejercicios asignados por ahora.</p>
        </Card>
      ) : (
        planItems.map((item) => {
          const exercise = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises;

          return (
            <Card key={item.id}>
              <h2 className="text-lg font-semibold">{exercise?.name ?? "Ejercicio"}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {item.custom_instructions || exercise?.instructions} | {exercise?.series} series x {exercise?.reps}{" "}
                reps | {exercise?.frequency_per_week} veces/semana
              </p>
              {exercise?.youtube_url ? (
                <div className="mt-3 overflow-hidden rounded-xl">
                  <iframe
                    title={`video-${item.id}`}
                    className="aspect-video w-full"
                    src={exercise.youtube_url.replace("watch?v=", "embed/")}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : null}

              <ExerciseCompleteForm planItemId={item.id} />
            </Card>
          );
        })
      )}
    </div>
  );
}
