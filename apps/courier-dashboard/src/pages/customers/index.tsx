import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, UserCheck, UserX } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@syspaq/ui";
import { useCustomers } from "@/hooks/use-api";
import { CreateCustomerDialog } from "./create-customer-dialog";
import type { Customer } from "@/types/api";

const columns: Column<Customer>[] = [
  {
    key: "casillero",
    header: "Casillero",
    render: (c) => (
      <span className="font-semibold text-[var(--primary)]">{c.casillero}</span>
    ),
  },
  {
    key: "name",
    header: "Nombre",
    render: (c) => `${c.firstName} ${c.lastName}`,
  },
  {
    key: "email",
    header: "Email",
    render: (c) => (
      <span className="text-[var(--muted-foreground)]">{c.email}</span>
    ),
  },
  {
    key: "phone",
    header: "Telefono",
    render: (c) => c.phone || "—",
  },
  {
    key: "isActive",
    header: "Estado",
    render: (c) => <StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"} />,
  },
  {
    key: "createdAt",
    header: "Fecha",
    render: (c) => formatDate(c.createdAt),
  },
];

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useCustomers(page, 20, search);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Clientes" description="Gestion de clientes y casilleros">
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por nombre, casillero o email..."
          className="w-full max-w-sm"
        />
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar los clientes.
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
            emptyMessage="No se encontraron clientes"
            onRowClick={(c) => navigate(`/customers/${c.id}`)}
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateCustomerDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
