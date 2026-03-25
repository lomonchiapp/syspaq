import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Send,
  XCircle,
  Download,
  Receipt,
  DollarSign,
} from "lucide-react";
import { cn, formatCurrency, formatDate, formatDateTime } from "@syspaq/ui";
import {
  useInvoiceDetail,
  useInvoicePayments,
  useInvoiceCreditNotes,
  useIssueInvoice,
  useCancelInvoice,
} from "@/hooks/use-api";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/toast";
import { RecordPaymentDialog } from "./record-payment-dialog";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [showRecordPayment, setShowRecordPayment] = useState(false);

  const { data: invoice, isLoading, isError } = useInvoiceDetail(id!);
  const { data: payments } = useInvoicePayments(id!);
  const { data: creditNotes } = useInvoiceCreditNotes(id!);
  const issueMutation = useIssueInvoice();
  const cancelMutation = useCancelInvoice();

  const handleIssue = async () => {
    try {
      await issueMutation.mutateAsync(id!);
      toast.success("Factura emitida exitosamente");
    } catch {
      toast.error("Error al emitir la factura");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(id!);
      toast.success("Factura anulada exitosamente");
    } catch {
      toast.error("Error al anular la factura");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">No se pudo cargar la factura.</p>
        <Button variant="outline" onClick={() => navigate("/invoices")}>
          Volver a facturas
        </Button>
      </div>
    );
  }

  const lineItems = invoice.lineItems ?? [];
  const paymentList = payments ?? [];
  const creditNoteList = creditNotes ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Back */}
      <button
        onClick={() => navigate("/invoices")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a facturas
      </button>

      {/* Header */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
            <FileText className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={invoice.status} />
            </div>
            <h1 className="text-2xl font-bold font-display">
              Factura <span className="font-mono">{invoice.number}</span>
            </h1>
            {invoice.customerName && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                {invoice.customerName}
                {invoice.customerCasillero && ` (${invoice.customerCasillero})`}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-mono">
              {formatCurrency(invoice.total, invoice.currency)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Total</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[var(--border)]/50">
          {invoice.status === "DRAFT" && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={handleIssue}
              isLoading={issueMutation.isPending}
            >
              Emitir Factura
            </Button>
          )}
          <Button
            variant="accent"
            size="sm"
            leftIcon={<DollarSign className="h-4 w-4" />}
            onClick={() => setShowRecordPayment(true)}
          >
            Registrar Pago
          </Button>
          {invoice.status !== "CANCELLED" && (
            <Button
              variant="destructive"
              size="sm"
              leftIcon={<XCircle className="h-4 w-4" />}
              onClick={handleCancel}
              isLoading={cancelMutation.isPending}
            >
              Anular
            </Button>
          )}
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
            Descargar
          </Button>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="mb-6">
        <DetailCard title="Informacion de la Factura" icon={<FileText className="h-4 w-4" />}>
          <InfoGrid
            columns={3}
            items={[
              {
                label: "Cliente",
                value: invoice.customerName
                  ? `${invoice.customerName} (${invoice.customerCasillero ?? ""})`
                  : invoice.customerId.slice(0, 8) + "...",
              },
              { label: "Fecha Emision", value: invoice.issuedAt ? formatDate(invoice.issuedAt) : "Sin emitir" },
              { label: "Fecha Vencimiento", value: invoice.dueAt ? formatDate(invoice.dueAt) : "—" },
              { label: "Moneda", value: invoice.currency },
              { label: "Tipo Fiscal", value: invoice.fiscalType ?? "—" },
              { label: "Creado", value: formatDateTime(invoice.createdAt) },
            ]}
          />
        </DetailCard>
      </div>

      {/* Line items table */}
      <div className="mb-6">
        <DetailCard title="Articulos" icon={<Receipt className="h-4 w-4" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Descripcion
                  </th>
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Cant.
                  </th>
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Precio Unit.
                  </th>
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Descuento
                  </th>
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Impuesto
                  </th>
                  <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--muted-foreground)]">
                      Sin articulos
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--border)]/50">
                      <td className="py-2.5">{item.description}</td>
                      <td className="py-2.5 text-right">{item.quantity}</td>
                      <td className="py-2.5 text-right">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-2.5 text-right">{item.discountPct}%</td>
                      <td className="py-2.5 text-right">{item.taxPct}%</td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatCurrency(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-72 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Descuento</span>
                <span className="text-emerald-400">
                  -{formatCurrency(invoice.discountTotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">ITBIS</span>
                <span>{formatCurrency(invoice.taxTotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-1.5 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Pagado</span>
                <span className="text-emerald-400">
                  {formatCurrency(invoice.amountPaid, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-1.5 font-bold text-base">
                <span>Balance</span>
                <span className={cn(invoice.balance > 0 ? "text-red-400" : "text-emerald-400")}>
                  {formatCurrency(invoice.balance, invoice.currency)}
                </span>
              </div>
            </div>
          </div>
        </DetailCard>
      </div>

      {/* Payments section */}
      <div className="mb-6">
        <DetailCard title="Pagos Aplicados" icon={<CreditCard className="h-4 w-4" />}>
          {paymentList.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-6">
              No hay pagos registrados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Fecha
                    </th>
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Metodo
                    </th>
                    <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Monto
                    </th>
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Referencia
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paymentList.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--border)]/50">
                      <td className="py-2 text-[var(--muted-foreground)]">{formatDate(p.createdAt)}</td>
                      <td className="py-2">
                        <StatusBadge status={p.method} />
                      </td>
                      <td className="py-2 text-right font-semibold text-emerald-400">
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="py-2 text-[var(--muted-foreground)]">{p.reference || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DetailCard>
      </div>

      {/* Credit Notes */}
      {creditNoteList.length > 0 && (
        <div className="mb-6">
          <DetailCard title="Notas de Credito">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Numero
                    </th>
                    <th className="py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Monto
                    </th>
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Razon
                    </th>
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {creditNoteList.map((cn) => (
                    <tr key={cn.id} className="border-b border-[var(--border)]/50">
                      <td className="py-2 font-mono">{cn.number}</td>
                      <td className="py-2 text-right font-semibold">
                        {formatCurrency(cn.amount, cn.currency)}
                      </td>
                      <td className="py-2 text-[var(--muted-foreground)]">{cn.reason || "—"}</td>
                      <td className="py-2">
                        <StatusBadge status={cn.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DetailCard>
        </div>
      )}

      {/* Record payment dialog */}
      <RecordPaymentDialog
        open={showRecordPayment}
        onClose={() => setShowRecordPayment(false)}
        invoiceId={id!}
        invoiceBalance={invoice.balance}
        invoiceCurrency={invoice.currency}
      />
    </motion.div>
  );
}
