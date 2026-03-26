import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Car, Gauge, Fuel, Building2 } from "lucide-react";
import { cn, formatDateTime } from "@syspaq/ui";
import { useVehicle } from "@/hooks/use-api";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";

const FUEL_LABELS: Record<string, string> = {
  GASOLINE: "Gasolina",
  DIESEL: "Diesel",
  ELECTRIC: "Electrico",
  HYBRID: "Hibrido",
  GAS: "Gas",
};

const TYPE_LABELS: Record<string, string> = {
  MOTORCYCLE: "Motocicleta",
  CAR: "Automovil",
  VAN: "Furgoneta",
  TRUCK: "Camion",
  PICKUP: "Pickup",
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vehicle, isLoading, isError } = useVehicle(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">No se pudo cargar el vehiculo.</p>
        <Button variant="outline" onClick={() => navigate("/fleet")}>
          Volver a Flota
        </Button>
      </div>
    );
  }

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
              vehicle.status === "AVAILABLE"
                ? "bg-emerald-500/15 text-emerald-400"
                : vehicle.status === "IN_USE"
                  ? "bg-blue-500/15 text-blue-400"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]",
            )}
          >
            <Car className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={vehicle.status} />
              <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
                {TYPE_LABELS[vehicle.type] ?? vehicle.type}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-display">
              <span className="font-mono">{vehicle.plate}</span>
              <span className="text-[var(--muted-foreground)] ml-2">
                — {vehicle.brand} {vehicle.model}
                {vehicle.year && ` (${vehicle.year})`}
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mb-6">
        <DetailCard title="Informacion del Vehiculo" icon={<Car className="h-4 w-4" />}>
          <InfoGrid
            columns={3}
            items={[
              {
                label: "Placa",
                value: <span className="font-mono font-bold">{vehicle.plate}</span>,
              },
              {
                label: "Marca / Modelo",
                value: `${vehicle.brand} ${vehicle.model}`,
              },
              {
                label: "Ano",
                value: vehicle.year ? String(vehicle.year) : "—",
              },
              {
                label: "Capacidad Peso",
                value: vehicle.capacityWeightLbs ? (
                  <span className="font-mono">{vehicle.capacityWeightLbs} lbs</span>
                ) : (
                  "—"
                ),
              },
              {
                label: "Capacidad Volumen",
                value: vehicle.capacityVolumeCbft ? (
                  <span className="font-mono">{vehicle.capacityVolumeCbft} cbft</span>
                ) : (
                  "—"
                ),
              },
              {
                label: "Kilometraje",
                value: vehicle.mileage != null ? (
                  <span className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    <span className="font-mono">{vehicle.mileage.toLocaleString()} km</span>
                  </span>
                ) : (
                  "—"
                ),
              },
              {
                label: "Combustible",
                value: vehicle.fuelType ? (
                  <span className="flex items-center gap-1.5">
                    <Fuel className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    {FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType}
                  </span>
                ) : (
                  "—"
                ),
              },
              {
                label: "Sucursal",
                value: vehicle.currentBranch ? (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    {vehicle.currentBranch.name}{" "}
                    <span className="font-mono text-xs">({vehicle.currentBranch.code})</span>
                  </span>
                ) : (
                  "—"
                ),
              },
              {
                label: "Creado",
                value: formatDateTime(vehicle.createdAt),
              },
            ]}
          />
        </DetailCard>
      </div>
    </motion.div>
  );
}
