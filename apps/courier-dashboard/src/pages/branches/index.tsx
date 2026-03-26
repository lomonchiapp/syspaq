import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { useBranches, useDeleteBranch } from "@/hooks/use-api";
import type { Branch } from "@/types/api";
import { CreateBranchDialog } from "./create-branch-dialog";

export default function BranchesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError, refetch } = useBranches(page, 20, search);
  const deleteBranch = useDeleteBranch();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = (branch: Branch) => {
    if (confirm(`Eliminar sucursal "${branch.name}"?`)) {
      deleteBranch.mutate(branch.id);
    }
  };

  const columns: Column<Branch>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (b) => <span className="font-semibold">{b.name}</span>,
    },
    {
      key: "code",
      header: "Codigo",
      render: (b) => (
        <span className="font-mono text-[var(--muted-foreground)]">{b.code}</span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      render: (b) => b.type,
    },
    {
      key: "isActive",
      header: "Estado",
      render: (b) => <StatusBadge status={b.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "",
      render: (b) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log("Edit branch", b.id);
            }}
            className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/60 transition-colors"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(b);
            }}
            className="rounded-md p-1.5 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: "w-24",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sucursales"
        description="Bodegas y puntos de retiro"
      >
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nueva Sucursal
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por nombre o codigo..."
          className="w-full max-w-sm"
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las sucursales.
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
            emptyMessage="No se encontraron sucursales"
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateBranchDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
