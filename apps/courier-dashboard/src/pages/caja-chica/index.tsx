import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Vault } from "lucide-react";
import { cn, formatCurrency, formatDate, formatDateTime } from "@syspaq/ui";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCajaChicaSummary, useCajaChicaSessions } from "@/hooks/use-api";
import { OpenSessionDialog } from "./open-session-dialog";
import type { CajaChicaSession, CajaChicaBranchSummary } from "@/types/api";

const sessionColumns: Column<CajaChicaSession>[] = [
  {
    key: "branch",
    header: "Sucursal",
    render: (s) => (
      <span className="font-semibold">
        {s.branch?.name ?? "—"}
        {s.branch?.code && (
          <span className="ml-1.5 text-[var(--muted-foreground)] font-mono text-xs">
            ({s.branch.code})
          </span>
        )}
      </span>
    ),
  },
  {
    key: "status",
    header: "Estado",
    render: (s) => <StatusBadge status={s.status} />,
  },
  {
    key: "openingBalance",
    header: "Balance Apertura",
    render: (s) => formatCurrency(s.openingBalance, s.currency),
    className: "text-right",
  },
  {
    key: "closingBalance",
    header: "Balance Cierre",
    render: (s) => (
      <span className={cn(s.closingBalance != null ? "font-semibold" : "text-[var(--muted-foreground)]")}>
        {s.closingBalance != null ? formatCurrency(s.closingBalance, s.currency) : "—"}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "openedAt",
    header: "Fecha Apertura",
    render: (s) => formatDateTime(s.openedAt),
  },
  {
    key: "closedAt",
    header: "Fecha Cierre",
    render: (s) => (
      <span className={cn(!s.closedAt && "text-[var(--muted-foreground)]")}>
        {s.closedAt ? formatDateTime(s.closedAt) : "—"}
      </span>
    ),
  },
];

function BranchSummaryCard({
  summary,
  onViewSession,
}: {
  summary: CajaChicaBranchSummary;
  onViewSession: (id: string) => void;
}) {
  const isOpen = summary.hasOpenSession;

  return (
    <div
      className={cn(
        "rounded-xl border bg-[var(--card)] p-5 transition-all duration-200 hover:shadow-md",
        isOpen
          ? "border-emerald-500/40 shadow-emerald-500/5"
          : "border-[var(--border)]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              isOpen
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-[var(--muted)] text-[var(--muted-foreground)]",
            )}
          >
            <Vault className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{summary.branchName}</h3>
            <p className="text-xs text-[var(--muted-foreground)] font-mono">{summary.branchCode}</p>
          </div>
        </div>
        <StatusBadge status={isOpen ? "ACTIVE" : "INACTIVE"} />
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-xs text-[var(--muted-foreground)] mb-1">Balance Actual</p>
        <p
          className={cn(
            "text-2xl font-bold font-mono",
            isOpen ? "text-emerald-400" : "text-[var(--muted-foreground)]",
          )}
        >
          {formatCurrency(summary.currentBalance, summary.currency)}
        </p>
        {summary.openedAt && (
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Abierta: {formatDate(summary.openedAt)}
          </p>
        )}
      </div>

      {/* Actions */}
      {isOpen && summary.sessionId && (
        <button
          onClick={() => onViewSession(summary.sessionId!)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
        >
          <Eye className="h-4 w-4" />
          Ver Sesion
        </button>
      )}
    </div>
  );
}

export default function CajaChicaPage() {
  const [page, setPage] = useState(1);
  const [showOpen, setShowOpen] = useState(false);
  const navigate = useNavigate();

  const { data: summaryData, isLoading: summaryLoading } = useCajaChicaSummary();
  const { data: sessionsData, isLoading: sessionsLoading, isError, refetch } = useCajaChicaSessions(page, 20);

  const summaries = summaryData?.data ?? [];

  return (
    <div>
      <PageHeader title="Caja Chica" description="Gestion de efectivo por sucursal">
        <button
          onClick={() => setShowOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Abrir Sesion
        </button>
      </PageHeader>

      {/* Summary cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="animate-pulse space-y-3">
                <div className="h-10 w-10 rounded-xl bg-[var(--muted)]" />
                <div className="h-4 w-24 rounded bg-[var(--muted)]" />
                <div className="h-8 w-32 rounded bg-[var(--muted)]" />
              </div>
            </div>
          ))}
        </div>
      ) : summaries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {summaries.map((s) => (
            <BranchSummaryCard
              key={s.branchId}
              summary={s}
              onViewSession={(id) => navigate(`/caja-chica/${id}`)}
            />
          ))}
        </div>
      ) : null}

      {/* Sessions table */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold font-display">Historial de Sesiones</h2>
        <p className="text-sm text-[var(--muted-foreground)]">Todas las sesiones de caja chica</p>
      </div>

      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las sesiones.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isError && (
        <>
          <DataTable
            columns={sessionColumns}
            data={sessionsData?.data ?? []}
            isLoading={sessionsLoading}
            emptyMessage="No se encontraron sesiones de caja"
            onRowClick={(s) => navigate(`/caja-chica/${s.id}`)}
          />
          <Pagination
            page={page}
            totalPages={sessionsData?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <OpenSessionDialog open={showOpen} onClose={() => setShowOpen(false)} />
    </div>
  );
}
