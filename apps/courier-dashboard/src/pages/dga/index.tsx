import { useState } from "react";
import {
  FileCheck,
  DollarSign,
  Receipt,
  ShieldCheck,
  Container,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { KpiCard } from "@/components/charts/kpi-card";
import { KpiSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@syspaq/ui";
import {
  useDgaStats,
  useDgaLabels,
  useGenerateDgaLabels,
  useBulkUpdateDgaStatus,
} from "@/hooks/use-api";
import type { DgaLabelItem } from "@/types/api";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "PENDING", label: "Pendiente" },
  { value: "SUBMITTED", label: "Enviada" },
  { value: "APPROVED", label: "Aprobada" },
  { value: "REJECTED", label: "Rechazada" },
  { value: "CLEARED", label: "Liberada" },
];

const columns: Column<DgaLabelItem>[] = [
  {
    key: "trackingNumber",
    header: "Tracking",
    render: (r) => (
      <span className="font-mono font-semibold text-[var(--primary)]">
        {r.trackingNumber}
      </span>
    ),
  },
  { key: "consigneeName", header: "Consignatario" },
  {
    key: "description",
    header: "Descripcion",
    render: (r) => (
      <span className="max-w-[200px] truncate block">{r.description}</span>
    ),
  },
  {
    key: "weightLbs",
    header: "Peso (lbs)",
    render: (r) => r.weightLbs?.toFixed(2) ?? "—",
    className: "text-right",
  },
  {
    key: "fobValue",
    header: "FOB",
    render: (r) => formatCurrency(r.fobValue),
    className: "text-right",
  },
  {
    key: "totalTaxes",
    header: "Impuestos",
    render: (r) =>
      r.totalTaxes != null ? formatCurrency(r.totalTaxes) : "—",
    className: "text-right",
  },
  {
    key: "taxExempt",
    header: "Exenta",
    render: (r) => (
      <span
        className={
          r.taxExempt
            ? "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400"
            : "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-gray-500/15 text-gray-400"
        }
      >
        {r.taxExempt ? "Si" : "No"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Estado",
    render: (r) => <StatusBadge status={r.status} />,
  },
];

export default function DgaPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [containerFilter, setContainerFilter] = useState("");

  // Dialogs
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateContainerId, setGenerateContainerId] = useState("");
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLabelIds, setBulkLabelIds] = useState("");

  const { data: stats, isLoading: statsLoading } = useDgaStats(
    containerFilter || undefined,
  );
  const {
    data: labels,
    isLoading,
    isError,
    refetch,
  } = useDgaLabels(
    page,
    20,
    statusFilter || undefined,
    containerFilter || undefined,
  );

  const generateMutation = useGenerateDgaLabels();
  const bulkUpdateMutation = useBulkUpdateDgaStatus();

  const handleGenerate = async () => {
    if (!generateContainerId.trim()) return;
    try {
      await generateMutation.mutateAsync({
        containerId: generateContainerId.trim(),
      });
      toast.success("Etiquetas generadas exitosamente");
      setShowGenerate(false);
      setGenerateContainerId("");
    } catch {
      toast.error("Error al generar etiquetas");
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || !bulkLabelIds.trim()) return;
    const ids = bulkLabelIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await bulkUpdateMutation.mutateAsync({
        labelIds: ids,
        status: bulkStatus,
      });
      toast.success(`${ids.length} etiquetas actualizadas`);
      setShowBulkUpdate(false);
      setBulkStatus("");
      setBulkLabelIds("");
    } catch {
      toast.error("Error en la actualizacion masiva");
    }
  };

  const s = stats?.data;

  return (
    <div>
      <PageHeader title="DGA — Aduanas" description="Etiquetas y tramites aduanales" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              title="Total Etiquetas"
              value={s?.totalLabels ?? 0}
              icon={FileCheck}
              index={0}
            />
            <KpiCard
              title="FOB Total"
              value={formatCurrency(s?.totalFobValue ?? 0)}
              icon={DollarSign}
              color="#22c55e"
              index={1}
            />
            <KpiCard
              title="Impuestos Total"
              value={formatCurrency(s?.totalTaxes ?? 0)}
              icon={Receipt}
              color="#f59e0b"
              index={2}
            />
            <KpiCard
              title="Exentas"
              value={s?.taxExemptCount ?? 0}
              icon={ShieldCheck}
              color="#06b6d4"
              index={3}
            />
          </>
        )}
      </div>

      {/* Actions Row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Container className="h-4 w-4" />}
          onClick={() => setShowGenerate(true)}
        >
          Generar por Contenedor
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => setShowBulkUpdate(true)}
        >
          Actualizacion Masiva
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-48"
        />
        <Input
          placeholder="ID Contenedor..."
          value={containerFilter}
          onChange={(e) => {
            setContainerFilter(e.target.value);
            setPage(1);
          }}
          className="w-56"
        />
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las etiquetas.
          </p>
          <Button variant="primary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Table */}
      {!isError && (
        <>
          <DataTable
            columns={columns}
            data={labels?.data ?? []}
            isLoading={isLoading}
            emptyMessage="No se encontraron etiquetas DGA"
          />
          <Pagination
            page={page}
            totalPages={labels?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Generate Dialog */}
      <Dialog
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        title="Generar Etiquetas por Contenedor"
        description="Ingresa el ID del contenedor para generar las etiquetas DGA correspondientes."
      >
        <div className="space-y-4">
          <Input
            label="ID del Contenedor"
            placeholder="Ej: cnt_abc123..."
            value={generateContainerId}
            onChange={(e) => setGenerateContainerId(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGenerate(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleGenerate}
              isLoading={generateMutation.isPending}
              disabled={!generateContainerId.trim()}
            >
              Generar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog
        open={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        title="Actualizacion Masiva de Estado"
        description="Actualiza el estado de multiples etiquetas a la vez."
      >
        <div className="space-y-4">
          <Select
            label="Nuevo Estado"
            options={STATUS_OPTIONS.filter((o) => o.value !== "")}
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            placeholder="Selecciona un estado"
          />
          <Input
            label="IDs de Etiquetas"
            placeholder="id1, id2, id3..."
            value={bulkLabelIds}
            onChange={(e) => setBulkLabelIds(e.target.value)}
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            Separa los IDs con comas.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBulkUpdate(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleBulkUpdate}
              isLoading={bulkUpdateMutation.isPending}
              disabled={!bulkStatus || !bulkLabelIds.trim()}
            >
              Actualizar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
