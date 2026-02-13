import { AdminExerciseForm } from "@/components/forms/admin-exercise-form";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { BODY_PART_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type DifficultyValue = "easy" | "medium" | "hard";
type BodyPartValue = (typeof BODY_PART_OPTIONS)[number]["value"];

const bodyPartLabelMap = new Map(BODY_PART_OPTIONS.map((part) => [part.value, part.label]));

function difficultyTone(difficulty: DifficultyValue) {
  if (difficulty === "easy") {
    return {
      label: "Bajo",
      badge: "bg-[#dff4e5] text-[#2a885b]",
    };
  }

  if (difficulty === "hard") {
    return {
      label: "Alto",
      badge: "bg-[#fee8e8] text-[#c45353]",
    };
  }

  return {
    label: "Medio",
    badge: "bg-[#fff3d7] text-[#9a7320]",
  };
}

function bodyPartTone(bodyPart: BodyPartValue) {
  if (bodyPart === "neck") return "bg-gradient-to-br from-[#f6efe7] via-[#f0f6f4] to-[#e7efff]";
  if (bodyPart === "upper_back") return "bg-gradient-to-br from-[#f0f7ff] via-[#e8f0f7] to-[#e0f5ea]";
  if (bodyPart === "lower_back") return "bg-gradient-to-br from-[#f8efe5] via-[#f3f5ff] to-[#eef8f4]";
  if (bodyPart === "shoulder") return "bg-gradient-to-br from-[#efeef8] via-[#f6f0ec] to-[#e8f6ff]";
  if (bodyPart === "knee") return "bg-gradient-to-br from-[#eef7ff] via-[#f5f5f5] to-[#f9efe7]";
  return "bg-gradient-to-br from-[#eef3f8] via-[#f5f7fb] to-[#ecf4ef]";
}

function exerciseImageFromYoutube(url: string | null) {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace("www.", "");
    let videoId: string | null = null;

    if (hostname === "youtu.be") {
      videoId = parsedUrl.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (hostname.endsWith("youtube.com")) {
      videoId = parsedUrl.searchParams.get("v");

      if (!videoId) {
        videoId = parsedUrl.pathname.split("/").filter(Boolean).at(-1) ?? null;
      }
    }

    if (!videoId) return null;

    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return null;
  }
}

export default async function AdminExercisesPage() {
  const context = await requireRole("admin");
  const supabase = await createClient();

  const { data: exercisesData } = await supabase
    .from("exercises")
    .select("id, name, category, body_part, difficulty, clinic_id, youtube_url, series, active")
    .or(`clinic_id.is.null,clinic_id.eq.${context.clinicId}`)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(60);

  const exercises = exercisesData ?? [];
  const visibleExercises = exercises.slice(0, 6);

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-5xl font-semibold tracking-tight text-[#111827]">Biblioteca global de ejercicios</h1>
        <p className="mt-2 text-2xl text-slate-500">Gestiona ejercicios por zona corporal, categoría y dificultad.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.03fr_1fr]">
        <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
          <div className="border-b border-slate-200 px-7 py-6">
            <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-800">
              <span className="text-[#0d7b97]">●</span>
              Nuevo ejercicio
            </h2>
          </div>
          <div className="px-7 py-6">
            <AdminExerciseForm />
          </div>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-7 py-6">
            <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-800">
              <span className="text-[#0d7b97]">▣</span>
              Biblioteca actual
            </h2>
            <input
              placeholder="Buscar ejercicio..."
              className="h-12 w-full rounded-xl border border-slate-300 px-4 text-xl text-slate-700 outline-none focus:ring-2 focus:ring-[#0d7b97] md:w-80"
            />
          </div>

          <div className="p-6">
            {visibleExercises.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-xl text-slate-500">
                Aún no hay ejercicios cargados.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleExercises.map((exercise) => {
                  const tone = difficultyTone(exercise.difficulty as DifficultyValue);
                  const imageUrl = exerciseImageFromYoutube(exercise.youtube_url);
                  const bodyPart = exercise.body_part as BodyPartValue;

                  return (
                    <article key={exercise.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="relative h-44 overflow-hidden border-b border-slate-200">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={exercise.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className={cn("flex h-full w-full items-center justify-center", bodyPartTone(bodyPart))}>
                            <span className="text-sm font-medium text-slate-500">Sin imagen</span>
                          </div>
                        )}

                        <span
                          className={cn(
                            "absolute right-3 top-3 rounded-full px-3 py-1 text-lg font-semibold",
                            tone.badge,
                          )}
                        >
                          {tone.label}
                        </span>
                      </div>

                      <div className="px-4 py-3">
                        <p className="text-2xl font-semibold tracking-tight text-slate-900">{exercise.name}</p>
                        <p className="mt-1 text-base text-slate-500">
                          {bodyPartLabelMap.get(bodyPart) ?? "General"} • {exercise.series} Series
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-7 py-5">
            <p className="text-xl text-slate-500">
              Mostrando {visibleExercises.length} de {exercises.length}
            </p>
            <div className="flex gap-3">
              <button className="h-11 w-11 rounded-xl border border-slate-300 text-base text-slate-500">‹</button>
              <button className="h-11 w-11 rounded-xl border border-slate-300 text-base text-slate-500">›</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
