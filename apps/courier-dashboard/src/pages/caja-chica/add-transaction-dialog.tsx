import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreateCajaTransaction } from "@/hooks/use-api";

interface AddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  branchId: string;
}

const TYPE_OPTIONS = [
  { value: "CASH_OUT", label: "Retiro de Efectivo" },
  { value: "BANK_DEPOSIT", label: "Deposito Bancario" },
  { value: "ADJUSTMENT", label: "Ajuste" },
];

export function AddTransactionDialog({
  open,
  onClose,
  branchId,
}: AddTransactionDialogProps) {
  const toast = useToast();
  const createMutation = useCreateCajaTransaction();

  const [form, setForm] = useState({
    type: "CASH_OUT",
    amount: "",
    description: "",
    reference: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetAndClose = () => {
    setForm({ type: "CASH_OUT", amount: "", description: "", reference: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) errs.amount = "Monto invalido";
    if (!form.description.trim()) errs.description = "Descripcion requerida";
    if (!form.type) errs.type = "Selecciona un tipo";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        branchId,
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description.trim(),
        reference: form.reference.trim() || undefined,
      });
      toast.success("Movimiento registrado exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al registrar el movimiento");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={resetAndClose} title="Agregar Movimiento" description="Registra un movimiento en la caja chica">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Tipo de Movimiento"
          options={TYPE_OPTIONS}
          value={form.type}
          onChange={(e) => update("type", e.target.value)}
          error={errors.type}
        />

        <Input
          label="Monto"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
          error={errors.amount}
        />

        <Input
          label="Descripcion"
          placeholder="Describe el movimiento..."
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          error={errors.description}
        />

        <Input
          label="Referencia (opcional)"
          placeholder="Numero de recibo o referencia"
          value={form.reference}
          onChange={(e) => update("reference", e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Registrar Movimiento
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
