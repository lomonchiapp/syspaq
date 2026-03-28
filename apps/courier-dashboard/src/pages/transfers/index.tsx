import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeftRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn, formatDate } from "@syspaq/ui";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { api } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/api";
import { CreateTransferDialog } from "./create-transfer-dialog";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Transfer {
  id: string;
  number: string;
  type: string;
  status: string;
  originBranchId: string;
  destBranchId: string;
  originBranch?: { id: string; name: string; code: string };
  destBranch?: { id: string; name: string; code: string };
  totalPieces: number;
  totalWeightLbs?: number;
  notes?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Inline hook                                                        */
/* ------------------------------------------------------------------ */

function useTransfers(page: number, limit: number, search: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return useQuery({
    queryKey: ["transfers", page, limit, search],
    queryFn: () => api.get<PaginatedResponse<Transfer>>(`/v1/transfers?${params}`),
  });
}

/* ------------------------------------------------------------------ */
/*  Type badge                                                         */
/* ------------------------------------------------------------------ */

function TypeBadge({ type }: { type: string }) {
  const isOutbound = type === "OUTBOUND";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isOutbound
          ? "bg-blue-500/15 text-blue-400"
          : "bg-emerald-500/15 text-emerald-400",
      )}
    >
      {isOutbound ? "Salida" : "Entrada"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Transfer status badge                                              */
/* ------------------------------------------------------------------ */

const TRANSFER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400",
  DISPATCHED: "bg-blue-500/15 text-blue-400",
  IN_TRANSIT: "bg-orange-500/15 text-orange-400",
  RECEIVED: "bg-emerald-500/15 text-emerald-400",
  CANCELLED: "bg-red-500/15 text-red-400",
};

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  DISPATCHED: "Despachado",
  IN_TRANSIT: "En Transito",
  RECEIVED: "Recibido",
  CANCELLED: "Cancelado",
};

function TransferStatusBadge({ status }: { status: string }) {
  const colors = TRANSFER_STATUS_COLORS[status] ?? "bg-gray-500/15 text-gray-400";
  const label = TRANSFER_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colors,
      )}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Columns                                                            */
/* ------------------------------------------------------------------ */

const columns: Column<Transfer>[] = [
  {
    key: "number",
    header: "Numero",
    render: (t) => (
      <span className="font-mono font-semibold text-[var(--primary)]">
        {t.number}
      </span>
    ),
  },
  {
    key: "type",
    header: "Tipo",
    render: (t) => <TypeBadge type={t.type} />,
  },
  {
    key: "route",
    header: "Ruta",
    render: (t) => (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span className="font-semibold">{t.originBranch?.code ?? "—"}</span>
        <ArrowLeftRight className="h-3 w-3 text-[var(--muted-foreground)]" />
        <span className="font-semibold">{t.destBranch?.code ?? "—"}</span>
      </span>
    ),
  },
  {
    key: "status",
    header: "Estado",
    render: (t) => <TransferStatusBadge status={t.status} />,
  },
  {
    key: "totalPieces",
    header: "Piezas",
    render: (t) => t.totalPieces.toLocaleString(),
    className: "text-right",
  },
  {
    key: "totalWeightLbs",
    header: "Peso (lbs)",
    render: (t) =>
      t.totalWeightLbs != null ? `${Number(t.totalWeightLbs).toFixed(2)}` : "—",
    className: "text-right",
  },
  {
    key: "createdAt",
    header: "Fecha",
    render: (t) => formatDate(t.createdAt),
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function TransfersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useTransfers(page, 20, search);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Transferencias"
        description="Movimientos de paquetes entre sucursales"
      >
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nueva Transferencia
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por numero o sucursal..."
          className="w-full max-w-sm"
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las transferencias.
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
            emptyMessage="No se encontraron transferencias"
            onRowClick={(t) => navigate(`/transfers/${t.id}`)}
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateTransferDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
