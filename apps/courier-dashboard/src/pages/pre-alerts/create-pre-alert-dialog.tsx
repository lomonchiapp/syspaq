import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreatePreAlert } from "@/hooks/use-api";

interface CreatePreAlertDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePreAlertDialog({ open, onClose }: CreatePreAlertDialogProps) {
  const toast = useToast();
  const createMutation = useCreatePreAlert();

  const [form, setForm] = useState({
    trackingNumber: "",
    carrier: "",
    store: "",
    description: "",
    estimatedValue: "",
    currency: "USD",
    category: "",
    invoiceUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = Object.values(form).some((v, i) => i === 5 ? v !== "USD" : v !== "");

  const handleClose = () => {
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Deseas cerrar?")) return;
    resetAndClose();
  };

  const resetAndClose = () => {
    setForm({ trackingNumber: "", carrier: "", store: "", description: "", estimatedValue: "", currency: "USD", category: "", invoiceUrl: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.trackingNumber.trim()) errs.trackingNumber = "El numero de tracking es requerido";
    if (form.estimatedValue && isNaN(Number(form.estimatedValue))) errs.estimatedValue = "Debe ser un numero valido";
    if (form.invoiceUrl && !/^https?:\/\/.+/.test(form.invoiceUrl)) errs.invoiceUrl = "URL invalida";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        trackingNumber: form.trackingNumber.trim(),
        carrier: form.carrier.trim() || undefined,
        store: form.store.trim() || undefined,
        description: form.description.trim() || undefined,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        currency: form.currency || undefined,
        category: form.category.trim() || undefined,
        invoiceUrl: form.invoiceUrl.trim() || undefined,
      } as any);
      toast.success("Pre-alerta creada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear la pre-alerta");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Nueva Pre-Alerta" description="Registra un paquete pre-alertado" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Numero de Tracking"
            placeholder="1Z999AA10123456784"
            value={form.trackingNumber}
            onChange={(e) => update("trackingNumber", e.target.value)}
            error={errors.trackingNumber}
          />
          <Input
            label="Carrier"
            placeholder="UPS, FedEx, DHL..."
            value={form.carrier}
            onChange={(e) => update("carrier", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tienda"
            placeholder="Amazon, Shein, Walmart..."
            value={form.store}
            onChange={(e) => update("store", e.target.value)}
          />
          <Input
            label="Categoria"
            placeholder="Electronica, Ropa..."
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          />
        </div>

        <Textarea
          label="Descripcion"
          placeholder="Descripcion del contenido del paquete..."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor Estimado"
            type="number"
            placeholder="0.00"
            value={form.estimatedValue}
            onChange={(e) => update("estimatedValue", e.target.value)}
            error={errors.estimatedValue}
          />
          <Input
            label="Moneda"
            placeholder="USD"
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
          />
        </div>

        <Input
          label="URL de Factura"
          placeholder="https://..."
          value={form.invoiceUrl}
          onChange={(e) => update("invoiceUrl", e.target.value)}
          error={errors.invoiceUrl}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Pre-Alerta
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
