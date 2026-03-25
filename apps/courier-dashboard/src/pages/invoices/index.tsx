import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@syspaq/ui";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@syspaq/ui";
import { useInvoices } from "@/hooks/use-api";
import { CreateInvoiceDialog } from "./create-invoice-dialog";
import type { Invoice } from "@/types/api";

const columns: Column<Invoice>[] = [
  {
    key: "number",
    header: "# Factura",
    render: (i) => (
      <span className="font-mono font-semibold text-[var(--primary)]">
        {i.number}
      </span>
    ),
  },
  {
    key: "customerId",
    header: "Cliente",
    render: (i) => (
      <span className="text-[var(--muted-foreground)]">
        {i.customerId.slice(0, 8)}...
      </span>
    ),
  },
  {
    key: "subtotal",
    header: "Subtotal",
    render: (i) => formatCurrency(i.subtotal, i.currency),
    className: "text-right",
  },
  {
    key: "taxTotal",
    header: "Impuestos",
    render: (i) => formatCurrency(i.taxTotal, i.currency),
    className: "text-right",
  },
  {
    key: "total",
    header: "Total",
    render: (i) => (
      <span className="font-semibold">{formatCurrency(i.total, i.currency)}</span>
    ),
    className: "text-right",
  },
  {
    key: "amountPaid",
    header: "Pagado",
    render: (i) => (
      <span className="text-emerald-400">
        {formatCurrency(i.amountPaid, i.currency)}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "balance",
    header: "Balance",
    render: (i) => (
      <span className={cn("font-semibold", i.balance > 0 && "text-red-400")}>
        {formatCurrency(i.balance, i.currency)}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "status",
    header: "Estado",
    render: (i) => <StatusBadge status={i.status} />,
  },
  {
    key: "createdAt",
    header: "Fecha",
    render: (i) => formatDate(i.issuedAt ?? i.createdAt),
  },
];

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useInvoices(page, 20, search);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Facturas" description="Facturacion y cobros">
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nueva Factura
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por numero de factura o cliente..."
          className="w-full max-w-sm"
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las facturas.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Table */}
      {!isError && (
        <>
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            emptyMessage="No se encontraron facturas"
            onRowClick={(i) => navigate(`/invoices/${i.id}`)}
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateInvoiceDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
