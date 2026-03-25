import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Truck,
  MapPin,
  User,
  Phone,
  Car,
  Camera,
  PenTool,
  AlertTriangle,
  Check,
  Clock,
  Package,
  Play,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { cn, formatDate, formatDateTime } from "@syspaq/ui";
import {
  useDeliveryOrderDetail,
  useAssignDriver,
  useStartDelivery,
  useCompleteDelivery,
  useFailDelivery,
} from "@/hooks/use-api";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/toast";

/* ------------------------------------------------------------------ */
/*  Step definitions for the horizontal stepper                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  { key: "PENDING", label: "Pendiente", icon: Clock },
  { key: "ASSIGNED", label: "Asignado", icon: User },
  { key: "IN_TRANSIT", label: "En Transito", icon: Truck },
  { key: "DELIVERED", label: "Entregado", icon: Check },
];

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  PICKUP: "Retiro en Sucursal",
  HOME_DELIVERY: "Entrega a Domicilio",
  LOCKER: "Locker",
};

const DELIVERY_TYPE_COLORS: Record<string, string> = {
  PICKUP: "bg-violet-500/15 text-violet-400",
  HOME_DELIVERY: "bg-blue-500/15 text-blue-400",
  LOCKER: "bg-amber-500/15 text-amber-400",
};

function getStepIndex(status: string): number {
  if (status === "DELIVERED") return 3;
  if (status === "FAILED") return 2; // Show as failed at transit step
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function DeliveryOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: order, isLoading, isError } = useDeliveryOrderDetail(id!);
  const assignMutation = useAssignDriver();
  const startMutation = useStartDelivery();
  const completeMutation = useCompleteDelivery();
  const failMutation = useFailDelivery();

  // Dialogs
  const [showAssign, setShowAssign] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverVehicle, setDriverVehicle] = useState("");

  const [showComplete, setShowComplete] = useState(false);
  const [sigContact, setSigContact] = useState("");
  const [sigIdType, setSigIdType] = useState("");
  const [sigId, setSigId] = useState("");

  const [showFail, setShowFail] = useState(false);
  const [failReason, setFailReason] = useState("");

  /* ---- Handlers ----- */
  const handleAssign = async () => {
    if (!driverName.trim()) return;
    try {
      await assignMutation.mutateAsync({
        id: id!,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim() || undefined,
        driverVehicle: driverVehicle.trim() || undefined,
      });
      toast.success("Conductor asignado");
      setShowAssign(false);
      setDriverName("");
      setDriverPhone("");
      setDriverVehicle("");
    } catch {
      toast.error("Error al asignar conductor");
    }
  };

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync(id!);
      toast.success("Entrega iniciada");
    } catch {
      toast.error("Error al iniciar la entrega");
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync({
        id: id!,
        signatureContact: sigContact.trim() || undefined,
        signatureIdType: sigIdType.trim() || undefined,
        signatureId: sigId.trim() || undefined,
      });
      toast.success("Entrega completada exitosamente");
      setShowComplete(false);
    } catch {
      toast.error("Error al completar la entrega");
    }
  };

  const handleFail = async () => {
    if (!failReason.trim()) return;
    try {
      await failMutation.mutateAsync({
        id: id!,
        reason: failReason.trim(),
      });
      toast.success("Falla reportada");
      setShowFail(false);
      setFailReason("");
    } catch {
      toast.error("Error al reportar la falla");
    }
  };

  /* ---- Loading / Error ---- */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">
          No se pudo cargar la orden de entrega.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate("/delivery-orders")}
        >
          Volver a ordenes
        </Button>
      </div>
    );
  }

  const isFailed = order.status === "FAILED";
  const currentStep = getStepIndex(order.status);
  const address = order.deliveryAddress as Record<string, any> | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Back */}
      <button
        onClick={() => navigate("/delivery-orders")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a ordenes
      </button>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
            <Truck className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={order.status} />
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  DELIVERY_TYPE_COLORS[order.deliveryType] ??
                    "bg-gray-500/15 text-gray-400",
                )}
              >
                {DELIVERY_TYPE_LABELS[order.deliveryType] ??
                  order.deliveryType}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-display">
              Orden{" "}
              <span className="font-mono">{order.number}</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isFailedStep = isFailed && idx === currentStep;

            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-initial">
                {/* Step circle + label */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      isFailedStep
                        ? "border-red-400 bg-red-500/15 text-red-400"
                        : isCompleted
                          ? "border-emerald-400 bg-emerald-500/15 text-emerald-400"
                          : isCurrent
                            ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                            : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : isFailedStep ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </motion.div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium whitespace-nowrap",
                      isCompleted || isCurrent
                        ? "text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)]",
                      isFailedStep && "text-red-400",
                    )}
                  >
                    {isFailedStep ? "Fallido" : step.label}
                  </span>
                </div>

                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 mx-3">
                    <div
                      className={cn(
                        "h-0.5 w-full rounded-full transition-colors",
                        idx < currentStep
                          ? "bg-emerald-400"
                          : "bg-[var(--border)]",
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <DetailCard
            title="Informacion de la Orden"
            icon={<Package className="h-4 w-4" />}
          >
            <InfoGrid
              columns={3}
              items={[
                { label: "Envio", value: order.shipmentId?.slice(0, 12) + "..." },
                { label: "Cliente", value: order.customerId?.slice(0, 12) + "..." || "—" },
                {
                  label: "Tipo",
                  value:
                    DELIVERY_TYPE_LABELS[order.deliveryType] ??
                    order.deliveryType,
                },
                {
                  label: "Programado",
                  value: order.scheduledAt
                    ? formatDateTime(order.scheduledAt)
                    : "—",
                },
                {
                  label: "Creado",
                  value: formatDateTime(order.createdAt),
                },
                {
                  label: "Entregado",
                  value: order.deliveredAt
                    ? formatDateTime(order.deliveredAt)
                    : "—",
                },
              ]}
            />
          </DetailCard>

          {/* Driver */}
          {order.driverName && (
            <DetailCard
              title="Conductor"
              icon={<User className="h-4 w-4" />}
            >
              <InfoGrid
                columns={3}
                items={[
                  { label: "Nombre", value: order.driverName },
                  {
                    label: "Telefono",
                    value: order.driverPhone ? (
                      <a
                        href={`tel:${order.driverPhone}`}
                        className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {order.driverPhone}
                      </a>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    label: "Vehiculo",
                    value: order.driverVehicle || "—",
                  },
                ]}
              />
            </DetailCard>
          )}

          {/* Proof of Delivery */}
          {order.status === "DELIVERED" && (
            <DetailCard
              title="Prueba de Entrega"
              icon={<PenTool className="h-4 w-4" />}
            >
              <InfoGrid
                columns={2}
                items={[
                  {
                    label: "Contacto Firma",
                    value: order.signatureContact || "—",
                  },
                  {
                    label: "Tipo ID",
                    value: order.signatureIdType || "—",
                  },
                  {
                    label: "ID",
                    value: order.signatureId || "—",
                  },
                  {
                    label: "Foto",
                    value: order.photoUrl ? (
                      <a
                        href={order.photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Ver foto
                      </a>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    label: "Firma",
                    value: order.signatureUrl ? (
                      <a
                        href={order.signatureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
                      >
                        <PenTool className="h-3.5 w-3.5" />
                        Ver firma
                      </a>
                    ) : (
                      "—"
                    ),
                  },
                ]}
              />
            </DetailCard>
          )}

          {/* Failure reason */}
          {order.status === "FAILED" && (
            <DetailCard
              title="Razon de Fallo"
              icon={<AlertTriangle className="h-4 w-4" />}
            >
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <p className="text-sm text-red-400 font-medium">
                  {order.failReason || "Sin razon especificada"}
                </p>
                {order.notes && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-2">
                    {order.notes}
                  </p>
                )}
              </div>
            </DetailCard>
          )}
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Delivery Address */}
          <DetailCard
            title="Direccion de Entrega"
            icon={<MapPin className="h-4 w-4" />}
          >
            {order.deliveryType === "PICKUP" ? (
              <div className="flex flex-col items-center py-4 text-[var(--muted-foreground)]">
                <MapPin className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">Retiro en sucursal</p>
              </div>
            ) : address ? (
              <div className="space-y-1 text-sm">
                {address.street && <p>{address.street}</p>}
                {address.city && (
                  <p>
                    {address.city}
                    {address.state ? `, ${address.state}` : ""}
                  </p>
                )}
                {address.zipCode && <p>{address.zipCode}</p>}
                {address.country && (
                  <p className="text-[var(--muted-foreground)]">
                    {address.country}
                  </p>
                )}
                {address.notes && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-2 italic">
                    {address.notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                Sin direccion registrada
              </p>
            )}
          </DetailCard>

          {/* Actions */}
          <DetailCard title="Acciones" icon={<Truck className="h-4 w-4" />}>
            <div className="space-y-2">
              {order.status === "PENDING" && (
                <Button
                  className="w-full"
                  leftIcon={<User className="h-4 w-4" />}
                  onClick={() => setShowAssign(true)}
                >
                  Asignar Conductor
                </Button>
              )}

              {order.status === "ASSIGNED" && (
                <Button
                  className="w-full"
                  leftIcon={<Play className="h-4 w-4" />}
                  onClick={handleStart}
                  isLoading={startMutation.isPending}
                >
                  Iniciar Entrega
                </Button>
              )}

              {order.status === "IN_TRANSIT" && (
                <>
                  <Button
                    className="w-full"
                    leftIcon={<Check className="h-4 w-4" />}
                    onClick={() => setShowComplete(true)}
                  >
                    Completar Entrega
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    leftIcon={<AlertTriangle className="h-4 w-4" />}
                    onClick={() => setShowFail(true)}
                  >
                    Reportar Falla
                  </Button>
                </>
              )}

              {order.status === "FAILED" && (
                <>
                  <Button
                    className="w-full"
                    leftIcon={<RotateCcw className="h-4 w-4" />}
                    onClick={() => setShowAssign(true)}
                  >
                    Reintentar
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    leftIcon={<XCircle className="h-4 w-4" />}
                    disabled
                  >
                    Cancelar
                  </Button>
                </>
              )}

              {order.status === "DELIVERED" && (
                <div className="flex flex-col items-center py-4 text-emerald-400">
                  <Check className="h-8 w-8 mb-2" />
                  <p className="text-sm font-semibold">Entrega completada</p>
                </div>
              )}
            </div>
          </DetailCard>
        </div>
      </div>

      {/* Assign Driver Dialog */}
      <Dialog
        open={showAssign}
        onClose={() => setShowAssign(false)}
        title="Asignar Conductor"
        description="Ingresa los datos del conductor para esta entrega."
      >
        <div className="space-y-4">
          <Input
            label="Nombre del Conductor"
            placeholder="Ej: Carlos Martinez"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
          />
          <Input
            label="Telefono"
            placeholder="8091234567"
            value={driverPhone}
            onChange={(e) => setDriverPhone(e.target.value)}
          />
          <Input
            label="Vehiculo"
            placeholder="Ej: Honda CRV 2022 - Gris"
            value={driverVehicle}
            onChange={(e) => setDriverVehicle(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAssign(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssign}
              isLoading={assignMutation.isPending}
              disabled={!driverName.trim()}
            >
              Asignar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Complete Delivery Dialog */}
      <Dialog
        open={showComplete}
        onClose={() => setShowComplete(false)}
        title="Completar Entrega"
        description="Registra la prueba de entrega."
      >
        <div className="space-y-4">
          <Input
            label="Contacto que firma"
            placeholder="Nombre de quien recibe"
            value={sigContact}
            onChange={(e) => setSigContact(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tipo de ID"
              placeholder="Cedula, Pasaporte..."
              value={sigIdType}
              onChange={(e) => setSigIdType(e.target.value)}
            />
            <Input
              label="Numero de ID"
              placeholder="001-1234567-8"
              value={sigId}
              onChange={(e) => setSigId(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowComplete(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleComplete}
              isLoading={completeMutation.isPending}
            >
              Confirmar Entrega
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Fail Delivery Dialog */}
      <Dialog
        open={showFail}
        onClose={() => setShowFail(false)}
        title="Reportar Falla"
        description="Indica la razon por la que no se pudo completar la entrega."
      >
        <div className="space-y-4">
          <Textarea
            label="Razon de la falla"
            placeholder="Describe el motivo..."
            value={failReason}
            onChange={(e) => setFailReason(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowFail(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleFail}
              isLoading={failMutation.isPending}
              disabled={!failReason.trim()}
            >
              Reportar Falla
            </Button>
          </div>
        </div>
      </Dialog>
    </motion.div>
  );
}
