"use client";

import { useState } from "react";

type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

const STATUS_META: Record<AppointmentStatus, { label: string; classes: string }> = {
  scheduled: { label: "Pendiente", classes: "bg-[#fff3d7] text-[#986f1f]" },
  completed: { label: "Confirmada", classes: "bg-[#dff4e5] text-[#2e885b]" },
  cancelled: { label: "Cancelada", classes: "bg-[#fee6e6] text-[#be4f4f]" },
  no_show: { label: "No show", classes: "bg-slate-200 text-slate-700" },
};

export function AppointmentStatusMenu({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string;
  currentStatus: AppointmentStatus;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(currentStatus);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onChange(nextStatus: AppointmentStatus) {
    setLoading(true);

    const response = await fetch(`/api/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (response.ok) {
      setStatus(nextStatus);
      setOpen(false);
    }

    setLoading(false);
  }

  return (
    <div className="relative inline-flex items-center gap-3">
      <span className={`rounded-full px-3 py-1 text-xl font-semibold ${STATUS_META[status].classes}`}>
        {STATUS_META[status].label}
      </span>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-md px-2 py-1 text-base text-[#5478bd] hover:bg-slate-100"
      >
        ⋮
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {(Object.keys(STATUS_META) as AppointmentStatus[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              disabled={loading}
              className="block w-full rounded-lg px-3 py-2 text-left text-lg text-slate-700 hover:bg-slate-100"
            >
              {STATUS_META[option].label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
