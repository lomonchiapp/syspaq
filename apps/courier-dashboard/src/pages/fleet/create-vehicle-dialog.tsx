import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreateVehicle, useBranches } from "@/hooks/use-api";

interface CreateVehicleDialogProps {
  open: boolean;
  onClose: () => void;
}

const VEHICLE_TYPES = [
  { value: "MOTORCYCLE", label: "Motocicleta" },
  { value: "CAR", label: "Automovil" },
  { value: "VAN", label: "Furgoneta" },
  { value: "TRUCK", label: "Camion" },
  { value: "PICKUP", label: "Pickup" },
];

const FUEL_TYPES = [
  { value: "GASOLINE", label: "Gasolina" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELECTRIC", label: "Electrico" },
  { value: "HYBRID", label: "Hibrido" },
  { value: "GAS", label: "Gas" },
];

export function CreateVehicleDialog({ open, onClose }: CreateVehicleDialogProps) {
  const toast = useToast();
  const createMutation = useCreateVehicle();
  const { data: branchesData } = useBranches(1, 100);

  const [form, setForm] = useState({
    plate: "",
    brand: "",
    model: "",
    year: "",
    type: "",
    capacityWeightLbs: "",
    capacityVolumeCbft: "",
    currentBranchId: "",
    fuelType: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const branchOptions = (branchesData?.data ?? []).map((b) => ({
    value: b.id,
    label: `${b.name} (${b.code})`,
  }));

  const resetAndClose = () => {
    setForm({
      plate: "", brand: "", model: "", year: "", type: "",
      capacityWeightLbs: "", capacityVolumeCbft: "", currentBranchId: "", fuelType: "",
    });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.plate.trim()) errs.plate = "Placa requerida";
    if (!form.brand.trim()) errs.brand = "Marca requerida";
    if (!form.model.trim()) errs.model = "Modelo requerido";
    if (!form.type) errs.type = "Tipo requerido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        plate: form.plate.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year ? parseInt(form.year) : undefined,
        type: form.type,
        capacityWeightLbs: form.capacityWeightLbs ? parseFloat(form.capacityWeightLbs) : undefined,
        capacityVolumeCbft: form.capacityVolumeCbft ? parseFloat(form.capacityVolumeCbft) : undefined,
        currentBranchId: form.currentBranchId || undefined,
        fuelType: form.fuelType || undefined,
      });
      toast.success("Vehiculo creado exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear el vehiculo");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={resetAndClose} title="Nuevo Vehiculo" description="Registrar un nuevo vehiculo en la flota" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Placa"
            placeholder="A123456"
            value={form.plate}
            onChange={(e) => update("plate", e.target.value)}
            error={errors.plate}
          />
          <Select
            label="Tipo"
            options={VEHICLE_TYPES}
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            placeholder="Seleccionar..."
            error={errors.type}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Marca"
            placeholder="Toyota"
            value={form.brand}
            onChange={(e) => update("brand", e.target.value)}
            error={errors.brand}
          />
          <Input
            label="Modelo"
            placeholder="Hilux"
            value={form.model}
            onChange={(e) => update("model", e.target.value)}
            error={errors.model}
          />
          <Input
            label="Ano (opcional)"
            type="number"
            placeholder="2024"
            value={form.year}
            onChange={(e) => update("year", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Capacidad Peso (lbs)"
            type="number"
            placeholder="2000"
            value={form.capacityWeightLbs}
            onChange={(e) => update("capacityWeightLbs", e.target.value)}
          />
          <Input
            label="Capacidad Volumen (cbft)"
            type="number"
            placeholder="150"
            value={form.capacityVolumeCbft}
            onChange={(e) => update("capacityVolumeCbft", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Sucursal"
            options={branchOptions}
            value={form.currentBranchId}
            onChange={(e) => update("currentBranchId", e.target.value)}
            placeholder="Seleccionar..."
          />
          <Select
            label="Combustible"
            options={FUEL_TYPES}
            value={form.fuelType}
            onChange={(e) => update("fuelType", e.target.value)}
            placeholder="Seleccionar..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Vehiculo
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
