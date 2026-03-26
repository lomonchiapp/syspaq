import { useState, type FormEvent } from "react";
import { cn } from "@syspaq/ui";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  useCreateRoute,
  useDrivers,
  useVehicles,
  useBranches,
  useDeliveryOrders,
} from "@/hooks/use-api";
import { ChevronUp, ChevronDown } from "lucide-react";

interface CreateRouteDialogProps {
  open: boolean;
  onClose: () => void;
}

interface StopEntry {
  deliveryOrderId: string;
  number: string;
  sequence: number;
}

export function CreateRouteDialog({ open, onClose }: CreateRouteDialogProps) {
  const toast = useToast();
  const createMutation = useCreateRoute();
  const { data: driversData } = useDrivers(1, 100, "ACTIVE");
  const { data: vehiclesData } = useVehicles(1, 100, "AVAILABLE");
  const { data: branchesData } = useBranches(1, 100);
  const { data: ordersData } = useDeliveryOrders(1, 100, "");

  const [form, setForm] = useState({
    driverId: "",
    vehicleId: "",
    branchId: "",
    plannedDate: "",
  });
  const [stops, setStops] = useState<StopEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const driverOptions = (driversData?.data ?? []).map((d) => ({
    value: d.id,
    label: `${d.firstName} ${d.lastName}`,
  }));

  const vehicleOptions = (vehiclesData?.data ?? []).map((v) => ({
    value: v.id,
    label: `${v.plate} — ${v.brand} ${v.model}`,
  }));

  const branchOptions = (branchesData?.data ?? []).map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  const pendingOrders = (ordersData?.data ?? []).filter(
    (o) =>
      (o.status === "PENDING" || o.status === "ASSIGNED") &&
      !stops.some((s) => s.deliveryOrderId === o.id),
  );

  const resetAndClose = () => {
    setForm({ driverId: "", vehicleId: "", branchId: "", plannedDate: "" });
    setStops([]);
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.driverId) errs.driverId = "Selecciona un conductor";
    if (!form.branchId) errs.branchId = "Selecciona una sucursal";
    if (!form.plannedDate) errs.plannedDate = "Fecha requerida";
    if (stops.length === 0) errs.stops = "Agrega al menos una parada";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addStop = (orderId: string, orderNumber: string) => {
    setStops((prev) => [
      ...prev,
      { deliveryOrderId: orderId, number: orderNumber, sequence: prev.length + 1 },
    ]);
    if (errors.stops) setErrors((prev) => ({ ...prev, stops: "" }));
  };

  const removeStop = (orderId: string) => {
    setStops((prev) =>
      prev
        .filter((s) => s.deliveryOrderId !== orderId)
        .map((s, i) => ({ ...s, sequence: i + 1 })),
    );
  };

  const moveStop = (idx: number, direction: "up" | "down") => {
    setStops((prev) => {
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((s, i) => ({ ...s, sequence: i + 1 }));
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        driverId: form.driverId,
        vehicleId: form.vehicleId || undefined,
        branchId: form.branchId,
        plannedDate: form.plannedDate,
        stops: stops.map((s) => ({
          deliveryOrderId: s.deliveryOrderId,
          sequence: s.sequence,
        })),
      });
      toast.success("Ruta creada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear la ruta");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={resetAndClose} title="Nueva Ruta" description="Crear una nueva ruta de entrega" size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Conductor"
            options={driverOptions}
            value={form.driverId}
            onChange={(e) => update("driverId", e.target.value)}
            placeholder="Seleccionar conductor..."
            error={errors.driverId}
          />
          <Select
            label="Vehiculo (opcional)"
            options={vehicleOptions}
            value={form.vehicleId}
            onChange={(e) => update("vehicleId", e.target.value)}
            placeholder="Seleccionar vehiculo..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Sucursal"
            options={branchOptions}
            value={form.branchId}
            onChange={(e) => update("branchId", e.target.value)}
            placeholder="Seleccionar sucursal..."
            error={errors.branchId}
          />
          <Input
            label="Fecha Planificada"
            type="date"
            value={form.plannedDate}
            onChange={(e) => update("plannedDate", e.target.value)}
            error={errors.plannedDate}
          />
        </div>

        {/* Stops */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Paradas (Ordenes de Entrega)
          </label>
          {errors.stops && (
            <p className="mb-2 text-xs text-[var(--destructive)]">{errors.stops}</p>
          )}

          {/* Selected stops */}
          {stops.length > 0 && (
            <div className="mb-3 rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
              {stops.map((stop, idx) => (
                <div
                  key={stop.deliveryOrderId}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-bold">
                    {stop.sequence}
                  </span>
                  <span className="flex-1 text-sm font-mono">{stop.number}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveStop(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-[var(--muted)] disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStop(idx, "down")}
                      disabled={idx === stops.length - 1}
                      className="p-1 rounded hover:bg-[var(--muted)] disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStop(stop.deliveryOrderId)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Available orders */}
          {pendingOrders.length > 0 ? (
            <div className="max-h-[180px] overflow-y-auto rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
              {pendingOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => addStop(order.id, order.number)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors",
                    "hover:bg-[var(--muted)]/50",
                  )}
                >
                  <span className="font-mono">{order.number}</span>
                  <span className="text-xs text-[var(--primary)] font-semibold">+ Agregar</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--muted-foreground)]">
              No hay ordenes de entrega pendientes disponibles
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Ruta
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
