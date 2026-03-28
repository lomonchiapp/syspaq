import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";

/* ------------------------------------------------------------------ */
/*  Inline mutation hook                                               */
/* ------------------------------------------------------------------ */

function useCreateVoyage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => api.post<any>("/v1/voyages", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["voyages"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Props & options                                                    */
/* ------------------------------------------------------------------ */

interface CreateVoyageDialogProps {
  open: boolean;
  onClose: () => void;
}

const MODE_OPTIONS = [
  { value: "SEA", label: "Maritimo" },
  { value: "AIR", label: "Aereo" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CreateVoyageDialog({ open, onClose }: CreateVoyageDialogProps) {
  const toast = useToast();
  const createMutation = useCreateVoyage();

  const [form, setForm] = useState({
    number: "",
    mode: "",
    carrier: "",
    vesselName: "",
    masterAwb: "",
    origin: "",
    destination: "",
    departureDate: "",
    arrivalDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = Object.values(form).some((v) => v !== "");

  const handleClose = () => {
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Deseas cerrar?")) return;
    resetAndClose();
  };

  const resetAndClose = () => {
    setForm({ number: "", mode: "", carrier: "", vesselName: "", masterAwb: "", origin: "", destination: "", departureDate: "", arrivalDate: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.number.trim()) errs.number = "El numero de embarcacion es requerido";
    if (!form.mode) errs.mode = "El modo es requerido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        number: form.number.trim(),
        mode: form.mode,
        carrier: form.carrier.trim() || undefined,
        vesselName: form.vesselName.trim() || undefined,
        masterAwb: form.masterAwb.trim() || undefined,
        origin: form.origin.trim() || undefined,
        destination: form.destination.trim() || undefined,
        departureDate: form.departureDate || undefined,
        arrivalDate: form.arrivalDate || undefined,
      });
      toast.success("Embarcacion creada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear la embarcacion");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Nueva Embarcacion" description="Registra un nuevo viaje maritimo o aereo" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Numero"
            placeholder="VOY-2025-001"
            value={form.number}
            onChange={(e) => update("number", e.target.value)}
            error={errors.number}
          />
          <Select
            label="Modo"
            placeholder="Seleccionar..."
            options={MODE_OPTIONS}
            value={form.mode}
            onChange={(e) => update("mode", e.target.value)}
            error={errors.mode}
          />
          <Input
            label="Carrier"
            placeholder="Maersk, MSC..."
            value={form.carrier}
            onChange={(e) => update("carrier", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre del Buque / Vuelo"
            placeholder="MSC GULSUN"
            value={form.vesselName}
            onChange={(e) => update("vesselName", e.target.value)}
          />
          <Input
            label="Master AWB"
            placeholder="123-45678901"
            value={form.masterAwb}
            onChange={(e) => update("masterAwb", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Origen"
            placeholder="MIA"
            value={form.origin}
            onChange={(e) => update("origin", e.target.value)}
          />
          <Input
            label="Destino"
            placeholder="SDQ"
            value={form.destination}
            onChange={(e) => update("destination", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fecha de Salida"
            type="date"
            value={form.departureDate}
            onChange={(e) => update("departureDate", e.target.value)}
          />
          <Input
            label="Fecha de Llegada"
            type="date"
            value={form.arrivalDate}
            onChange={(e) => update("arrivalDate", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Embarcacion
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
