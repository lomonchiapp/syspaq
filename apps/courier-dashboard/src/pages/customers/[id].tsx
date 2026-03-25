import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  Package,
  FileText,
  AlertTriangle,
  Truck,
  Plus,
  Pencil,
  DollarSign,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@syspaq/ui";
import {
  useCustomerDetailExtended,
  useCustomerShipments,
  useCustomerPreAlerts,
  useCustomerInvoices,
  useCustomerReceptions,
} from "@/hooks/use-api";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";
import type { Shipment, PreAlert, Invoice, Reception } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Mini table components for each tab                                 */
/* ------------------------------------------------------------------ */

function MiniTable({
  headers,
  children,
  isEmpty,
}: {
  headers: string[];
  children: React.ReactNode;
  isEmpty?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--muted)]/50">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {isEmpty && (
        <div className="flex items-center justify-center py-10 text-sm text-[var(--muted-foreground)]">
          Sin registros
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab content components                                             */
/* ------------------------------------------------------------------ */

function ShipmentsTab({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomerShipments(customerId);
  const navigate = useNavigate();
  const shipments = data?.data ?? [];

  if (isLoading)
    return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <MiniTable headers={["Tracking #", "Fase", "Creado"]} isEmpty={shipments.length === 0}>
      {shipments.map((s: Shipment) => (
        <tr
          key={s.id}
          onClick={() => navigate(`/shipments/${s.id}`)}
          className="border-t border-[var(--border)] cursor-pointer hover:bg-[var(--muted)]/50 transition-colors"
        >
          <td className="px-3 py-2 font-mono font-semibold text-[var(--primary)] text-sm">
            {s.trackingNumber}
          </td>
          <td className="px-3 py-2">
            <StatusBadge status={s.currentPhase} />
          </td>
          <td className="px-3 py-2 text-[var(--muted-foreground)] text-sm">{formatDate(s.createdAt)}</td>
        </tr>
      ))}
    </MiniTable>
  );
}

function PreAlertsTab({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomerPreAlerts(customerId);
  const preAlerts = data?.data ?? [];

  if (isLoading)
    return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <MiniTable headers={["Tracking #", "Tienda", "Valor", "Estado"]} isEmpty={preAlerts.length === 0}>
      {preAlerts.map((p: PreAlert) => (
        <tr key={p.id} className="border-t border-[var(--border)]">
          <td className="px-3 py-2 font-mono text-sm">{p.trackingNumber}</td>
          <td className="px-3 py-2 text-sm">{p.store || "—"}</td>
          <td className="px-3 py-2 text-sm">
            {p.estimatedValue ? formatCurrency(p.estimatedValue, p.currency) : "—"}
          </td>
          <td className="px-3 py-2">
            <StatusBadge status={p.status} />
          </td>
        </tr>
      ))}
    </MiniTable>
  );
}

function InvoicesTab({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomerInvoices(customerId);
  const navigate = useNavigate();
  const invoices = data?.data ?? [];

  if (isLoading)
    return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <MiniTable headers={["# Factura", "Total", "Balance", "Estado"]} isEmpty={invoices.length === 0}>
      {invoices.map((inv: Invoice) => (
        <tr
          key={inv.id}
          onClick={() => navigate(`/invoices/${inv.id}`)}
          className="border-t border-[var(--border)] cursor-pointer hover:bg-[var(--muted)]/50 transition-colors"
        >
          <td className="px-3 py-2 font-mono font-semibold text-[var(--primary)] text-sm">
            {inv.number}
          </td>
          <td className="px-3 py-2 text-sm font-semibold">
            {formatCurrency(inv.total, inv.currency)}
          </td>
          <td className={cn("px-3 py-2 text-sm font-semibold", inv.balance > 0 && "text-red-400")}>
            {formatCurrency(inv.balance, inv.currency)}
          </td>
          <td className="px-3 py-2">
            <StatusBadge status={inv.status} />
          </td>
        </tr>
      ))}
    </MiniTable>
  );
}

function ReceptionsTab({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomerReceptions(customerId);
  const receptions = data?.data ?? [];

  if (isLoading)
    return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;

  return (
    <MiniTable headers={["Peso (lbs)", "Cargos", "Estado", "Fecha"]} isEmpty={receptions.length === 0}>
      {receptions.map((r: Reception) => (
        <tr key={r.id} className="border-t border-[var(--border)]">
          <td className="px-3 py-2 text-sm">{Number(r.weightLbs)?.toFixed(2) ?? "—"}</td>
          <td className="px-3 py-2 text-sm font-semibold">
            {formatCurrency(r.totalCharge, r.currency)}
          </td>
          <td className="px-3 py-2">
            <StatusBadge status={r.status} />
          </td>
          <td className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
            {formatDate(r.receivedAt)}
          </td>
        </tr>
      ))}
    </MiniTable>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

const tabDefs = [
  { key: "shipments", label: "Envios", icon: Package },
  { key: "pre-alerts", label: "Pre-Alertas", icon: AlertTriangle },
  { key: "invoices", label: "Facturas", icon: FileText },
  { key: "receptions", label: "Recepciones", icon: Truck },
];

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("shipments");

  const { data: customer, isLoading, isError } = useCustomerDetailExtended(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">No se pudo cargar el cliente.</p>
        <Button variant="outline" onClick={() => navigate("/customers")}>
          Volver a clientes
        </Button>
      </div>
    );
  }

  const balance = customer.balance ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate("/customers")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </button>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Casillero badge */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
            <span className="text-lg font-bold font-mono">{customer.casillero.slice(-4)}</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="rounded-full bg-[var(--primary)]/15 px-3 py-0.5 text-xs font-bold font-mono text-[var(--primary)]">
                {customer.casillero}
              </span>
              <StatusBadge status={customer.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <h1 className="text-2xl font-bold font-display">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{customer.email}</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (tabs + data) */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs
            tabs={tabDefs.map((t) => ({
              key: t.key,
              label: t.label,
              count:
                t.key === "shipments"
                  ? customer.shipmentCount
                  : t.key === "pre-alerts"
                    ? customer.preAlertCount
                    : t.key === "invoices"
                      ? customer.invoiceCount
                      : t.key === "receptions"
                        ? customer.receptionCount
                        : undefined,
            }))}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "shipments" && <ShipmentsTab customerId={id!} />}
            {activeTab === "pre-alerts" && <PreAlertsTab customerId={id!} />}
            {activeTab === "invoices" && <InvoicesTab customerId={id!} />}
            {activeTab === "receptions" && <ReceptionsTab customerId={id!} />}
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Info card */}
          <DetailCard title="Informacion del Cliente" icon={<User className="h-4 w-4" />}>
            <InfoGrid
              items={[
                { label: "Email", value: customer.email },
                { label: "Telefono", value: customer.phone || "—" },
                {
                  label: "Cedula / ID",
                  value: customer.idType
                    ? `${customer.idType}: ${customer.idNumber}`
                    : "—",
                },
                { label: "Direccion", value: customer.address || "—" },
                { label: "Miembro desde", value: formatDate(customer.createdAt) },
              ]}
              columns={2}
            />
          </DetailCard>

          {/* Balance card */}
          <DetailCard title="Balance" icon={<DollarSign className="h-4 w-4" />}>
            <div className="text-center py-2">
              <p
                className={cn(
                  "text-3xl font-bold font-mono",
                  balance > 0 ? "text-red-400" : "text-emerald-400",
                )}
              >
                {formatCurrency(balance)}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {balance > 0 ? "Pendiente de pago" : "Sin balance pendiente"}
              </p>
            </div>
          </DetailCard>

          {/* Quick actions */}
          <DetailCard title="Acciones Rapidas">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<Package className="h-4 w-4" />}
                onClick={() => navigate("/shipments")}
              >
                Crear Envio
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<AlertTriangle className="h-4 w-4" />}
                onClick={() => navigate("/pre-alerts")}
              >
                Crear Pre-Alerta
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<FileText className="h-4 w-4" />}
                onClick={() => navigate("/invoices")}
              >
                Generar Factura
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                leftIcon={<Pencil className="h-4 w-4" />}
              >
                Editar Cliente
              </Button>
            </div>
          </DetailCard>
        </div>
      </div>
    </motion.div>
  );
}
