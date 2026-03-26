import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreateDriver } from "@/hooks/use-api";

interface CreateDriverDialogProps {
  open: boolean;
  onClose: () => void;
}

const LICENSE_TYPES = [
  { value: "A", label: "A - Motocicleta" },
  { value: "B", label: "B - Vehiculo liviano" },
  { value: "C", label: "C - Vehiculo pesado" },
  { value: "D", label: "D - Transporte publico" },
  { value: "E", label: "E - Articulado" },
];

export function CreateDriverDialog({ open, onClose }: CreateDriverDialogProps) {
  const toast = useToast();
  const createMutation = useCreateDriver();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    licenseType: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetAndClose = () => {
    setForm({ firstName: "", lastName: "", phone: "", email: "", licenseNumber: "", licenseType: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "Nombre requerido";
    if (!form.lastName.trim()) errs.lastName = "Apellido requerido";
    if (!form.phone.trim()) errs.phone = "Telefono requerido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        licenseNumber: form.licenseNumber.trim() || undefined,
        licenseType: form.licenseType || undefined,
      });
      toast.success("Conductor creado exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear el conductor");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={resetAndClose} title="Nuevo Conductor" description="Registrar un nuevo conductor en la flota">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            placeholder="Juan"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Apellido"
            placeholder="Perez"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            error={errors.lastName}
          />
        </div>

        <Input
          label="Telefono"
          placeholder="+1 809 555 1234"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          error={errors.phone}
        />

        <Input
          label="Email (opcional)"
          type="email"
          placeholder="juan@ejemplo.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="No. Licencia (opcional)"
            placeholder="001-1234567-0"
            value={form.licenseNumber}
            onChange={(e) => update("licenseNumber", e.target.value)}
          />
          <Select
            label="Tipo Licencia"
            options={LICENSE_TYPES}
            value={form.licenseType}
            onChange={(e) => update("licenseType", e.target.value)}
            placeholder="Seleccionar..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Conductor
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
