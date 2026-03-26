import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, User, Phone, Mail, CreditCard } from "lucide-react";
import { cn, formatDateTime } from "@syspaq/ui";
import { useDriver } from "@/hooks/use-api";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: driver, isLoading, isError } = useDriver(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !driver) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">No se pudo cargar el conductor.</p>
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
              driver.status === "ACTIVE"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-[var(--muted)] text-[var(--muted-foreground)]",
            )}
          >
            <User className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={driver.status} />
            </div>
            <h1 className="text-2xl font-bold font-display">
              {driver.firstName} {driver.lastName}
            </h1>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mb-6">
        <DetailCard title="Informacion del Conductor" icon={<User className="h-4 w-4" />}>
          <InfoGrid
            columns={3}
            items={[
              {
                label: "Telefono",
                value: (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    {driver.phone}
                  </span>
                ),
              },
              {
                label: "Email",
                value: driver.email ? (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    {driver.email}
                  </span>
                ) : (
                  "—"
                ),
              },
              {
                label: "No. Licencia",
                value: driver.licenseNumber ? (
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                    {driver.licenseType && `${driver.licenseType} — `}
                    {driver.licenseNumber}
                  </span>
                ) : (
                  "—"
                ),
              },
              {
                label: "Vehiculo Asignado",
                value: driver.vehicle ? (
                  <button
                    onClick={() => navigate(`/fleet/vehicles/${driver.vehicleId}`)}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {driver.vehicle.plate} — {driver.vehicle.brand} {driver.vehicle.model}
                  </button>
                ) : (
                  "Sin vehiculo asignado"
                ),
              },
              {
                label: "Creado",
                value: formatDateTime(driver.createdAt),
              },
              {
                label: "Actualizado",
                value: formatDateTime(driver.updatedAt),
              },
            ]}
          />
        </DetailCard>
      </div>
    </motion.div>
  );
}
