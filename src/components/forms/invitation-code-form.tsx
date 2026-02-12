"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

    const response = await fetch("/api/admin/invitation-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    if (response.ok) {
      setMessage(`Código generado: ${json.invitationCode}`);
    } else {
      setMessage(json.error ?? "No se pudo generar");
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
          <label className="mb-2 block text-2xl font-medium text-slate-800">Límite de usos</label>
          <Input
            name="maxUses"
            type="number"
            min={1}
            defaultValue={50}
            required
            className="h-12 rounded-xl border-slate-300 px-4 text-xl"
          />
          <p className="mt-2 text-lg text-slate-400">
            Cantidad máxima de veces que este código puede ser canjeado.
          </p>
        </div>
        <div>
          <label className="mb-2 block text-2xl font-medium text-slate-800">Expira el (opcional)</label>
          <Input name="expiresAt" type="datetime-local" className="h-12 rounded-xl border-slate-300 px-4 text-xl" />
          <p className="mt-2 text-lg text-slate-400">Deje en blanco para que el código no expire nunca.</p>
        </div>
      </div>

      {message ? <p className="text-lg text-slate-700">{message}</p> : null}

      <Button
        type="submit"
        disabled={loading}
        className="h-12 rounded-xl bg-[#0d7b97] px-8 text-2xl font-semibold text-white hover:bg-[#0a647b]"
      >
        {loading ? "Generando..." : "Generar código"}
      </Button>
    </form>
  );
}
