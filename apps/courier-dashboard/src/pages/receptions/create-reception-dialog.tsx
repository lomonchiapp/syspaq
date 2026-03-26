import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreateReception, useBranches } from "@/hooks/use-api";

interface CreateReceptionDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateReceptionDialog({ open, onClose }: CreateReceptionDialogProps) {
  const toast = useToast();
  const createMutation = useCreateReception();
  const { data: branchesData } = useBranches(1, 100);

  const [form, setForm] = useState({
    shipmentId: "",
    branchId: "",
    customerId: "",
    weightLbs: "",
    lengthCm: "",
    widthCm: "",
    heightCm: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = Object.values(form).some((v) => v !== "");

  const branchOptions = (branchesData?.data ?? []).map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  const handleClose = () => {
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Deseas cerrar?")) return;
    resetAndClose();
  };

  const resetAndClose = () => {
    setForm({ shipmentId: "", branchId: "", customerId: "", weightLbs: "", lengthCm: "", widthCm: "", heightCm: "", notes: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.shipmentId.trim()) errs.shipmentId = "El ID del envio es requerido";
    if (!form.branchId) errs.branchId = "La sucursal es requerida";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        shipmentId: form.shipmentId.trim(),
        branchId: form.branchId,
        customerId: form.customerId.trim() || undefined,
        weightLbs: form.weightLbs ? Number(form.weightLbs) : undefined,
        lengthCm: form.lengthCm ? Number(form.lengthCm) : undefined,
        widthCm: form.widthCm ? Number(form.widthCm) : undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        notes: form.notes.trim() || undefined,
      } as any);
      toast.success("Recepcion creada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear la recepcion");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Nueva Recepcion" description="Registra la recepcion de un paquete en bodega" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="ID del Envio"
          placeholder="UUID del envio..."
          value={form.shipmentId}
          onChange={(e) => update("shipmentId", e.target.value)}
          error={errors.shipmentId}
        />

        <Select
          label="Sucursal"
          placeholder="Seleccionar sucursal..."
          options={branchOptions}
          value={form.branchId}
          onChange={(e) => update("branchId", e.target.value)}
          error={errors.branchId}
        />

        <Input
          label="ID de Cliente"
          placeholder="UUID del cliente (opcional)"
          value={form.customerId}
          onChange={(e) => update("customerId", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Peso (lbs)"
            type="number"
            placeholder="0.00"
            value={form.weightLbs}
            onChange={(e) => update("weightLbs", e.target.value)}
          />
          <Input
            label="Largo (cm)"
            type="number"
            placeholder="0"
            value={form.lengthCm}
            onChange={(e) => update("lengthCm", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Ancho (cm)"
            type="number"
            placeholder="0"
            value={form.widthCm}
            onChange={(e) => update("widthCm", e.target.value)}
          />
          <Input
            label="Alto (cm)"
            type="number"
            placeholder="0"
            value={form.heightCm}
            onChange={(e) => update("heightCm", e.target.value)}
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
            Crear Recepcion
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
