import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Layers,
  Star,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn, formatCurrency } from "@syspaq/ui";
import {
  useRateTableDetail,
  useAddTier,
  useUpdateTier,
  useDeleteTier,
} from "@/hooks/use-api";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailCard } from "@/components/shared/detail-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/toast";
import type { RateTier } from "@/types/api";

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "DOP", label: "DOP" },
];

const emptyTier = {
  minWeight: "",
  maxWeight: "",
  pricePerLb: "",
  flatFee: "",
  currency: "USD",
};

export default function RateTableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: table, isLoading, isError } = useRateTableDetail(id!);
  const addTierMutation = useAddTier();
  const updateTierMutation = useUpdateTier();
  const deleteTierMutation = useDeleteTier();

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editTierId, setEditTierId] = useState("");
  const [deleteTierId, setDeleteTierId] = useState("");
  const [form, setForm] = useState(emptyTier);

  const resetForm = () => setForm(emptyTier);

  const handleAddTier = async () => {
    try {
      await addTierMutation.mutateAsync({
        tableId: id!,
        minWeight: Number(form.minWeight),
        maxWeight: Number(form.maxWeight),
        pricePerLb: Number(form.pricePerLb),
        flatFee: Number(form.flatFee),
        currency: form.currency,
      });
      toast.success("Tier agregado exitosamente");
      setShowAdd(false);
      resetForm();
    } catch {
      toast.error("Error al agregar el tier");
    }
  };

  const handleUpdateTier = async () => {
    try {
      await updateTierMutation.mutateAsync({
        tableId: id!,
        tierId: editTierId,
        minWeight: Number(form.minWeight),
        maxWeight: Number(form.maxWeight),
        pricePerLb: Number(form.pricePerLb),
        flatFee: Number(form.flatFee),
        currency: form.currency,
      });
      toast.success("Tier actualizado");
      setShowEdit(false);
      resetForm();
    } catch {
      toast.error("Error al actualizar el tier");
    }
  };

  const handleDeleteTier = async () => {
    try {
      await deleteTierMutation.mutateAsync({
        tableId: id!,
        tierId: deleteTierId,
      });
      toast.success("Tier eliminado");
      setShowDelete(false);
      setDeleteTierId("");
    } catch {
      toast.error("Error al eliminar el tier");
    }
  };

  const openEdit = (tier: RateTier) => {
    setEditTierId(tier.id);
    setForm({
      minWeight: String(tier.minWeight),
      maxWeight: String(tier.maxWeight),
      pricePerLb: String(tier.pricePerLb),
      flatFee: String(tier.flatFee),
      currency: tier.currency,
    });
    setShowEdit(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !table) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">
          No se pudo cargar la tabla de tarifas.
        </p>
        <Button variant="outline" onClick={() => navigate("/rate-tables")}>
          Volver a tablas
        </Button>
      </div>
    );
  }

  const tiers = table.tiers ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Back */}
      <button
        onClick={() => navigate("/rate-tables")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
            <Layers className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={table.isActive ? "ACTIVE" : "INACTIVE"} />
              {table.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-400 px-2 py-0.5 text-xs font-semibold">
                  <Star className="h-3 w-3" />
                  DEFAULT
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold font-display">{table.name}</h1>
            {(table.originZone || table.destZone) && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                {table.originZone || "—"} → {table.destZone || "—"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tiers Table */}
      <DetailCard
        title={`Tiers de Precios (${tiers.length})`}
        icon={<Layers className="h-4 w-4" />}
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
          >
            Agregar Tier
          </Button>
        }
      >
        {tiers.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-[var(--muted-foreground)]">
            <Layers className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No hay tiers configurados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Min Peso (lbs)
                  </th>
                  <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Max Peso (lbs)
                  </th>
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Precio/lb
                  </th>
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Tarifa Fija
                  </th>
                  <th className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Moneda
                  </th>
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr
                    key={tier.id}
                    className="border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/30 transition-colors"
                  >
                    <td className="py-2.5">{tier.minWeight}</td>
                    <td className="py-2.5">{tier.maxWeight}</td>
                    <td className="py-2.5 text-right font-semibold">
                      {formatCurrency(tier.pricePerLb, tier.currency)}
                    </td>
                    <td className="py-2.5 text-right">
                      {formatCurrency(tier.flatFee, tier.currency)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-semibold">
                        {tier.currency}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(tier)}
                          className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--muted)] transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTierId(tier.id);
                            setShowDelete(true);
                          }}
                          className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DetailCard>

      {/* Add Tier Dialog */}
      <Dialog
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          resetForm();
        }}
        title="Agregar Tier"
        description="Define un rango de peso y su precio correspondiente."
      >
        <TierForm
          form={form}
          setForm={setForm}
          onSubmit={handleAddTier}
          onCancel={() => {
            setShowAdd(false);
            resetForm();
          }}
          isLoading={addTierMutation.isPending}
          submitLabel="Agregar"
        />
      </Dialog>

      {/* Edit Tier Dialog */}
      <Dialog
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
          resetForm();
        }}
        title="Editar Tier"
        description="Modifica los valores del tier seleccionado."
      >
        <TierForm
          form={form}
          setForm={setForm}
          onSubmit={handleUpdateTier}
          onCancel={() => {
            setShowEdit(false);
            resetForm();
          }}
          isLoading={updateTierMutation.isPending}
          submitLabel="Guardar Cambios"
        />
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Eliminar Tier"
        size="sm"
      >
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Esta seguro de que desea eliminar este tier? Esta accion no se puede
          deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDelete(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteTier}
            isLoading={deleteTierMutation.isPending}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tier Form Sub-component                                            */
/* ------------------------------------------------------------------ */

function TierForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: {
  form: typeof import("./[id]") extends never ? never : { minWeight: string; maxWeight: string; pricePerLb: string; flatFee: string; currency: string };
  setForm: (f: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Min Peso (lbs)"
          type="number"
          placeholder="0"
          value={form.minWeight}
          onChange={(e) => setForm({ ...form, minWeight: e.target.value })}
        />
        <Input
          label="Max Peso (lbs)"
          type="number"
          placeholder="10"
          value={form.maxWeight}
          onChange={(e) => setForm({ ...form, maxWeight: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Precio por lb"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.pricePerLb}
          onChange={(e) => setForm({ ...form, pricePerLb: e.target.value })}
        />
        <Input
          label="Tarifa Fija"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.flatFee}
          onChange={(e) => setForm({ ...form, flatFee: e.target.value })}
        />
      </div>
      <Select
        label="Moneda"
        options={[
          { value: "USD", label: "USD" },
          { value: "DOP", label: "DOP" },
        ]}
        value={form.currency}
        onChange={(e) => setForm({ ...form, currency: e.target.value })}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
