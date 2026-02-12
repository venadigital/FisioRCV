import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PainWeeklyChart } from "@/components/charts/pain-weekly-chart";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { daysAgoIso } from "@/lib/date";

function weekLabel(date: Date) {
  return `Sem ${Math.ceil(date.getDate() / 7)} ${date.toLocaleDateString("es-MX", { month: "short" })}`;
}

export default async function PatientEvolutionPage() {
  const context = await requireRole("patient");
  const supabase = await createClient();

  const { data: eventsData } = await supabase
    .from("pain_events")
    .select("recorded_at, intensity, body_part, trigger")
    .eq("patient_id", context.userId)
    .gte("recorded_at", daysAgoIso(28))
    .order("recorded_at", { ascending: true });
  const events = eventsData ?? [];

  const grouped = new Map<string, { total: number; count: number }>();

  for (const event of events) {
    const key = weekLabel(new Date(event.recorded_at));
    const current = grouped.get(key) ?? { total: 0, count: 0 };
    grouped.set(key, { total: current.total + event.intensity, count: current.count + 1 });
  }

  const chartData = Array.from(grouped.entries()).map(([week, value]) => ({
    week,
    avgIntensity: Number((value.total / value.count).toFixed(2)),
  }));

  const recent = [...events].reverse().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader title="Mi evolución" description="Promedio de dolor por semana y registros recientes." />

      <Card>
        <PainWeeklyChart data={chartData} />
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Registros recientes</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {recent.length === 0 ? (
            <li className="text-slate-500">Aún no hay registros</li>
          ) : (
            recent.map((event, idx) => (
              <li key={`${event.recorded_at}-${idx}`} className="rounded-lg border border-slate-200 p-3">
                <p className="font-semibold text-slate-900">
                  {new Date(event.recorded_at).toLocaleString("es-MX")} - {event.intensity}/10
                </p>
                <p className="text-slate-600">
                  {event.body_part} | {event.trigger}
                </p>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
