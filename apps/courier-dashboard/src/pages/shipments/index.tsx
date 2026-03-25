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
import { useShipments } from "@/hooks/use-api";
import { CreateShipmentDialog } from "./create-shipment-dialog";
import type { Shipment } from "@/types/api";

const PHASE_TABS = [
  { label: "Todos", value: "" },
  { label: "En Transito", value: "IN_TRANSIT" },
  { label: "Entregados", value: "DELIVERED" },
  { label: "Excepciones", value: "EXCEPTION" },
] as const;

const columns: Column<Shipment>[] = [
  {
    key: "trackingNumber",
    header: "Tracking #",
    render: (s) => (
      <span className="font-mono font-semibold text-[var(--primary)]">
        {s.trackingNumber}
      </span>
    ),
  },
  {
    key: "reference",
    header: "Referencia",
    render: (s) => s.reference || "—",
  },
  {
    key: "currentPhase",
    header: "Fase",
    render: (s) => <StatusBadge status={s.currentPhase} />,
  },
  {
    key: "eventCount",
    header: "Eventos",
    render: (s) => (
      <span className="text-[var(--muted-foreground)]">{s.eventCount ?? 0}</span>
    ),
    className: "text-center",
  },
  {
    key: "createdAt",
    header: "Creado",
    render: (s) => formatDate(s.createdAt),
  },
];

export default function ShipmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useShipments(page, 20, search, phase);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePhaseChange = (value: string) => {
    setPhase(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Envios" description="Gestion de envios y tracking">
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nuevo Envio
        </button>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por tracking o referencia..."
          className="w-full max-w-sm"
        />

        {/* Phase tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
          {PHASE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handlePhaseChange(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                phase === tab.value
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar los envios.
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
            emptyMessage="No se encontraron envios"
            onRowClick={(s) => navigate(`/shipments/${s.id}`)}
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateShipmentDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
