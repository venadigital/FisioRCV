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
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Límite de usos</label>
        <Input name="maxUses" type="number" min={1} defaultValue={50} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Expira el (opcional)</label>
        <Input name="expiresAt" type="datetime-local" />
      </div>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? "Generando..." : "Generar código"}
      </Button>
    </form>
  );
}
