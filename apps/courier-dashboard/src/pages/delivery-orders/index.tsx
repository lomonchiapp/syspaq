import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@syspaq/ui";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate, formatDateTime } from "@syspaq/ui";
import { useDeliveryOrders } from "@/hooks/use-api";
import type { DeliveryOrder } from "@/types/api";

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    PICKUP: "bg-cyan-500/15 text-cyan-400",
    HOME_DELIVERY: "bg-indigo-500/15 text-indigo-400",
    BRANCH_TRANSFER: "bg-amber-500/15 text-amber-400",
  };
  const labels: Record<string, string> = {
    PICKUP: "Retiro",
    HOME_DELIVERY: "Domicilio",
    BRANCH_TRANSFER: "Transferencia",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colors[type] ?? "bg-gray-500/15 text-gray-400",
      )}
    >
      {labels[type] ?? type}
    </span>
  );
}

const columns: Column<DeliveryOrder>[] = [
  {
    key: "number",
    header: "# Orden",
    render: (d) => (
      <span className="font-mono font-semibold text-[var(--primary)]">
        {d.number}
      </span>
    ),
  },
  {
    key: "deliveryType",
    header: "Tipo",
    render: (d) => <TypeBadge type={d.deliveryType} />,
  },
  {
    key: "driverName",
    header: "Driver",
    render: (d) => d.driverName || "—",
  },
  {
    key: "status",
    header: "Estado",
    render: (d) => <StatusBadge status={d.status} />,
  },
  {
    key: "scheduledAt",
    header: "Programado",
    render: (d) => (d.scheduledAt ? formatDateTime(d.scheduledAt) : "—"),
  },
  {
    key: "deliveredAt",
    header: "Entregado",
    render: (d) => (d.deliveredAt ? formatDateTime(d.deliveredAt) : "—"),
  },
];

export default function DeliveryOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useDeliveryOrders(page, 20, search);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Ordenes de Entrega"
        description="Ultima milla y entregas"
      >
        <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90">
          <Plus className="h-4 w-4" />
          Nueva Orden
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por numero de orden o driver..."
          className="w-full max-w-sm"
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las ordenes de entrega.
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
            emptyMessage="No se encontraron ordenes de entrega"
            onRowClick={(d) => console.log("Navigate to /delivery-orders/" + d.id)}
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
