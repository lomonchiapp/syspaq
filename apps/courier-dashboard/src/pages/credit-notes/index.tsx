import { useState } from "react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@syspaq/ui";
import { useCreditNotes } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import type { CreditNoteItem } from "@/types/api";

const columns: Column<CreditNoteItem>[] = [
  {
    key: "number",
    header: "# Nota",
    render: (cn) => (
      <span className="font-mono font-semibold text-[var(--primary)]">
        {cn.number}
      </span>
    ),
  },
  {
    key: "invoiceId",
    header: "# Factura",
    render: (cn) => (
      <span className="font-mono text-xs text-[var(--muted-foreground)]">
        {cn.invoiceId.slice(0, 8)}...
      </span>
    ),
  },
  {
    key: "reason",
    header: "Motivo",
    render: (cn) => cn.reason || "—",
  },
  {
    key: "amount",
    header: "Monto",
    render: (cn) => (
      <span className="font-semibold font-mono">{formatCurrency(cn.amount)}</span>
    ),
    className: "text-right",
  },
  {
    key: "status",
    header: "Estado",
    render: (cn) => <StatusBadge status={cn.status} />,
  },
  {
    key: "createdAt",
    header: "Fecha",
    render: (cn) => formatDate(cn.createdAt),
  },
];

export default function CreditNotesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useCreditNotes(page, 20);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Notas de Credito"
        description="Notas de credito emitidas contra facturas"
      />

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las notas de credito.
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
            emptyMessage="No se encontraron notas de credito"
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}
    </motion.div>
  );
}
