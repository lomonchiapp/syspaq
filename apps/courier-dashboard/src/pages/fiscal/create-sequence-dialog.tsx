import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCreateFiscalSequence } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";

const NCF_TYPES = [
  { value: "B01", label: "B01 - Credito Fiscal" },
  { value: "B02", label: "B02 - Consumo" },
  { value: "B04", label: "B04 - Notas de Credito" },
  { value: "B14", label: "B14 - Regimen Especial" },
  { value: "B15", label: "B15 - Gubernamental" },
];

interface CreateSequenceDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSequenceDialog({ open, onClose }: CreateSequenceDialogProps) {
  const toast = useToast();
  const createMutation = useCreateFiscalSequence();

  const [type, setType] = useState("B01");
  const [prefix, setPrefix] = useState("");
  const [authorizationNumber, setAuthorizationNumber] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!prefix || !validFrom || !validUntil) {
      toast.error("Completa todos los campos obligatorios.");
      return;
    }

    createMutation.mutate(
      { type, prefix, authorizationNumber: authorizationNumber || undefined, validFrom, validUntil },
      {
        onSuccess: () => {
          toast.success("La secuencia NCF fue creada exitosamente.");
          resetForm();
          onClose();
        },
        onError: () => {
          toast.error("No se pudo crear la secuencia.");
        },
      },
    );
  };

  const resetForm = () => {
    setType("B01");
    setPrefix("");
    setAuthorizationNumber("");
    setValidFrom("");
    setValidUntil("");
  };

  return (
    <Dialog open={open} onClose={onClose} title="Nueva Secuencia NCF" description="Configura una nueva secuencia de comprobantes fiscales">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Tipo de Comprobante"
          options={NCF_TYPES}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />

        <Input
          label="Prefijo"
          placeholder="Ej: B0100000001"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
        />

        <Input
          label="Numero de Autorizacion"
          placeholder="Opcional"
          value={authorizationNumber}
          onChange={(e) => setAuthorizationNumber(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valido Desde"
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
          />
          <Input
            label="Valido Hasta"
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Secuencia
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
