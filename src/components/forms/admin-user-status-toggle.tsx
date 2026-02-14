"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage, safeParseJson } from "@/lib/http";

export function AdminUserStatusToggle({ userId, active }: { userId: string; active: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggle() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });

      const json = await safeParseJson<{ error?: string }>(response);

      if (!response.ok) {
        setError(getApiErrorMessage(json, "No se pudo actualizar el estado"));
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Error de red al actualizar estado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={onToggle}
        className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
      >
        {loading ? "Actualizando..." : active ? "Desactivar" : "Activar"}
      </button>
      {error ? <p className="max-w-56 text-right text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
