"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type WeeklyPainPoint = {
  week: string;
  avgIntensity: number;
};

export function PainWeeklyChart({ data }: { data: WeeklyPainPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis dataKey="week" stroke="#475569" />
          <YAxis domain={[0, 10]} stroke="#475569" />
          <Tooltip />
          <Line type="monotone" dataKey="avgIntensity" stroke="#0e7490" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
