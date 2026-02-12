"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AppointmentStatusForm({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function update(nextStatus: "scheduled" | "completed" | "cancelled" | "no_show") {
    setLoading(true);
    const response = await fetch(`/api/appointments/${appointmentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (response.ok) {
      setStatus(nextStatus);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-600">Estado: {status}</span>
      <Button type="button" variant="secondary" disabled={loading} onClick={() => update("completed")}>
        Completar
      </Button>
      <Button type="button" variant="ghost" disabled={loading} onClick={() => update("scheduled")}>
        Programada
      </Button>
      <Button type="button" variant="danger" disabled={loading} onClick={() => update("cancelled")}>
        Cancelar
      </Button>
      <Button type="button" variant="ghost" disabled={loading} onClick={() => update("no_show")}>
        No show
      </Button>
    </div>
  );
}
