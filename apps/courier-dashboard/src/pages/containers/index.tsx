import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@syspaq/ui";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@syspaq/ui";
import { useContainers } from "@/hooks/use-api";
import type { Container } from "@/types/api";
import { CreateContainerDialog } from "./create-container-dialog";

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

const columns: Column<Container>[] = [
  {
    key: "number",
    header: "Numero",
    render: (c) => (
      <span className="font-mono font-semibold text-[var(--primary)]">
        {c.number}
      </span>
    ),
  },
  {
    key: "type",
    header: "Tipo",
    render: (c) => c.type,
  },
  {
    key: "mode",
    header: "Modo",
    render: (c) => <ModeBadge mode={c.mode} />,
  },
  {
    key: "status",
    header: "Estado",
    render: (c) => <StatusBadge status={c.status} />,
  },
  {
    key: "totalPieces",
    header: "Piezas",
    render: (c) => c.totalPieces.toLocaleString(),
    className: "text-right",
  },
  {
    key: "totalWeightLbs",
    header: "Peso (lbs)",
    render: (c) =>
      c.totalWeightLbs != null ? `${Number(c.totalWeightLbs).toFixed(2)}` : "—",
    className: "text-right",
  },
  {
    key: "createdAt",
    header: "Fecha",
    render: (c) => formatDate(c.createdAt),
  },
];

export default function ContainersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useContainers(page, 20, search);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Contenedores"
        description="Consolidacion maritima y aerea"
      >
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuevo Contenedor
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por numero o carrier..."
          className="w-full max-w-sm"
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar los contenedores.
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
            emptyMessage="No se encontraron contenedores"
            onRowClick={(c) => navigate(`/containers/${c.id}`)}
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateContainerDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
