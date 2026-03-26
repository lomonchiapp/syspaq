import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useReconcileCajaSession } from "@/hooks/use-api";
import { cn, formatCurrency } from "@syspaq/ui";

interface ReconcileDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  closingBalance: number;
  currency: string;
}

export function ReconcileDialog({
  open,
  onClose,
  sessionId,
  closingBalance,
  currency,
}: ReconcileDialogProps) {
  const toast = useToast();
  const reconcileMutation = useReconcileCajaSession();
  const [physicalCount, setPhysicalCount] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetAndClose = () => {
    setPhysicalCount("");
    setNotes("");
    setErrors({});
    onClose();
  };

  const parsedCount = parseFloat(physicalCount);
  const difference = !isNaN(parsedCount) ? parsedCount - closingBalance : null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!physicalCount || isNaN(parsedCount) || parsedCount < 0) {
      errs.physicalCount = "Ingrese un conteo fisico valido";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await reconcileMutation.mutateAsync({
        id: sessionId,
        physicalCount: parsedCount,
        notes: notes.trim() || undefined,
      });
      toast.success("Reconciliacion completada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al reconciliar la sesion");
    }
  };

  return (
    <Dialog open={open} onClose={resetAndClose} title="Reconciliar Caja" description="Compare el balance del sistema con el conteo fisico">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* System balance */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 p-4 text-center">
          <p className="text-xs text-[var(--muted-foreground)] mb-1">Balance del Sistema (Cierre)</p>
          <p className="text-2xl font-bold font-mono text-[var(--foreground)]">
            {formatCurrency(closingBalance, currency)}
          </p>
        </div>

        <Input
          label="Conteo Fisico"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={physicalCount}
          onChange={(e) => {
            setPhysicalCount(e.target.value);
            if (errors.physicalCount) setErrors((prev) => ({ ...prev, physicalCount: "" }));
          }}
          error={errors.physicalCount}
        />

        {/* Difference indicator */}
        {difference !== null && (
          <div
            className={cn(
              "rounded-lg border p-4 text-center",
              difference === 0
                ? "border-emerald-500/30 bg-emerald-500/10"
                : difference < 0
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-amber-500/30 bg-amber-500/10",
            )}
          >
            <p className="text-xs text-[var(--muted-foreground)] mb-1">Diferencia</p>
            <p
              className={cn(
                "text-xl font-bold font-mono",
                difference === 0
                  ? "text-emerald-400"
                  : difference < 0
                    ? "text-red-400"
                    : "text-amber-400",
              )}
            >
              {difference >= 0 ? "+" : ""}
              {formatCurrency(difference, currency)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {difference === 0
                ? "Cuadre perfecto"
                : difference < 0
                  ? "Faltante de efectivo"
                  : "Sobrante de efectivo"}
            </p>
          </div>
        )}

        <Textarea
          label="Notas (opcional)"
          placeholder="Observaciones sobre la reconciliacion..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={reconcileMutation.isPending}>
            Reconciliar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
