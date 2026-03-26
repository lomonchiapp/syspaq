import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreateContainer } from "@/hooks/use-api";

interface CreateContainerDialogProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS = [
  { value: "MARITIME_FCL", label: "Maritimo FCL" },
  { value: "MARITIME_LCL", label: "Maritimo LCL" },
  { value: "AIR", label: "Aereo" },
];

const MODE_OPTIONS = [
  { value: "SEA", label: "Maritimo" },
  { value: "AIR", label: "Aereo" },
];

export function CreateContainerDialog({ open, onClose }: CreateContainerDialogProps) {
  const toast = useToast();
  const createMutation = useCreateContainer();

  const [form, setForm] = useState({
    number: "",
    type: "",
    mode: "",
    origin: "",
    destination: "",
    carrier: "",
    vesselName: "",
    voyageNumber: "",
    blNumber: "",
    sealNumber: "",
    estimatedDeparture: "",
    estimatedArrival: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = Object.values(form).some((v) => v !== "");

  const handleClose = () => {
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Deseas cerrar?")) return;
    resetAndClose();
  };

  const resetAndClose = () => {
    setForm({ number: "", type: "", mode: "", origin: "", destination: "", carrier: "", vesselName: "", voyageNumber: "", blNumber: "", sealNumber: "", estimatedDeparture: "", estimatedArrival: "", notes: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.number.trim()) errs.number = "El numero de contenedor es requerido";
    if (!form.type) errs.type = "El tipo es requerido";
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
        type: form.type,
        mode: form.mode,
        origin: form.origin.trim() || undefined,
        destination: form.destination.trim() || undefined,
        carrier: form.carrier.trim() || undefined,
        vesselName: form.vesselName.trim() || undefined,
        voyageNumber: form.voyageNumber.trim() || undefined,
        blNumber: form.blNumber.trim() || undefined,
        sealNumber: form.sealNumber.trim() || undefined,
        estimatedDeparture: form.estimatedDeparture || undefined,
        estimatedArrival: form.estimatedArrival || undefined,
        notes: form.notes.trim() || undefined,
      } as any);
      toast.success("Contenedor creado exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear el contenedor");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Nuevo Contenedor" description="Registra un nuevo contenedor de carga" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Numero"
            placeholder="MSKU1234567"
            value={form.number}
            onChange={(e) => update("number", e.target.value)}
            error={errors.number}
          />
          <Select
            label="Tipo"
            placeholder="Seleccionar..."
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            error={errors.type}
          />
          <Select
            label="Modo"
            placeholder="Seleccionar..."
            options={MODE_OPTIONS}
            value={form.mode}
            onChange={(e) => update("mode", e.target.value)}
            error={errors.mode}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
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
          <Input
            label="Carrier"
            placeholder="Maersk, MSC..."
            value={form.carrier}
            onChange={(e) => update("carrier", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre del Buque"
            placeholder="MSC GULSUN"
            value={form.vesselName}
            onChange={(e) => update("vesselName", e.target.value)}
          />
          <Input
            label="Numero de Viaje"
            placeholder="VOY-2025-001"
            value={form.voyageNumber}
            onChange={(e) => update("voyageNumber", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="B/L Number"
            placeholder="MSKU12345678"
            value={form.blNumber}
            onChange={(e) => update("blNumber", e.target.value)}
          />
          <Input
            label="Numero de Sello"
            placeholder="SEAL-001"
            value={form.sealNumber}
            onChange={(e) => update("sealNumber", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Salida Estimada"
            type="date"
            value={form.estimatedDeparture}
            onChange={(e) => update("estimatedDeparture", e.target.value)}
          />
          <Input
            label="Llegada Estimada"
            type="date"
            value={form.estimatedArrival}
            onChange={(e) => update("estimatedArrival", e.target.value)}
          />
        </div>

        <Textarea
          label="Notas"
          placeholder="Notas adicionales..."
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Contenedor
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
