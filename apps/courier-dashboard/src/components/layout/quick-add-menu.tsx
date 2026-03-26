import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Package,
  Users,
  Bell,
  Inbox,
  BellRing,
  Ship,
  Truck,
  Building2,
  FileText,
  X,
} from "lucide-react";
import { cn } from "@syspaq/ui";

/* Dialog imports for inline creation */
import { CreateCustomerDialog } from "@/pages/customers/create-customer-dialog";
import { CreateShipmentDialog } from "@/pages/shipments/create-shipment-dialog";
import { CreatePreAlertDialog } from "@/pages/pre-alerts/create-pre-alert-dialog";
import { CreateReceptionDialog } from "@/pages/receptions/create-reception-dialog";
import { CreatePostAlertDialog } from "@/pages/post-alerts/create-post-alert-dialog";
import { CreateContainerDialog } from "@/pages/containers/create-container-dialog";
import { CreateDeliveryOrderDialog } from "@/pages/delivery-orders/create-delivery-order-dialog";
import { CreateBranchDialog } from "@/pages/branches/create-branch-dialog";
import { CreateInvoiceDialog } from "@/pages/invoices/create-invoice-dialog";

type DialogKey =
  | "customer"
  | "shipment"
  | "pre-alert"
  | "reception"
  | "post-alert"
  | "container"
  | "delivery-order"
  | "branch"
  | "invoice"
  | null;

interface QuickAction {
  key: DialogKey;
  label: string;
  description: string;
  icon: typeof Package;
  hotkey: string;
  color: string;
  section: string;
}

const ACTIONS: QuickAction[] = [
  // Operaciones
  { key: "customer", label: "Nuevo Cliente", description: "Registrar cliente", icon: Users, hotkey: "C", color: "text-emerald-400 bg-emerald-500/15", section: "Operaciones" },
  { key: "shipment", label: "Nuevo Envio", description: "Registrar envio", icon: Package, hotkey: "E", color: "text-blue-400 bg-blue-500/15", section: "Operaciones" },
  { key: "pre-alert", label: "Nueva Pre-Alerta", description: "Pre-alertar paquete", icon: Bell, hotkey: "P", color: "text-amber-400 bg-amber-500/15", section: "Operaciones" },
  { key: "reception", label: "Nueva Recepcion", description: "Recibir en bodega", icon: Inbox, hotkey: "R", color: "text-cyan-400 bg-cyan-500/15", section: "Operaciones" },
  { key: "post-alert", label: "Nueva Post-Alerta", description: "Confirmar entrega", icon: BellRing, hotkey: "A", color: "text-violet-400 bg-violet-500/15", section: "Operaciones" },
  // Logistica
  { key: "container", label: "Nuevo Contenedor", description: "Contenedor de carga", icon: Ship, hotkey: "T", color: "text-indigo-400 bg-indigo-500/15", section: "Logistica" },
  { key: "delivery-order", label: "Nueva Orden", description: "Orden de entrega", icon: Truck, hotkey: "O", color: "text-pink-400 bg-pink-500/15", section: "Logistica" },
  { key: "branch", label: "Nueva Sucursal", description: "Bodega o punto", icon: Building2, hotkey: "S", color: "text-orange-400 bg-orange-500/15", section: "Logistica" },
  // Facturacion
  { key: "invoice", label: "Nueva Factura", description: "Crear factura", icon: FileText, hotkey: "F", color: "text-teal-400 bg-teal-500/15", section: "Facturacion" },
];

const SECTIONS = ["Operaciones", "Logistica", "Facturacion"];

export function QuickAddMenu() {
  const [open, setOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<DialogKey>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Global hotkey: Ctrl/Cmd + K to open */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* Individual hotkeys while menu is open */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const action = ACTIONS.find(
        (a) => a.hotkey.toLowerCase() === e.key.toLowerCase(),
      );
      if (action) {
        e.preventDefault();
        setOpen(false);
        setActiveDialog(action.key);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  /* Click outside to close */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleAction = (action: QuickAction) => {
    setOpen(false);
    setActiveDialog(action.key);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all",
          "bg-[var(--primary)] text-white hover:brightness-110",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        )}
        title="Creacion rapida (Ctrl+K)"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Nuevo</span>
        <kbd className="ml-1 hidden sm:inline-flex h-5 items-center rounded border border-white/25 bg-white/10 px-1.5 font-mono text-[10px] font-medium">
          {navigator.platform.includes("Mac") ? "\u2318" : "Ctrl"}K
        </kbd>
      </button>

      {/* Mega menu */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Menu panel */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-14 right-4 z-50 w-[520px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
                <div>
                  <h3 className="text-sm font-semibold font-display">Creacion Rapida</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Presiona una tecla para crear rapidamente
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Actions grid by section */}
              <div className="p-4 space-y-4">
                {SECTIONS.map((section) => {
                  const sectionActions = ACTIONS.filter(
                    (a) => a.section === section,
                  );
                  return (
                    <div key={section}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                        {section}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {sectionActions.map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.key}
                              onClick={() => handleAction(action)}
                              className={cn(
                                "group relative flex flex-col items-center gap-2 rounded-xl border border-transparent p-3 transition-all",
                                "hover:border-[var(--border)] hover:bg-[var(--secondary)]",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40",
                              )}
                            >
                              <div
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-lg",
                                  action.color,
                                )}
                              >
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-semibold leading-tight">
                                  {action.label}
                                </p>
                                <p className="text-[10px] text-[var(--muted-foreground)] leading-tight mt-0.5">
                                  {action.description}
                                </p>
                              </div>
                              {/* Hotkey badge */}
                              <kbd className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded border border-[var(--border)] bg-[var(--secondary)] font-mono text-[10px] font-medium text-[var(--muted-foreground)] group-hover:border-[var(--primary)]/40 group-hover:text-[var(--primary)] transition-colors">
                                {action.hotkey}
                              </kbd>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div className="border-t border-[var(--border)] px-5 py-2.5 flex items-center gap-4 text-[10px] text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex h-4 items-center rounded border border-[var(--border)] px-1 font-mono text-[9px]">Esc</kbd>
                  Cerrar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="inline-flex h-4 items-center rounded border border-[var(--border)] px-1 font-mono text-[9px]">A-Z</kbd>
                  Seleccionar accion
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <CreateCustomerDialog open={activeDialog === "customer"} onClose={() => setActiveDialog(null)} />
      <CreateShipmentDialog open={activeDialog === "shipment"} onClose={() => setActiveDialog(null)} />
      <CreatePreAlertDialog open={activeDialog === "pre-alert"} onClose={() => setActiveDialog(null)} />
      <CreateReceptionDialog open={activeDialog === "reception"} onClose={() => setActiveDialog(null)} />
      <CreatePostAlertDialog open={activeDialog === "post-alert"} onClose={() => setActiveDialog(null)} />
      <CreateContainerDialog open={activeDialog === "container"} onClose={() => setActiveDialog(null)} />
      <CreateDeliveryOrderDialog open={activeDialog === "delivery-order"} onClose={() => setActiveDialog(null)} />
      <CreateBranchDialog open={activeDialog === "branch"} onClose={() => setActiveDialog(null)} />
      <CreateInvoiceDialog open={activeDialog === "invoice"} onClose={() => setActiveDialog(null)} />
    </>
  );
}
