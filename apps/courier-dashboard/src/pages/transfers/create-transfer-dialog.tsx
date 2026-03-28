import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import type { Branch } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface CreateTransferDialogProps {
  open: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Inline hooks                                                       */
/* ------------------------------------------------------------------ */

function useBranchesList() {
  return useQuery({
    queryKey: ["branches-all"],
    queryFn: () => api.get<{ data: Branch[] }>("/v1/branches"),
  });
}

function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/v1/transfers", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfers"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CreateTransferDialog({ open, onClose }: CreateTransferDialogProps) {
  const toast = useToast();
  const createMutation = useCreateTransfer();
  const { data: branchesData } = useBranchesList();

  const [form, setForm] = useState({
    number: "",
    originBranchId: "",
    destBranchId: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const branches = branchesData?.data ?? [];
  const branchOptions = branches.map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  const isDirty = Object.values(form).some((v) => v !== "");

  const handleClose = () => {
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Deseas cerrar?")) return;
    resetAndClose();
  };

  const resetAndClose = () => {
    setForm({ number: "", originBranchId: "", destBranchId: "", notes: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.number.trim()) errs.number = "El numero de transferencia es requerido";
    if (!form.originBranchId) errs.originBranchId = "La sucursal de origen es requerida";
    if (!form.destBranchId) errs.destBranchId = "La sucursal de destino es requerida";
    if (form.originBranchId && form.destBranchId && form.originBranchId === form.destBranchId) {
      errs.destBranchId = "El destino debe ser diferente al origen";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        number: form.number.trim(),
        originBranchId: form.originBranchId,
        destBranchId: form.destBranchId,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Transferencia creada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear la transferencia");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nueva Transferencia"
      description="Registra una transferencia de paquetes entre sucursales"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Numero"
          placeholder="TRF-2026-001"
          value={form.number}
          onChange={(e) => update("number", e.target.value)}
          error={errors.number}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Sucursal Origen"
            placeholder="Seleccionar..."
            options={branchOptions}
            value={form.originBranchId}
            onChange={(e) => update("originBranchId", e.target.value)}
            error={errors.originBranchId}
          />
          <Select
            label="Sucursal Destino"
            placeholder="Seleccionar..."
            options={branchOptions}
            value={form.destBranchId}
            onChange={(e) => update("destBranchId", e.target.value)}
            error={errors.destBranchId}
          />
        </div>

        <Textarea
          label="Notas"
          placeholder="Notas adicionales..."
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Transferencia
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
