import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreatePostAlert } from "@/hooks/use-api";

interface CreatePostAlertDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePostAlertDialog({ open, onClose }: CreatePostAlertDialogProps) {
  const toast = useToast();
  const createMutation = useCreatePostAlert();

  const [form, setForm] = useState({
    shipmentId: "",
    trackingNumber: "",
    recipientName: "",
    senderName: "",
    carrier: "",
    fob: "",
    currency: "USD",
    invoiceUrl: "",
    content: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = Object.values(form).some((v, i) => i === 6 ? v !== "USD" : v !== "");

  const handleClose = () => {
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Deseas cerrar?")) return;
    resetAndClose();
  };

  const resetAndClose = () => {
    setForm({ shipmentId: "", trackingNumber: "", recipientName: "", senderName: "", carrier: "", fob: "", currency: "USD", invoiceUrl: "", content: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.shipmentId.trim()) errs.shipmentId = "El ID del envio es requerido";
    if (!form.trackingNumber.trim()) errs.trackingNumber = "El numero de tracking es requerido";
    if (form.fob && isNaN(Number(form.fob))) errs.fob = "Debe ser un numero valido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        shipmentId: form.shipmentId.trim(),
        trackingNumber: form.trackingNumber.trim(),
        recipientName: form.recipientName.trim() || undefined,
        senderName: form.senderName.trim() || undefined,
        carrier: form.carrier.trim() || undefined,
        fob: form.fob ? Number(form.fob) : undefined,
        currency: form.currency || undefined,
        invoiceUrl: form.invoiceUrl.trim() || undefined,
        content: form.content.trim() || undefined,
      } as any);
      toast.success("Post-alerta creada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear la post-alerta");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Nueva Post-Alerta" description="Registra una confirmacion post-entrega" size="lg">
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
            label="Numero de Tracking"
            placeholder="1Z999AA10123456784"
            value={form.trackingNumber}
            onChange={(e) => update("trackingNumber", e.target.value)}
            error={errors.trackingNumber}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Destinatario"
            placeholder="Nombre del destinatario"
            value={form.recipientName}
            onChange={(e) => update("recipientName", e.target.value)}
          />
          <Input
            label="Remitente"
            placeholder="Nombre del remitente"
            value={form.senderName}
            onChange={(e) => update("senderName", e.target.value)}
          />
        </div>

        <Input
          label="Carrier"
          placeholder="UPS, FedEx, DHL..."
          value={form.carrier}
          onChange={(e) => update("carrier", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor FOB"
            type="number"
            placeholder="0.00"
            value={form.fob}
            onChange={(e) => update("fob", e.target.value)}
            error={errors.fob}
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
        />

        <Textarea
          label="Contenido"
          placeholder="Descripcion del contenido..."
          value={form.content}
          onChange={(e) => update("content", e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Post-Alerta
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
