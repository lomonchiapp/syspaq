import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCreateInvoice } from "@/hooks/use-api";
import { formatCurrency } from "@syspaq/ui";

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
}

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
  discountPct: string;
  taxPct: string;
}

const emptyItem: LineItem = {
  description: "",
  quantity: "1",
  unitPrice: "",
  discountPct: "0",
  taxPct: "18",
};

function calculateLineTotal(item: LineItem): number {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const discount = parseFloat(item.discountPct) || 0;
  const tax = parseFloat(item.taxPct) || 0;
  const subtotal = qty * price;
  const discounted = subtotal * (1 - discount / 100);
  return discounted * (1 + tax / 100);
}

export function CreateInvoiceDialog({ open, onClose }: CreateInvoiceDialogProps) {
  const toast = useToast();
  const createMutation = useCreateInvoice();

  const [step, setStep] = useState<1 | 2>(1);
  const [customerId, setCustomerId] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...emptyItem }]);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  const isDirty = customerId !== "" || lineItems.some((item) => item.description !== "" || item.unitPrice !== "");

  const handleClose = () => {
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Deseas cerrar?")) return;
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(1);
    setCustomerId("");
    setCustomerError("");
    setLineItems([{ ...emptyItem }]);
    setItemErrors({});
    onClose();
  };

  const handleNextStep = () => {
    if (!customerId.trim()) {
      setCustomerError("El cliente es requerido");
      return;
    }
    setCustomerError("");
    setStep(2);
  };

  const updateItem = (idx: number, field: keyof LineItem, value: string) => {
    setLineItems((prev) => {
      const items = [...prev];
      items[idx] = { ...items[idx], [field]: value };
      return items;
    });
  };

  const addItem = () => {
    setLineItems((prev) => [...prev, { ...emptyItem }]);
  };

  const removeItem = (idx: number) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const liveTotal = lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const liveSubtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const validateItems = (): boolean => {
    const errs: Record<string, string> = {};
    lineItems.forEach((item, idx) => {
      if (!item.description.trim()) errs[`${idx}-description`] = "Requerido";
      if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) errs[`${idx}-unitPrice`] = "Requerido";
    });
    setItemErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateItems()) return;

    try {
      await createMutation.mutateAsync({
        customerId: customerId.trim(),
        currency: "USD",
        // The API will process these line items
        ...({
          lineItems: lineItems.map((item) => ({
            description: item.description.trim(),
            quantity: parseFloat(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            discountPct: parseFloat(item.discountPct) || 0,
            taxPct: parseFloat(item.taxPct) || 0,
          })),
        } as any),
      });
      toast.success("Factura creada exitosamente");
      resetAndClose();
    } catch (err: any) {
      toast.error(err?.detail || "Error al crear la factura");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nueva Factura"
      description={step === 1 ? "Paso 1: Selecciona el cliente" : "Paso 2: Agrega los articulos"}
      size="xl"
    >
      {step === 1 ? (
        <div className="space-y-4">
          <Input
            label="Cliente"
            placeholder="Buscar por nombre, casillero o ID..."
            value={customerId}
            onChange={(e) => {
              setCustomerId(e.target.value);
              if (customerError) setCustomerError("");
            }}
            error={customerError}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button variant="ghost" type="button" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleNextStep}>
              Siguiente
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Line items */}
          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 p-3"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      label="Descripcion"
                      placeholder="Servicio de envio, peso adicional, etc."
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      error={itemErrors[`${idx}-description`]}
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        label="Cantidad"
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      />
                      <Input
                        label="Precio Unit."
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                        error={itemErrors[`${idx}-unitPrice`]}
                      />
                      <Input
                        label="Descuento %"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.discountPct}
                        onChange={(e) => updateItem(idx, "discountPct", e.target.value)}
                      />
                      <Input
                        label="Impuesto %"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.taxPct}
                        onChange={(e) => updateItem(idx, "taxPct", e.target.value)}
                      />
                    </div>
                  </div>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="mt-7 p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="text-right mt-2">
                  <span className="text-xs text-[var(--muted-foreground)]">Linea total: </span>
                  <span className="text-sm font-semibold">{formatCurrency(calculateLineTotal(item))}</span>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={addItem}
          >
            Agregar Articulo
          </Button>

          {/* Live totals */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--muted-foreground)]">Subtotal</span>
              <span>{formatCurrency(liveSubtotal)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-[var(--border)] pt-2 mt-2">
              <span>Total Estimado</span>
              <span className="text-[var(--primary)]">{formatCurrency(liveTotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-[var(--border)]">
            <Button variant="ghost" type="button" onClick={() => setStep(1)}>
              Atras
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" type="button" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={createMutation.isPending}>
                Crear Factura
              </Button>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
