import { useState } from "react";
import { cn } from "@syspaq/ui";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@syspaq/ui";
import { usePreAlerts } from "@/hooks/use-api";
import type { PreAlert } from "@/types/api";

const columns: Column<PreAlert>[] = [
  {
    key: "trackingNumber",
    header: "Tracking #",
    render: (p) => (
      <span className="font-mono font-semibold">{p.trackingNumber}</span>
    ),
  },
  {
    key: "store",
    header: "Tienda",
    render: (p) => p.store || "—",
  },
  {
    key: "description",
    header: "Descripcion",
    render: (p) => (
      <span className="max-w-[200px] truncate block">
        {p.description || "—"}
      </span>
    ),
  },
  {
    key: "estimatedValue",
    header: "Valor",
    render: (p) =>
      p.estimatedValue != null
        ? formatCurrency(p.estimatedValue, p.currency)
        : "—",
    className: "text-right",
  },
  {
    key: "status",
    header: "Estado",
    render: (p) => <StatusBadge status={p.status} />,
  },
  {
    key: "createdAt",
    header: "Fecha",
    render: (p) => formatDate(p.createdAt),
  },
];

export default function PreAlertsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [unlinkedOnly, setUnlinkedOnly] = useState(false);

  const { data, isLoading, isError, refetch } = usePreAlerts(
    page,
    20,
    search,
    unlinkedOnly,
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Pre-Alertas" description="Paquetes pre-alertados por clientes">
        <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90">
          <Plus className="h-4 w-4" />
          Nueva Pre-Alerta
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por tracking o tienda..."
          className="w-full max-w-sm"
        />

        {/* Tab filter */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
          <button
            onClick={() => { setUnlinkedOnly(false); setPage(1); }}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              !unlinkedOnly
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            Todas
          </button>
          <button
            onClick={() => { setUnlinkedOnly(true); setPage(1); }}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              unlinkedOnly
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            Sin Vincular
          </button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las pre-alertas.
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
            emptyMessage="No se encontraron pre-alertas"
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
