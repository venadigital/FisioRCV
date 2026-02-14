"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage, safeParseJson } from "@/lib/http";

export function InvitationCodeForm({ clinicId }: { clinicId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const payload = {
      clinicId,
      maxUses: Number(formData.get("maxUses")),
      expiresAt: formData.get("expiresAt")
        ? new Date(formData.get("expiresAt") as string).toISOString()
        : null,
    };

    try {
      const response = await fetch("/api/admin/invitation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await safeParseJson<{ invitationCode?: string; error?: string }>(response);
      if (response.ok) {
        setMessage(`Código generado: ${json?.invitationCode ?? "-"}`);
      } else {
        setMessage(getApiErrorMessage(json, "No se pudo generar"));
      }
    } catch {
      setMessage("Error de red. Intenta nuevamente.");
    }

    setLoading(false);
  }

  return (
    <form
      action={async (formData) => {
        await onSubmit(formData);
      }}
      className="space-y-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-base font-medium text-slate-800">Límite de usos</label>
          <Input
            name="maxUses"
            type="number"
            min={1}
            defaultValue={50}
            required
            className="h-12 rounded-xl border-slate-300 px-4 text-lg"
          />
          <p className="mt-2 text-lg text-slate-400">
            Cantidad máxima de veces que este código puede ser canjeado.
          </p>
        </div>
        <div>
          <label className="mb-2 block text-base font-medium text-slate-800">Expira el (opcional)</label>
          <Input name="expiresAt" type="datetime-local" className="h-12 rounded-xl border-slate-300 px-4 text-lg" />
          <p className="mt-2 text-lg text-slate-400">Deje en blanco para que el código no expire nunca.</p>
        </div>
      </div>

      {message ? <p className="text-lg text-slate-700">{message}</p> : null}

      <Button
        type="submit"
        disabled={loading}
        className="h-12 rounded-xl bg-[#0d7b97] px-8 text-base font-semibold text-white hover:bg-[#0a647b]"
      >
        {loading ? "Generando..." : "Generar código"}
      </Button>
    </form>
  );
}
