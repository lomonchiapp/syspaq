import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCloseCajaSession } from "@/hooks/use-api";
import { formatCurrency } from "@syspaq/ui";

interface CloseSessionDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  currentBalance: number;
  currency: string;
}

export function CloseSessionDialog({
  open,
  onClose,
  sessionId,
  currentBalance,
  currency,
}: CloseSessionDialogProps) {
  const toast = useToast();
  const closeMutation = useCloseCajaSession();
  const [notes, setNotes] = useState("");

  const resetAndClose = () => {
    setNotes("");
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await closeMutation.mutateAsync({
        id: sessionId,
        notes: notes.trim() || undefined,
      });
      toast.success("Sesion de caja cerrada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al cerrar la sesion de caja");
    }
  };

  return (
    <Dialog open={open} onClose={resetAndClose} title="Cerrar Sesion de Caja" description="Esta accion cerrara la sesion actual de caja chica">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current balance info */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 p-4 text-center">
          <p className="text-xs text-[var(--muted-foreground)] mb-1">Balance Actual</p>
          <p className="text-2xl font-bold font-mono text-[var(--primary)]">
            {formatCurrency(currentBalance, currency)}
          </p>
        </div>

        {/* Warning */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-400">
            Una vez cerrada la sesion, no se podran registrar mas movimientos. Asegurese de que todos los movimientos esten registrados antes de cerrar.
          </p>
        </div>

        <Textarea
          label="Notas (opcional)"
          placeholder="Notas sobre el cierre de caja..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button variant="destructive" type="submit" isLoading={closeMutation.isPending}>
            Cerrar Sesion
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
