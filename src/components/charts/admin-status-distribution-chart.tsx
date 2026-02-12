"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type AdminStatusSlice = {
  label: string;
  value: number;
  color: string;
};

export function AdminStatusDistributionChart({ data }: { data: AdminStatusSlice[] }) {
  const hasData = data.some((slice) => slice.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-[330px] items-center justify-center">
        <div className="flex h-56 w-56 items-center justify-center rounded-full border-[24px] border-slate-200">
          <span className="text-sm text-slate-500">Sin datos</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[330px] w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="46%"
            innerRadius={84}
            outerRadius={122}
            stroke="none"
          >
            {data.map((slice) => (
              <Cell key={slice.label} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #dbe2ec",
              background: "#ffffff",
              fontSize: 14,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
