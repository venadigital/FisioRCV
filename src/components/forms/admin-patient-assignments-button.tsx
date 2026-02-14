"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage, safeParseJson } from "@/lib/http";

type TherapistOption = {
  id: string;
  label: string;
};

export function AdminPatientAssignmentsButton({
  patientId,
  clinicId,
  therapists,
  initialPrimaryTherapistId,
  initialSecondaryTherapistIds,
}: {
  patientId: string;
  clinicId: string;
  therapists: TherapistOption[];
  initialPrimaryTherapistId: string | null;
  initialSecondaryTherapistIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [primaryTherapistId, setPrimaryTherapistId] = useState(initialPrimaryTherapistId ?? "");
  const [secondaryTherapistIds, setSecondaryTherapistIds] = useState<string[]>(initialSecondaryTherapistIds);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const availableSecondary = useMemo(
    () => therapists.filter((therapist) => therapist.id !== primaryTherapistId),
    [therapists, primaryTherapistId],
  );

  function onToggleSecondary(therapistId: string) {
    setSecondaryTherapistIds((previous) => {
      if (previous.includes(therapistId)) {
        return previous.filter((value) => value !== therapistId);
      }

      return [...previous, therapistId];
    });
  }

  async function onSubmit() {
    setLoading(true);
    setMessage(null);
    setIsError(false);

    if (!primaryTherapistId) {
      setLoading(false);
      setIsError(true);
      setMessage("Debes seleccionar un terapeuta principal");
      return;
    }

    const payload = {
      clinicId,
      primaryTherapistId,
      secondaryTherapistIds,
    };

    try {
      const response = await fetch(`/api/admin/patient-assignments/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await safeParseJson<{ error?: string }>(response);

      if (!response.ok) {
        setIsError(true);
        setMessage(getApiErrorMessage(json, "No se pudieron guardar las asignaciones"));
        setLoading(false);
        return;
      }

      setMessage("Asignaciones guardadas");
      router.refresh();
      setOpen(false);
    } catch {
      setIsError(true);
      setMessage("Error de red al guardar asignaciones");
    } finally {
      setLoading(false);
    }
  }

  function onPrimaryChange(nextValue: string) {
    setPrimaryTherapistId(nextValue);
    setSecondaryTherapistIds((previous) => previous.filter((therapistId) => therapistId !== nextValue));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Asignaciones
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Asignaciones de paciente">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Terapeuta principal</label>
            <Select
              name="primaryTherapistId"
              value={primaryTherapistId}
              onChange={(event) => onPrimaryChange(event.target.value)}
              className="h-11 rounded-xl px-3 text-sm"
            >
              <option value="">Seleccionar terapeuta</option>
              {therapists.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Terapeutas secundarios</p>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {availableSecondary.length === 0 ? (
                <p className="text-sm text-slate-500">No hay secundarios disponibles.</p>
              ) : (
                availableSecondary.map((therapist) => (
                  <label key={therapist.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={secondaryTherapistIds.includes(therapist.id)}
                      onChange={() => onToggleSecondary(therapist.id)}
                    />
                    {therapist.label}
                  </label>
                ))
              )}
            </div>
          </div>

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
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-11 rounded-xl px-5 text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className="h-11 rounded-xl bg-[#0e7a9a] px-5 text-sm font-semibold text-white hover:bg-[#0b6682]"
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
