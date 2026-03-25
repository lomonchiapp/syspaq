import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Ship,
  Plane,
  Package,
  FileBarChart,
  Tag,
  ArrowRight,
} from "lucide-react";
import { cn, formatDate, formatDateTime } from "@syspaq/ui";
import {
  useContainerDetail,
  useContainerPackages,
  useContainerDgaLabels,
  useUpdateContainerStatus,
} from "@/hooks/use-api";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/toast";

/* ------------------------------------------------------------------ */
/*  Status flow helpers                                                */
/* ------------------------------------------------------------------ */

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  OPEN: { next: "CLOSED", label: "Cerrar Contenedor" },
  CLOSED: { next: "IN_TRANSIT", label: "Marcar En Transito" },
  IN_TRANSIT: { next: "IN_CUSTOMS", label: "Marcar En Aduanas" },
  IN_CUSTOMS: { next: "CLEARED", label: "Marcar Liberado" },
  CLEARED: { next: "DELIVERED", label: "Marcar Entregado" },
};

export default function ContainerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: container, isLoading, isError } = useContainerDetail(id!);
  const { data: packages } = useContainerPackages(id!);
  const { data: dgaLabels } = useContainerDgaLabels(id!);
  const statusMutation = useUpdateContainerStatus();

  const handleStatusTransition = async (nextStatus: string) => {
    try {
      await statusMutation.mutateAsync({ id: id!, status: nextStatus });
      toast.success(`Contenedor actualizado a ${nextStatus.replace(/_/g, " ")}`);
    } catch {
      toast.error("Error al actualizar el estado");
    }
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

  if (isError || !container) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">No se pudo cargar el contenedor.</p>
        <Button variant="outline" onClick={() => navigate("/containers")}>
          Volver a contenedores
        </Button>
      </div>
    );
  }

  const packageList = packages ?? [];
  const labelList = dgaLabels ?? [];
  const nextStep = STATUS_FLOW[container.status];
  const isSea = container.mode === "SEA";

  /* DGA label counts by status */
  const labelCounts: Record<string, number> = {};
  labelList.forEach((l) => {
    labelCounts[l.status] = (labelCounts[l.status] || 0) + 1;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Back */}
      <button
        onClick={() => navigate("/containers")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a contenedores
      </button>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
            {isSea ? <Ship className="h-7 w-7" /> : <Plane className="h-7 w-7" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  isSea ? "bg-blue-500/15 text-blue-400" : "bg-violet-500/15 text-violet-400",
                )}
              >
                {isSea ? "Maritimo" : "Aereo"}
              </span>
              <StatusBadge status={container.status} />
            </div>
            <h1 className="text-2xl font-bold font-mono">{container.number}</h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Tipo: {container.type} &bull; {container.totalPieces} pieza{container.totalPieces !== 1 && "s"}
              {container.totalWeightLbs != null && ` &bull; ${Number(container.totalWeightLbs).toFixed(2)} lbs`}
            </p>
          </div>

          {/* Transition button */}
          {nextStep && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => handleStatusTransition(nextStep.next)}
              isLoading={statusMutation.isPending}
            >
              {nextStep.label}
            </Button>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="mb-6">
        <DetailCard title="Informacion del Contenedor" icon={<FileBarChart className="h-4 w-4" />}>
          <InfoGrid
            columns={3}
            items={[
              { label: "Carrier", value: container.carrier || "—" },
              { label: "Buque / Vuelo", value: container.vessel || "—" },
              { label: "Viaje", value: container.voyage || "—" },
              { label: "Numero BL", value: container.blNumber || "—" },
              {
                label: "Llegada Estimada",
                value: container.estimatedArrival ? formatDate(container.estimatedArrival) : "—",
              },
              {
                label: "Llegada Real",
                value: container.actualArrival ? formatDate(container.actualArrival) : "—",
              },
              {
                label: "Cerrado",
                value: container.closedAt ? formatDateTime(container.closedAt) : "—",
              },
              { label: "Creado", value: formatDateTime(container.createdAt) },
            ]}
          />
        </DetailCard>
      </div>

      {/* Packages table */}
      <div className="mb-6">
        <DetailCard
          title="Paquetes en Contenedor"
          icon={<Package className="h-4 w-4" />}
          actions={
            <span className="text-xs text-[var(--muted-foreground)]">
              {packageList.length} paquete{packageList.length !== 1 && "s"}
            </span>
          }
        >
          {packageList.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
              No hay paquetes en este contenedor
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Tracking #
                    </th>
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Cliente
                    </th>
                    <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Peso (lbs)
                    </th>
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Descripcion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {packageList.map((pkg) => (
                    <tr
                      key={pkg.id}
                      className="border-b border-[var(--border)]/50 cursor-pointer hover:bg-[var(--muted)]/50 transition-colors"
                      onClick={() => navigate(`/shipments/${pkg.shipmentId}`)}
                    >
                      <td className="py-2 font-mono font-semibold text-[var(--primary)]">
                        {pkg.trackingNumber}
                      </td>
                      <td className="py-2">{pkg.customerName || "—"}</td>
                      <td className="py-2 text-right">{Number(pkg.weightLbs)?.toFixed(2) ?? "—"}</td>
                      <td className="py-2 text-[var(--muted-foreground)]">
                        {pkg.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DetailCard>
      </div>

      {/* DGA Section */}
      <DetailCard title="Etiquetas DGA" icon={<Tag className="h-4 w-4" />}>
        {labelList.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              No hay etiquetas DGA generadas
            </p>
            <Button variant="primary" size="sm">
              Generar Etiquetas DGA
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {Object.entries(labelCounts).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 px-3 py-2"
                >
                  <StatusBadge status={status} />
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Total: {labelList.length} etiqueta{labelList.length !== 1 && "s"}
            </p>
          </div>
        )}
      </DetailCard>
    </motion.div>
  );
}
