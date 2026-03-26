import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreateBranch } from "@/hooks/use-api";

interface CreateBranchDialogProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS = [
  { value: "WAREHOUSE", label: "Bodega" },
  { value: "PICKUP_POINT", label: "Punto de Retiro" },
  { value: "OFFICE", label: "Oficina" },
  { value: "SORTING_CENTER", label: "Centro de Clasificacion" },
];

export function CreateBranchDialog({ open, onClose }: CreateBranchDialogProps) {
  const toast = useToast();
  const createMutation = useCreateBranch();

  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "WAREHOUSE",
    street: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = Object.values(form).some((v, i) => i === 2 ? v !== "WAREHOUSE" : v !== "");

  const handleClose = () => {
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Deseas cerrar?")) return;
    resetAndClose();
  };

  const resetAndClose = () => {
    setForm({ name: "", code: "", type: "WAREHOUSE", street: "", city: "", state: "", country: "", zip: "", phone: "", email: "" });
    setErrors({});
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "El nombre es requerido";
    if (!form.code.trim()) errs.code = "El codigo es requerido";
    if (!form.street.trim()) errs.street = "La direccion es requerida";
    if (!form.city.trim()) errs.city = "La ciudad es requerida";
    if (!form.country.trim()) errs.country = "El pais es requerido";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email invalido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        name: form.name.trim(),
        code: form.code.trim(),
        type: form.type,
        address: {
          street: form.street.trim(),
          city: form.city.trim(),
          state: form.state.trim() || undefined,
          country: form.country.trim(),
          zip: form.zip.trim() || undefined,
        },
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      } as any);
      toast.success("Sucursal creada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear la sucursal");
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Nueva Sucursal" description="Agrega una nueva bodega o punto de retiro" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Nombre"
            placeholder="Bodega Miami"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            error={errors.name}
          />
          <Input
            label="Codigo"
            placeholder="MIA-WH1"
            value={form.code}
            onChange={(e) => update("code", e.target.value)}
            error={errors.code}
          />
          <Select
            label="Tipo"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
          />
        </div>

        <Input
          label="Direccion"
          placeholder="1234 NW 97th Ave"
          value={form.street}
          onChange={(e) => update("street", e.target.value)}
          error={errors.street}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Ciudad"
            placeholder="Doral"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            error={errors.city}
          />
          <Input
            label="Estado/Provincia"
            placeholder="FL"
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
          />
          <Input
            label="Pais"
            placeholder="US"
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            error={errors.country}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Codigo Postal"
            placeholder="33178"
            value={form.zip}
            onChange={(e) => update("zip", e.target.value)}
          />
          <Input
            label="Telefono"
            placeholder="+1 305-555-0000"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          <Input
            label="Email"
            placeholder="bodega@syspaq.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Crear Sucursal
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
