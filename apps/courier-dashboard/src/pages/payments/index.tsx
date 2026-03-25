import { useState } from "react";
import { motion } from "motion/react";
import { DollarSign } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate } from "@syspaq/ui";
import { usePayments } from "@/hooks/use-api";
import { RecordPaymentDialog } from "@/pages/invoices/record-payment-dialog";
import type { PaymentListItem } from "@/types/api";

const METHOD_COLORS: Record<string, string> = {
  CASH: "bg-emerald-500/15 text-emerald-400",
  CREDIT_CARD: "bg-blue-500/15 text-blue-400",
  CARD: "bg-blue-500/15 text-blue-400",
  BANK_TRANSFER: "bg-purple-500/15 text-purple-400",
  STRIPE: "bg-indigo-500/15 text-indigo-400",
  PAYPAL: "bg-sky-500/15 text-sky-400",
  CHECK: "bg-amber-500/15 text-amber-400",
  OTHER: "bg-gray-500/15 text-gray-400",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Tarjeta",
  CARD: "Tarjeta",
  BANK_TRANSFER: "Transferencia",
  STRIPE: "Stripe",
  PAYPAL: "PayPal",
  CHECK: "Cheque",
  OTHER: "Otro",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        METHOD_COLORS[method] ?? "bg-gray-500/15 text-gray-400",
      )}
    >
      {METHOD_LABELS[method] ?? method}
    </span>
  );
}

const columns: Column<PaymentListItem>[] = [
  {
    key: "paidAt",
    header: "Fecha",
    render: (p) => formatDate(p.paidAt),
  },
  {
    key: "method",
    header: "Metodo",
    render: (p) => <MethodBadge method={p.method} />,
  },
  {
    key: "amount",
    header: "Monto",
    render: (p) => (
      <span className="font-semibold font-mono">
        {formatCurrency(p.amount, p.currency)}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "reference",
    header: "Referencia",
    render: (p) => (
      <span className="font-mono text-xs text-[var(--muted-foreground)]">
        {p.reference || "—"}
      </span>
    ),
  },
  {
    key: "customerName",
    header: "Cliente",
    render: (p) => p.customerName || (p.customerId ? p.customerId.slice(0, 8) + "..." : "—"),
  },
];

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const { data, isLoading, isError, refetch } = usePayments(
    page,
    20,
    dateFrom || undefined,
    dateTo || undefined,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader title="Pagos" description="Historial de pagos recibidos">
        <Button
          leftIcon={<DollarSign className="h-4 w-4" />}
          onClick={() => setShowPayment(true)}
        >
          Registrar Pago
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-end gap-3 mb-4">
        <Input
          label="Desde"
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="w-44"
        />
        <Input
          label="Hasta"
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="w-44"
        />
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar los pagos.
          </p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      )}

      {/* Table */}
      {!isError && (
        <>
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            emptyMessage="No se encontraron pagos"
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <RecordPaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        invoiceId=""
        invoiceBalance={0}
        invoiceCurrency="USD"
      />
    </motion.div>
  );
}
