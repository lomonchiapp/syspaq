import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateTicket } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";

const CATEGORY_OPTIONS = [
  { value: "SHIPMENT_ISSUE", label: "Problema con Envio" },
  { value: "BILLING", label: "Facturacion" },
  { value: "DAMAGE", label: "Dano" },
  { value: "LOST_PACKAGE", label: "Paquete Perdido" },
  { value: "GENERAL", label: "General" },
  { value: "OTHER", label: "Otro" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Baja" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateTicketDialog({ open, onClose }: Props) {
  const toast = useToast();
  const createTicket = useCreateTicket();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("MEDIUM");
  const [customerId, setCustomerId] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");

  function reset() {
    setSubject("");
    setDescription("");
    setCategory("GENERAL");
    setPriority("MEDIUM");
    setCustomerId("");
    setShipmentId("");
    setInvoiceId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      await createTicket.mutateAsync({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        ...(customerId.trim() && { customerId: customerId.trim() }),
        ...(shipmentId.trim() && { shipmentId: shipmentId.trim() }),
        ...(invoiceId.trim() && { invoiceId: invoiceId.trim() }),
      });
      toast.success("Ticket creado exitosamente");
      reset();
      onClose();
    } catch {
      toast.error("Error al crear el ticket");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo Ticket" description="Crea un nuevo ticket de soporte" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Asunto"
          placeholder="Describe brevemente el problema"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <Textarea
          label="Descripcion"
          placeholder="Detalla el problema o consulta..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="min-h-[120px]"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Categoria"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Select
            label="Prioridad"
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="ID Cliente"
            placeholder="Opcional"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <Input
            label="ID Envio"
            placeholder="Opcional"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
          />
          <Input
            label="ID Factura"
            placeholder="Opcional"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createTicket.isPending}>
            Crear Ticket
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
