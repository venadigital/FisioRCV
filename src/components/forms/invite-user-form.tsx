"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function InviteUserForm({ clinicId }: { clinicId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const payload = {
      email: formData.get("email"),
      role: formData.get("role"),
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      clinicId,
    };

    const response = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();
    setMessage(response.ok ? "Invitación enviada" : json.error ?? "No se pudo invitar");
    setLoading(false);
  }

  return (
    <form
      action={async (formData) => {
        await onSubmit(formData);
      }}
      className="space-y-3"
    >
      <Input name="fullName" placeholder="Nombre completo" required />
      <Input type="email" name="email" placeholder="correo@centro.com" required />
      <Input name="phone" placeholder="Teléfono" required />
      <Select name="role" defaultValue="therapist">
        <option value="therapist">Fisioterapeuta</option>
        <option value="admin">Admin</option>
        <option value="patient">Paciente</option>
      </Select>

      {message ? <p className="text-sm text-slate-700">{message}</p> : null}

      <Button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Invitar usuario"}
      </Button>
    </form>
  );
}
