import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Package,
  Code2,
  Plus,
  ExternalLink,
  Truck,
} from "lucide-react";
import { cn, formatDateTime, formatDate } from "@syspaq/ui";
import { useShipmentDetail, useShipmentEvents } from "@/hooks/use-api";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { Timeline, type TimelineEvent } from "@/components/shared/timeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { AddEventDialog } from "./add-event-dialog";

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddEvent, setShowAddEvent] = useState(false);

  const { data: shipment, isLoading, isError } = useShipmentDetail(id!);
  const { data: events } = useShipmentEvents(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-96 col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !shipment) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">No se pudo cargar el envio.</p>
        <Button variant="outline" onClick={() => navigate("/shipments")}>
          Volver a envios
        </Button>
      </div>
    );
  }

  const timelineEvents: TimelineEvent[] = (events ?? []).map((ev) => ({
    id: ev.id,
    type: ev.type,
    description: [ev.rawStatus, ev.location ? `Ubicacion: ${JSON.stringify(ev.location)}` : ""]
      .filter(Boolean)
      .join(" — ") || ev.type.replace(/_/g, " "),
    date: formatDateTime(ev.occurredAt),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Back */}
      <button
        onClick={() => navigate("/shipments")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a envios
      </button>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
            <Package className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={shipment.currentPhase} />
              {shipment.reference && (
                <span className="text-xs text-[var(--muted-foreground)]">
                  Ref: {shipment.reference}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold font-mono">{shipment.trackingNumber}</h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Creado {formatDate(shipment.createdAt)} &bull; Actualizado {formatDate(shipment.updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowAddEvent(true)}
            >
              Agregar Evento
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline */}
        <div className="lg:col-span-2">
          <DetailCard
            title="Historial de Eventos"
            icon={<Clock className="h-4 w-4" />}
            actions={
              <span className="text-xs text-[var(--muted-foreground)]">
                {timelineEvents.length} evento{timelineEvents.length !== 1 && "s"}
              </span>
            }
          >
            <Timeline events={timelineEvents} />
          </DetailCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Info card */}
          <DetailCard title="Informacion del Envio" icon={<Package className="h-4 w-4" />}>
            <InfoGrid
              items={[
                { label: "Tracking #", value: <span className="font-mono">{shipment.trackingNumber}</span> },
                { label: "Referencia", value: shipment.reference || "—" },
                { label: "Fase", value: <StatusBadge status={shipment.currentPhase} /> },
                { label: "Cliente ID", value: shipment.customerId ? shipment.customerId.slice(0, 8) + "..." : "—" },
                { label: "Creado", value: formatDateTime(shipment.createdAt) },
                { label: "Actualizado", value: formatDateTime(shipment.updatedAt) },
              ]}
              columns={2}
            />
          </DetailCard>

          {/* Metadata card */}
          <DetailCard title="Metadata" icon={<Code2 className="h-4 w-4" />}>
            {Object.keys(shipment.metadata || {}).length > 0 ? (
              <pre className="text-xs font-mono bg-[var(--secondary)] rounded-lg p-3 overflow-x-auto max-h-64 text-[var(--foreground)]">
                {JSON.stringify(shipment.metadata, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">Sin metadata</p>
            )}
          </DetailCard>

          {/* Actions card */}
          <DetailCard title="Acciones">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowAddEvent(true)}
              >
                Agregar Evento
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<Truck className="h-4 w-4" />}
              >
                Ver Recepcion
              </Button>
              {shipment.customerId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  leftIcon={<ExternalLink className="h-4 w-4" />}
                  onClick={() => navigate(`/customers/${shipment.customerId}`)}
                >
                  Ver Cliente
                </Button>
              )}
            </div>
          </DetailCard>
        </div>
      </div>

      {/* Add event dialog */}
      <AddEventDialog
        open={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        shipmentId={id!}
      />
    </motion.div>
  );
}
