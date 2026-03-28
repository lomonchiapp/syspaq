import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Package,
  FileBarChart,
  MapPin,
  Link2,
  Send,
  PackageCheck,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn, formatDateTime } from "@syspaq/ui";
import { api } from "@/lib/api-client";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/toast";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TransferItem {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  customerName?: string;
  weightLbs?: number;
  pieces: number;
}

interface TransferDetail {
  id: string;
  number: string;
  type: string;
  status: string;
  originBranchId: string;
  destBranchId: string;
  originBranch?: { id: string; name: string; code: string };
  destBranch?: { id: string; name: string; code: string };
  totalPieces: number;
  totalWeightLbs?: number;
  dispatchedAt?: string;
  receivedAt?: string;
  dispatchedBy?: string;
  receivedBy?: string;
  linkedTransferId?: string;
  notes?: string;
  items?: TransferItem[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Inline hooks                                                       */
/* ------------------------------------------------------------------ */

function useTransferDetail(id: string) {
  return useQuery({
    queryKey: ["transfers", id, "detail"],
    queryFn: () => api.get<TransferDetail>(`/v1/transfers/${id}`),
    enabled: !!id,
  });
}

function useDispatchTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/v1/transfers/${id}/dispatch`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
}

function useReceiveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/v1/transfers/${id}/receive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Status badge helpers                                               */
/* ------------------------------------------------------------------ */

const TRANSFER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400",
  DISPATCHED: "bg-blue-500/15 text-blue-400",
  IN_TRANSIT: "bg-orange-500/15 text-orange-400",
  RECEIVED: "bg-emerald-500/15 text-emerald-400",
  CANCELLED: "bg-red-500/15 text-red-400",
};

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  DISPATCHED: "Despachado",
  IN_TRANSIT: "En Transito",
  RECEIVED: "Recibido",
  CANCELLED: "Cancelado",
};

function TransferStatusBadge({ status }: { status: string }) {
  const colors = TRANSFER_STATUS_COLORS[status] ?? "bg-gray-500/15 text-gray-400";
  const label = TRANSFER_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colors,
      )}
    >
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const isOutbound = type === "OUTBOUND";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isOutbound
          ? "bg-blue-500/15 text-blue-400"
          : "bg-emerald-500/15 text-emerald-400",
      )}
    >
      {isOutbound ? "Salida" : "Entrada"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function TransferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: transfer, isLoading, isError } = useTransferDetail(id!);
  const dispatchMutation = useDispatchTransfer();
  const receiveMutation = useReceiveTransfer();

  const handleDispatch = async () => {
    try {
      await dispatchMutation.mutateAsync(id!);
      toast.success("Transferencia despachada exitosamente");
    } catch {
      toast.error("Error al despachar la transferencia");
    }
  };

  const handleReceive = async () => {
    try {
      await receiveMutation.mutateAsync(id!);
      toast.success("Transferencia recibida exitosamente");
    } catch {
      toast.error("Error al recibir la transferencia");
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

  if (isError || !transfer) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">No se pudo cargar la transferencia.</p>
        <Button variant="outline" onClick={() => navigate("/transfers")}>
          Volver a transferencias
        </Button>
      </div>
    );
  }

  const items = transfer.items ?? [];
  const canDispatch = transfer.type === "OUTBOUND" && transfer.status === "PENDING";
  const canReceive = transfer.type === "INBOUND" && transfer.status === "IN_TRANSIT";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Back */}
      <button
        onClick={() => navigate("/transfers")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a transferencias
      </button>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
            <ArrowLeftRight className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <TypeBadge type={transfer.type} />
              <TransferStatusBadge status={transfer.status} />
            </div>
            <h1 className="text-2xl font-bold font-mono">{transfer.number}</h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {transfer.totalPieces} pieza{transfer.totalPieces !== 1 && "s"}
              {transfer.totalWeightLbs != null && ` \u2022 ${Number(transfer.totalWeightLbs).toFixed(2)} lbs`}
            </p>
          </div>

          {/* Action buttons */}
          {canDispatch && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={handleDispatch}
              isLoading={dispatchMutation.isPending}
            >
              Despachar
            </Button>
          )}
          {canReceive && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<PackageCheck className="h-4 w-4" />}
              onClick={handleReceive}
              isLoading={receiveMutation.isPending}
            >
              Recibir
            </Button>
          )}
        </div>
      </div>

      {/* Route display */}
      <div className="mb-6">
        <DetailCard title="Ruta de Transferencia" icon={<MapPin className="h-4 w-4" />}>
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                Origen
              </p>
              <p className="text-sm font-semibold">
                {transfer.originBranch?.name ?? "—"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {transfer.originBranch?.code ?? "—"}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--muted-foreground)] shrink-0" />
            <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 p-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                Destino
              </p>
              <p className="text-sm font-semibold">
                {transfer.destBranch?.name ?? "—"}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {transfer.destBranch?.code ?? "—"}
              </p>
            </div>
          </div>
        </DetailCard>
      </div>

      {/* Info card */}
      <div className="mb-6">
        <DetailCard title="Informacion de la Transferencia" icon={<FileBarChart className="h-4 w-4" />}>
          <InfoGrid
            columns={3}
            items={[
              { label: "Total Piezas", value: String(transfer.totalPieces) },
              {
                label: "Peso Total (lbs)",
                value: transfer.totalWeightLbs != null ? `${Number(transfer.totalWeightLbs).toFixed(2)}` : "—",
              },
              {
                label: "Despachado",
                value: transfer.dispatchedAt ? formatDateTime(transfer.dispatchedAt) : "—",
              },
              {
                label: "Recibido",
                value: transfer.receivedAt ? formatDateTime(transfer.receivedAt) : "—",
              },
              { label: "Despachado por", value: transfer.dispatchedBy || "—" },
              { label: "Recibido por", value: transfer.receivedBy || "—" },
              { label: "Notas", value: transfer.notes || "—" },
              { label: "Creado", value: formatDateTime(transfer.createdAt) },
            ]}
          />
        </DetailCard>
      </div>

      {/* Linked transfer */}
      {transfer.linkedTransferId && (
        <div className="mb-6">
          <DetailCard title="Transferencia Vinculada" icon={<Link2 className="h-4 w-4" />}>
            <div className="flex items-center gap-3 py-2">
              <p className="text-sm text-[var(--muted-foreground)]">
                Esta transferencia tiene una contraparte vinculada.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/transfers/${transfer.linkedTransferId}`)}
              >
                Ver Contraparte
              </Button>
            </div>
          </DetailCard>
        </div>
      )}

      {/* Items table */}
      <DetailCard
        title="Paquetes en Transferencia"
        icon={<Package className="h-4 w-4" />}
        actions={
          <span className="text-xs text-[var(--muted-foreground)]">
            {items.length} paquete{items.length !== 1 && "s"}
          </span>
        }
      >
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            No hay paquetes en esta transferencia
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
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Piezas
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--border)]/50 cursor-pointer hover:bg-[var(--muted)]/50 transition-colors"
                    onClick={() => navigate(`/shipments/${item.shipmentId}`)}
                  >
                    <td className="py-2 font-mono font-semibold text-[var(--primary)]">
                      {item.trackingNumber}
                    </td>
                    <td className="py-2">{item.customerName || "—"}</td>
                    <td className="py-2 text-right">
                      {item.weightLbs != null ? Number(item.weightLbs).toFixed(2) : "—"}
                    </td>
                    <td className="py-2 text-right">{item.pieces}</td>
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
