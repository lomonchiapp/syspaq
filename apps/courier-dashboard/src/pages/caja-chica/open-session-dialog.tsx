import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useOpenCajaSession, useBranches } from "@/hooks/use-api";

interface OpenSessionDialogProps {
  open: boolean;
  onClose: () => void;
}

export function OpenSessionDialog({ open, onClose }: OpenSessionDialogProps) {
  const toast = useToast();
  const openMutation = useOpenCajaSession();
  const { data: branchesData } = useBranches(1, 100);

  const [form, setForm] = useState({
    branchId: "",
    openingBalance: "0",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const branchOptions = (branchesData?.data ?? []).map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  const resetAndClose = () => {
    setForm({ branchId: "", openingBalance: "0", notes: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.branchId) errs.branchId = "Selecciona una sucursal";
    const balance = parseFloat(form.openingBalance);
    if (isNaN(balance) || balance < 0) errs.openingBalance = "Balance invalido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await openMutation.mutateAsync({
        branchId: form.branchId,
        openingBalance: parseFloat(form.openingBalance),
        notes: form.notes.trim() || undefined,
      });
      toast.success("Sesion de caja abierta exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al abrir la sesion de caja");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={resetAndClose} title="Abrir Sesion de Caja" description="Inicia una nueva sesion de caja chica para una sucursal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Sucursal"
          options={branchOptions}
          value={form.branchId}
          onChange={(e) => update("branchId", e.target.value)}
          placeholder="Seleccionar sucursal..."
          error={errors.branchId}
        />

        <Input
          label="Balance de Apertura"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.openingBalance}
          onChange={(e) => update("openingBalance", e.target.value)}
          error={errors.openingBalance}
        />

        <Textarea
          label="Notas (opcional)"
          placeholder="Notas adicionales sobre la apertura..."
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={openMutation.isPending}>
            Abrir Sesion
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
