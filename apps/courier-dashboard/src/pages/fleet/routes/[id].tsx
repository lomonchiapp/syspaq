import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Route,
  Play,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { cn, formatDate, formatDateTime } from "@syspaq/ui";
import { useRoute, useStartRoute, useCompleteRoute } from "@/hooks/use-api";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/toast";
import type { RouteStop } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Route status stepper                                               */
/* ------------------------------------------------------------------ */

const ROUTE_STEPS = [
  { key: "PLANNED", label: "Planificada" },
  { key: "IN_PROGRESS", label: "En Progreso" },
  { key: "COMPLETED", label: "Completada" },
];

function RouteStepper({ status }: { status: string }) {
  const currentIdx = ROUTE_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-2">
      {ROUTE_STEPS.map((step, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  isComplete
                    ? "bg-emerald-500/20 text-emerald-400"
                    : isCurrent
                      ? "bg-[var(--primary)]/20 text-[var(--primary)] ring-2 ring-[var(--primary)]/30"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]",
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCurrent
                    ? "text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)]",
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < ROUTE_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-8",
                  idx < currentIdx
                    ? "bg-emerald-500/40"
                    : "bg-[var(--border)]",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stop columns                                                       */
/* ------------------------------------------------------------------ */

const stopColumns: Column<RouteStop>[] = [
  {
    key: "sequence",
    header: "Sec.",
    render: (s) => (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-bold">
        {s.sequence}
      </span>
    ),
  },
  {
    key: "deliveryOrder",
    header: "Orden Entrega",
    render: (s) =>
      s.deliveryOrder ? (
        <span className="font-mono text-xs font-semibold">{s.deliveryOrder.number}</span>
      ) : (
        <span className="text-[var(--muted-foreground)]">—</span>
      ),
  },
  {
    key: "customer",
    header: "Cliente",
    render: (s) =>
      s.deliveryOrder?.customerId ? (
        <span className="text-sm">{s.deliveryOrder.customerId}</span>
      ) : (
        <span className="text-[var(--muted-foreground)]">—</span>
      ),
  },
  {
    key: "status",
    header: "Estado",
    render: (s) => <StatusBadge status={s.status} />,
  },
  {
    key: "estimatedArrival",
    header: "Llegada Est.",
    render: (s) => (
      <span className="text-[var(--muted-foreground)] text-xs">
        {s.estimatedArrival ? formatDateTime(s.estimatedArrival) : "—"}
      </span>
    ),
  },
  {
    key: "actualArrival",
    header: "Llegada Real",
    render: (s) => (
      <span className="text-xs">
        {s.actualArrival ? formatDateTime(s.actualArrival) : "—"}
      </span>
    ),
  },
  {
    key: "actualDeparture",
    header: "Salida",
    render: (s) => (
      <span className="text-xs">
        {s.actualDeparture ? formatDateTime(s.actualDeparture) : "—"}
      </span>
    ),
  },
  {
    key: "notes",
    header: "Notas",
    render: (s) => (
      <span className="text-[var(--muted-foreground)] max-w-[150px] truncate block text-xs">
        {s.notes || "—"}
      </span>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: route, isLoading, isError } = useRoute(id!);
  const startRoute = useStartRoute();
  const completeRoute = useCompleteRoute();

  const handleStart = async () => {
    try {
      await startRoute.mutateAsync(id!);
      toast.success("Ruta iniciada exitosamente");
    } catch (err: any) {
      toast.error(err?.detail || "Error al iniciar la ruta");
    }
  };

  const handleComplete = async () => {
    try {
      await completeRoute.mutateAsync(id!);
      toast.success("Ruta completada exitosamente");
    } catch (err: any) {
      toast.error(err?.detail || "Error al completar la ruta");
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

  if (isError || !route) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">No se pudo cargar la ruta.</p>
        <Button variant="outline" onClick={() => navigate("/fleet")}>
          Volver a Flota
        </Button>
      </div>
    );
  }

  const isPlanned = route.status === "PLANNED";
  const isInProgress = route.status === "IN_PROGRESS";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Back */}
      <button
        onClick={() => navigate("/fleet")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Flota
      </button>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl",
              isInProgress
                ? "bg-cyan-500/15 text-cyan-400"
                : route.status === "COMPLETED"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-blue-500/15 text-blue-400",
            )}
          >
            <Route className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={route.status} />
            </div>
            <h1 className="text-2xl font-bold font-display">
              Ruta <span className="font-mono">{route.number}</span>
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {route.driver && `${route.driver.firstName} ${route.driver.lastName}`}
              {route.vehicle && ` — ${route.vehicle.plate}`}
              {route.branch && ` — ${route.branch.name}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-mono">
              {route.completedStops}/{route.totalStops}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Paradas</p>
          </div>
        </div>

        {/* Stepper + actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-[var(--border)]/50">
          <RouteStepper status={route.status} />

          <div className="flex gap-2">
            {isPlanned && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play className="h-4 w-4" />}
                onClick={handleStart}
                isLoading={startRoute.isPending}
              >
                Iniciar Ruta
              </Button>
            )}
            {isInProgress && (
              <Button
                variant="accent"
                size="sm"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                onClick={handleComplete}
                isLoading={completeRoute.isPending}
              >
                Completar Ruta
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div className="mb-6">
        <DetailCard title="Informacion de la Ruta" icon={<Route className="h-4 w-4" />}>
          <InfoGrid
            columns={3}
            items={[
              {
                label: "Numero",
                value: <span className="font-mono font-bold">{route.number}</span>,
              },
              {
                label: "Conductor",
                value: route.driver
                  ? `${route.driver.firstName} ${route.driver.lastName}`
                  : "—",
              },
              {
                label: "Vehiculo",
                value: route.vehicle
                  ? `${route.vehicle.plate} — ${route.vehicle.brand} ${route.vehicle.model}`
                  : "—",
              },
              {
                label: "Sucursal",
                value: route.branch
                  ? `${route.branch.name} (${route.branch.code})`
                  : "—",
              },
              {
                label: "Fecha Planificada",
                value: formatDate(route.plannedDate),
              },
              {
                label: "Inicio",
                value: route.startedAt ? formatDateTime(route.startedAt) : "—",
              },
              {
                label: "Finalizacion",
                value: route.completedAt ? formatDateTime(route.completedAt) : "—",
              },
              {
                label: "Total Paradas",
                value: <span className="font-mono">{route.totalStops}</span>,
              },
              {
                label: "Completadas",
                value: <span className="font-mono">{route.completedStops}</span>,
              },
            ]}
          />
          {route.notes && (
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                Notas
              </p>
              <p className="text-sm text-[var(--foreground)]">{route.notes}</p>
            </div>
          )}
        </DetailCard>
      </div>

      {/* Stops table */}
      <div className="mb-6">
        <DetailCard title="Paradas" icon={<MapPin className="h-4 w-4" />}>
          <DataTable
            columns={stopColumns}
            data={route.stops ?? []}
            emptyMessage="No hay paradas registradas"
          />
        </DetailCard>
      </div>
    </motion.div>
  );
}
