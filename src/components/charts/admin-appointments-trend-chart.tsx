"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type AdminTrendPoint = {
  month: string;
  total: number;
};

export function AdminAppointmentsTrendChart({ data }: { data: AdminTrendPoint[] }) {
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 24, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#d6dee8" strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 14 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 14 }} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #dbe2ec",
              background: "#ffffff",
              fontSize: 14,
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#4b70ba"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
