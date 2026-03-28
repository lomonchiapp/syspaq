import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Ship,
  Plane,
  FileBarChart,
  Boxes,
  ArrowRight,
} from "lucide-react";
import { cn, formatDate, formatDateTime } from "@syspaq/ui";
import { api } from "@/lib/api-client";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/toast";

/* ------------------------------------------------------------------ */
/*  Inline hooks                                                       */
/* ------------------------------------------------------------------ */

function useVoyageDetail(id: string) {
  return useQuery({
    queryKey: ["voyages", id],
    queryFn: () => api.get<any>(`/v1/voyages/${id}`),
    enabled: !!id,
  });
}

function useVoyageContainers(id: string) {
  return useQuery({
    queryKey: ["voyages", id, "containers"],
    queryFn: () => api.get<any[]>(`/v1/voyages/${id}/containers`),
    enabled: !!id,
  });
}

function useUpdateVoyageStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/v1/voyages/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["voyages"] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Status flow helpers                                                */
/* ------------------------------------------------------------------ */

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  IN_PROCESS: { next: "COMPLETED", label: "Completar Embarcacion" },
  COMPLETED: { next: "IN_TRANSIT", label: "Marcar En Transito" },
  IN_TRANSIT: { next: "ARRIVED", label: "Marcar Llegada" },
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function VoyageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: voyage, isLoading, isError } = useVoyageDetail(id!);
  const { data: containers } = useVoyageContainers(id!);
  const statusMutation = useUpdateVoyageStatus();

  const handleStatusTransition = async (nextStatus: string) => {
    try {
      await statusMutation.mutateAsync({ id: id!, status: nextStatus });
      toast.success(`Embarcacion actualizada a ${nextStatus.replace(/_/g, " ")}`);
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

  if (isError || !voyage) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">No se pudo cargar la embarcacion.</p>
        <Button variant="outline" onClick={() => navigate("/voyages")}>
          Volver a embarcaciones
        </Button>
      </div>
    );
  }

  const containerList = containers ?? [];
  const nextStep = STATUS_FLOW[voyage.status];
  const isSea = voyage.mode === "SEA";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Back */}
      <button
        onClick={() => navigate("/voyages")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a embarcaciones
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
              <StatusBadge status={voyage.status} />
            </div>
            <h1 className="text-2xl font-bold font-mono">{voyage.number}</h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Carrier: {voyage.carrier || "\u2014"} &bull; {containerList.length} contenedor{containerList.length !== 1 && "es"}
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
        <DetailCard title="Informacion de la Embarcacion" icon={<FileBarChart className="h-4 w-4" />}>
          <InfoGrid
            columns={3}
            items={[
              { label: "Carrier", value: voyage.carrier || "\u2014" },
              { label: "Buque / Vuelo", value: voyage.vesselName || "\u2014" },
              { label: "Master AWB", value: voyage.masterAwb || "\u2014" },
              { label: "Origen", value: voyage.origin || "\u2014" },
              { label: "Destino", value: voyage.destination || "\u2014" },
              {
                label: "Fecha de Salida",
                value: voyage.departureDate ? formatDate(voyage.departureDate) : "\u2014",
              },
              {
                label: "Fecha de Llegada",
                value: voyage.arrivalDate ? formatDate(voyage.arrivalDate) : "\u2014",
              },
              { label: "Shipper", value: voyage.shipper || "\u2014" },
              { label: "Consignatario", value: voyage.consignee || "\u2014" },
              { label: "Agente", value: voyage.agent || "\u2014" },
              { label: "Creado", value: formatDateTime(voyage.createdAt) },
            ]}
          />
        </DetailCard>
      </div>

      {/* Containers table */}
      <DetailCard
        title="Contenedores en Embarcacion"
        icon={<Boxes className="h-4 w-4" />}
        actions={
          <span className="text-xs text-[var(--muted-foreground)]">
            {containerList.length} contenedor{containerList.length !== 1 && "es"}
          </span>
        }
      >
        {containerList.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            No hay contenedores en esta embarcacion
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Numero
                  </th>
                  <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Tipo
                  </th>
                  <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Estado
                  </th>
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Piezas
                  </th>
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Peso (lbs)
                  </th>
                </tr>
              </thead>
              <tbody>
                {containerList.map((container: any) => (
                  <tr
                    key={container.id}
                    className="border-b border-[var(--border)]/50 cursor-pointer hover:bg-[var(--muted)]/50 transition-colors"
                    onClick={() => navigate(`/containers/${container.id}`)}
                  >
                    <td className="py-2 font-mono font-semibold text-[var(--primary)]">
                      {container.number}
                    </td>
                    <td className="py-2">{container.type || "\u2014"}</td>
                    <td className="py-2">
                      <StatusBadge status={container.status} />
                    </td>
                    <td className="py-2 text-right">
                      {container.totalPieces?.toLocaleString() ?? "\u2014"}
                    </td>
                    <td className="py-2 text-right">
                      {container.totalWeightLbs != null
                        ? `${Number(container.totalWeightLbs).toFixed(2)}`
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DetailCard>
    </motion.div>
  );
}
