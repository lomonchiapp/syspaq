import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { cn } from "@syspaq/ui";
import { api } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@syspaq/ui";
import { CreateVoyageDialog } from "./create-voyage-dialog";

/* ------------------------------------------------------------------ */
/*  Inline hook                                                        */
/* ------------------------------------------------------------------ */

function useVoyages(page: number, limit: number, search: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  return useQuery({
    queryKey: ["voyages", page, limit, search],
    queryFn: () => api.get<any>(`/v1/voyages?${params}`),
  });
}

/* ------------------------------------------------------------------ */
/*  Mode badge                                                         */
/* ------------------------------------------------------------------ */

function ModeBadge({ mode }: { mode: string }) {
  const isSea = mode === "SEA";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isSea
          ? "bg-blue-500/15 text-blue-400"
          : "bg-violet-500/15 text-violet-400",
      )}
    >
      {isSea ? "Maritimo" : "Aereo"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Columns                                                            */
/* ------------------------------------------------------------------ */

interface Voyage {
  id: string;
  number: string;
  mode: string;
  carrier?: string;
  masterAwb?: string;
  status: string;
  containerCount?: number;
  createdAt: string;
}

const columns: Column<Voyage>[] = [
  {
    key: "number",
    header: "Numero",
    render: (v) => (
      <span className="font-mono font-semibold text-[var(--primary)]">
        {v.number}
      </span>
    ),
  },
  {
    key: "mode",
    header: "Modo",
    render: (v) => <ModeBadge mode={v.mode} />,
  },
  {
    key: "carrier",
    header: "Carrier",
    render: (v) => v.carrier || "\u2014",
  },
  {
    key: "masterAwb",
    header: "Master AWB",
    render: (v) => v.masterAwb ? (
      <span className="font-mono text-xs">{v.masterAwb}</span>
    ) : "\u2014",
  },
  {
    key: "status",
    header: "Estado",
    render: (v) => <StatusBadge status={v.status} />,
  },
  {
    key: "containerCount",
    header: "Contenedores",
    render: (v) => v.containerCount ?? 0,
    className: "text-right",
  },
  {
    key: "createdAt",
    header: "Fecha",
    render: (v) => formatDate(v.createdAt),
  },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function VoyagesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useVoyages(page, 20, search);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Embarcaciones"
        description="Viajes maritimos y aereos"
      >
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nueva Embarcacion
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por numero, carrier o AWB..."
          className="w-full max-w-sm"
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las embarcaciones.
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
            emptyMessage="No se encontraron embarcaciones"
            onRowClick={(v) => navigate(`/voyages/${v.id}`)}
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateVoyageDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
