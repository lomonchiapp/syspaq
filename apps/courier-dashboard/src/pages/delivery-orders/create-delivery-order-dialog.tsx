import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreateDeliveryOrder, useBranches } from "@/hooks/use-api";

interface CreateDeliveryOrderDialogProps {
  open: boolean;
  onClose: () => void;
}

const DELIVERY_TYPE_OPTIONS = [
  { value: "PICKUP", label: "Retiro en Sucursal" },
  { value: "HOME_DELIVERY", label: "Entrega a Domicilio" },
  { value: "LOCKER", label: "Casillero / Locker" },
];

export function CreateDeliveryOrderDialog({ open, onClose }: CreateDeliveryOrderDialogProps) {
  const toast = useToast();
  const createMutation = useCreateDeliveryOrder();
  const { data: branchesData } = useBranches(1, 100);

  const [form, setForm] = useState({
    shipmentId: "",
    customerId: "",
    deliveryType: "",
    pickupBranchId: "",
    deliveryAddress: "",
    scheduledAt: "",
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
    setForm({ shipmentId: "", customerId: "", deliveryType: "", pickupBranchId: "", deliveryAddress: "", scheduledAt: "", notes: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.shipmentId.trim()) errs.shipmentId = "El ID del envio es requerido";
    if (!form.deliveryType) errs.deliveryType = "El tipo de entrega es requerido";
    if (form.deliveryType === "PICKUP" && !form.pickupBranchId) errs.pickupBranchId = "La sucursal de retiro es requerida";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload: Record<string, unknown> = {
        shipmentId: form.shipmentId.trim(),
        deliveryType: form.deliveryType,
        customerId: form.customerId.trim() || undefined,
        scheduledAt: form.scheduledAt || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (form.deliveryType === "PICKUP" && form.pickupBranchId) {
        payload.pickupBranchId = form.pickupBranchId;
      }
      if (form.deliveryType === "HOME_DELIVERY" && form.deliveryAddress.trim()) {
        payload.deliveryAddress = { street: form.deliveryAddress.trim() };
      }

      await createMutation.mutateAsync(payload as any);
      toast.success("Orden de entrega creada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear la orden de entrega");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Nueva Orden de Entrega" description="Crea una orden de ultima milla" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="ID del Envio"
            placeholder="UUID del envio..."
            value={form.shipmentId}
            onChange={(e) => update("shipmentId", e.target.value)}
            error={errors.shipmentId}
          />
          <Input
            label="ID de Cliente"
            placeholder="UUID del cliente (opcional)"
            value={form.customerId}
            onChange={(e) => update("customerId", e.target.value)}
          />
        </div>

        <Select
          label="Tipo de Entrega"
          placeholder="Seleccionar tipo..."
          options={DELIVERY_TYPE_OPTIONS}
          value={form.deliveryType}
          onChange={(e) => update("deliveryType", e.target.value)}
          error={errors.deliveryType}
        />

        {form.deliveryType === "PICKUP" && (
          <Select
            label="Sucursal de Retiro"
            placeholder="Seleccionar sucursal..."
            options={branchOptions}
            value={form.pickupBranchId}
            onChange={(e) => update("pickupBranchId", e.target.value)}
            error={errors.pickupBranchId}
          />
        )}

        {form.deliveryType === "HOME_DELIVERY" && (
          <Input
            label="Direccion de Entrega"
            placeholder="Calle, sector, ciudad..."
            value={form.deliveryAddress}
            onChange={(e) => update("deliveryAddress", e.target.value)}
          />
        )}

        <Input
          label="Fecha Programada"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => update("scheduledAt", e.target.value)}
        />

        <Textarea
          label="Notas"
          placeholder="Instrucciones especiales..."
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Orden
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
