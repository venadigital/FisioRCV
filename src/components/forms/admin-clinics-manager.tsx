"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { AdminClinicDraft, AdminClinicModalForm } from "@/components/forms/admin-clinic-modal-form";

function statusBadge(active: boolean) {
  if (active) {
    return <span className="rounded-full bg-[#dff4e5] px-3 py-1 text-sm font-medium text-[#2a885b]">Activa</span>;
  }

  return <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-600">Inactiva</span>;
}

export function AdminClinicsManager({
  clinics,
  currentClinicId,
}: {
  clinics: AdminClinicDraft[];
  currentClinicId: string | null;
}) {
  const router = useRouter();
  const [selectedClinic, setSelectedClinic] = useState<AdminClinicDraft | null>(null);
  const [open, setOpen] = useState(false);

  function onCreate() {
    setSelectedClinic(null);
    setOpen(true);
  }

  function onEdit(clinic: AdminClinicDraft) {
    setSelectedClinic(clinic);
    setOpen(true);
  }

  function onSaved() {
    setOpen(false);
    setSelectedClinic(null);
    router.refresh();
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#111827]">Gestión de sedes</h1>
          <p className="mt-2 text-xl text-slate-500">CRUD de sedes. En MVP operativo: una sede activa.</p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="h-12 rounded-xl bg-[#4f74bc] px-7 text-base font-semibold text-white hover:bg-[#4467ac]"
        >
          + Añadir nueva sede
        </button>
      </header>

      {clinics.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-lg text-slate-500">No hay sedes registradas todavía.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {clinics.map((clinic) => (
            <Card key={clinic.id} className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm">
              <div className="px-7 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-slate-900">
                      {clinic.name}
                      {statusBadge(Boolean(clinic.active))}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 pt-1 text-lg text-slate-500">
                    <button
                      type="button"
                      onClick={() => onEdit(clinic)}
                      className="rounded-lg p-2 hover:bg-slate-100"
                      aria-label={`Editar ${clinic.name}`}
                    >
                      ✎
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="space-y-3 text-lg text-slate-500">
                    <p className="flex items-center gap-3">
                      <span className="text-base text-slate-400">⌖</span>
                      {clinic.address}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="text-base text-slate-400">◷</span>
                      {clinic.timezone}
                    </p>
                  </div>

                  <div className="space-y-3 text-lg text-slate-500">
                    <p className="flex items-center gap-3">
                      <span className="text-base text-slate-400">☏</span>
                      {clinic.phone || "Sin teléfono"}
                    </p>
                    <p className="flex items-center gap-3">
                      <span className="text-base text-slate-400">✉</span>
                      Sin correo configurado
                    </p>
                  </div>
                </div>

                {currentClinicId === clinic.id ? (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <p className="text-base font-medium text-[#3b62b2]">Sede principal de tu cuenta</p>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={selectedClinic ? "Editar sede" : "Crear nueva sede"}
      >
        <AdminClinicModalForm clinic={selectedClinic} onSaved={onSaved} onCancel={() => setOpen(false)} />
      </Modal>
    </div>
  );
}
