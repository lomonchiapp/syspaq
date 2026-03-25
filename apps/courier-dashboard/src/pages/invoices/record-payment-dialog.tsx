import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreatePayment } from "@/hooks/use-api";
import { formatCurrency } from "@syspaq/ui";

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceBalance: number;
  invoiceCurrency: string;
}

const METHOD_OPTIONS = [
  { value: "CASH", label: "Efectivo" },
  { value: "CARD", label: "Tarjeta" },
  { value: "BANK_TRANSFER", label: "Transferencia Bancaria" },
  { value: "CHECK", label: "Cheque" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "OTHER", label: "Otro" },
];

export function RecordPaymentDialog({
  open,
  onClose,
  invoiceId,
  invoiceBalance,
  invoiceCurrency,
}: RecordPaymentDialogProps) {
  const toast = useToast();
  const paymentMutation = useCreatePayment();

  const [form, setForm] = useState({
    method: "BANK_TRANSFER",
    amount: "",
    reference: "",
    bankName: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    resetAndClose();
  };

  const resetAndClose = () => {
    setForm({ method: "BANK_TRANSFER", amount: "", reference: "", bankName: "", notes: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) errs.amount = "Monto invalido";
    else if (amount > invoiceBalance) errs.amount = "El monto excede el balance pendiente";
    if (!form.method) errs.method = "Selecciona un metodo de pago";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await paymentMutation.mutateAsync({
        method: form.method,
        amount: parseFloat(form.amount),
        currency: invoiceCurrency,
        reference: form.reference.trim() || undefined,
        bankName: form.bankName.trim() || undefined,
        notes: form.notes.trim() || undefined,
        invoiceIds: [{ invoiceId, amount: parseFloat(form.amount) }],
      });
      toast.success("Pago registrado exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al registrar el pago");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Registrar Pago" description="Aplica un pago a esta factura" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Balance info */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 p-4 text-center">
          <p className="text-xs text-[var(--muted-foreground)] mb-1">Balance Pendiente</p>
          <p className="text-2xl font-bold font-mono text-red-400">
            {formatCurrency(invoiceBalance, invoiceCurrency)}
          </p>
        </div>

        <Select
          label="Metodo de Pago"
          options={METHOD_OPTIONS}
          value={form.method}
          onChange={(e) => update("method", e.target.value)}
          error={errors.method}
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
          label="Referencia"
          placeholder="Numero de confirmacion o recibo"
          value={form.reference}
          onChange={(e) => update("reference", e.target.value)}
        />

        <Input
          label="Banco"
          placeholder="Nombre del banco (opcional)"
          value={form.bankName}
          onChange={(e) => update("bankName", e.target.value)}
        />

        <Textarea
          label="Notas"
          placeholder="Notas adicionales sobre el pago..."
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={paymentMutation.isPending}>
            Registrar Pago
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
