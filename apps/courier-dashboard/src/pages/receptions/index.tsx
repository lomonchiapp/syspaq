import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDateTime } from "@syspaq/ui";
import { useReceptions } from "@/hooks/use-api";
import type { Reception } from "@/types/api";

const columns: Column<Reception>[] = [
  {
    key: "shipmentId",
    header: "Envio",
    render: (r) => (
      <span className="font-mono font-semibold text-[var(--primary)]">
        {r.shipmentId.slice(0, 8)}...
      </span>
    ),
  },
  {
    key: "weightLbs",
    header: "Peso (lbs)",
    render: (r) => (r.weightLbs != null ? `${Number(r.weightLbs).toFixed(2)} lbs` : "—"),
    className: "text-right",
  },
  {
    key: "volumetricWeight",
    header: "Peso Vol.",
    render: (r) =>
      r.volumetricWeight != null ? `${Number(r.volumetricWeight).toFixed(2)}` : "—",
    className: "text-right",
  },
  {
    key: "totalCharge",
    header: "Cargo Total",
    render: (r) => (
      <span className="font-semibold">
        {formatCurrency(r.totalCharge, r.currency)}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "status",
    header: "Estado",
    render: (r) => <StatusBadge status={r.status} />,
  },
  {
    key: "receivedAt",
    header: "Fecha Recepcion",
    render: (r) => formatDateTime(r.receivedAt),
  },
];

export default function ReceptionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useReceptions(page, 20, search);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Recepciones"
        description="Paquetes recibidos en bodega"
      >
        <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90">
          <Plus className="h-4 w-4" />
          Nueva Recepcion
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por envio o sucursal..."
          className="w-full max-w-sm"
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las recepciones.
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
            emptyMessage="No se encontraron recepciones"
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
