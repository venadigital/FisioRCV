"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage, safeParseJson } from "@/lib/http";

export type AdminClinicDraft = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  timezone: string;
  active: boolean;
};

export function AdminClinicModalForm({
  clinic,
  onSaved,
  onCancel,
}: {
  clinic: AdminClinicDraft | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/Mexico_City");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setName(clinic?.name ?? "");
    setAddress(clinic?.address ?? "");
    setPhone(clinic?.phone ?? "");
    setTimezone(clinic?.timezone ?? "America/Mexico_City");
    setActive(clinic?.active ?? true);
    setMessage(null);
    setIsError(false);
  }, [clinic]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage(null);
    setIsError(false);

    const payload = {
      name,
      address,
      phone,
      timezone,
      active,
    };

    const endpoint = clinic ? `/api/admin/clinics/${clinic.id}` : "/api/admin/clinics";
    const method = clinic ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await safeParseJson<{ error?: string }>(response);

      if (!response.ok) {
        setIsError(true);
        setMessage(getApiErrorMessage(json, "No se pudo guardar la sede"));
        setLoading(false);
        return;
      }

      onSaved();
    } catch {
      setIsError(true);
      setMessage("Error de red al guardar sede");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Nombre</label>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="h-11 rounded-xl px-3 text-sm"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Dirección</label>
        <Input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          required
          className="h-11 rounded-xl px-3 text-sm"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Teléfono</label>
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11 rounded-xl px-3 text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Zona horaria</label>
          <Input
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className="h-11 rounded-xl px-3 text-sm"
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Sede activa
      </label>

      {message ? (
        <p
          className={
            isError
              ? "rounded-xl bg-[#fff1f1] px-3 py-2 text-sm text-[#b84747]"
              : "rounded-xl bg-[#e8f4ef] px-3 py-2 text-sm text-[#2a885b]"
          }
        >
          {message}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} className="h-11 rounded-xl px-5 text-sm">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="h-11 rounded-xl px-5 text-sm font-semibold">
          {loading ? "Guardando..." : clinic ? "Guardar cambios" : "Crear sede"}
        </Button>
      </div>
    </form>
  );
}
