import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Inbox, Clock, CheckCircle2, Timer } from "lucide-react";
import { cn, formatDate } from "@syspaq/ui";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useTickets, useTicketStats } from "@/hooks/use-api";
import { CreateTicketDialog } from "./create-ticket-dialog";
import type { Ticket } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Priority badge                                                     */
/* ------------------------------------------------------------------ */

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-500/15 text-gray-400",
  MEDIUM: "bg-blue-500/15 text-blue-400",
  HIGH: "bg-amber-500/15 text-amber-400",
  URGENT: "bg-red-500/15 text-red-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

function PriorityBadge({ priority }: { priority: string }) {
  const colors = PRIORITY_COLORS[priority] ?? "bg-gray-500/15 text-gray-400";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", colors)}>
      {priority === "URGENT" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Category badge                                                     */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<string, string> = {
  SHIPMENT_ISSUE: "Envio",
  BILLING: "Facturacion",
  DAMAGE: "Dano",
  LOST_PACKAGE: "Perdido",
  GENERAL: "General",
  OTHER: "Otro",
};

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Status tabs                                                        */
/* ------------------------------------------------------------------ */

const STATUS_TABS = [
  { value: "", label: "Todos" },
  { value: "OPEN", label: "Abiertos" },
  { value: "IN_PROGRESS", label: "En Progreso" },
  { value: "WAITING_CUSTOMER", label: "Esperando Cliente" },
  { value: "RESOLVED", label: "Resueltos" },
  { value: "CLOSED", label: "Cerrados" },
];

const PRIORITY_FILTER_OPTIONS = [
  { value: "", label: "Todas las prioridades" },
  { value: "LOW", label: "Baja" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

/* ------------------------------------------------------------------ */
/*  Columns                                                            */
/* ------------------------------------------------------------------ */

const columns: Column<Ticket>[] = [
  {
    key: "number",
    header: "Numero",
    render: (t) => (
      <span className="font-mono font-semibold text-[var(--primary)]">{t.number}</span>
    ),
  },
  {
    key: "subject",
    header: "Asunto",
    render: (t) => (
      <span className="max-w-[240px] truncate block" title={t.subject}>
        {t.subject}
      </span>
    ),
  },
  {
    key: "customer",
    header: "Cliente",
    render: (t) =>
      t.customer ? (
        <div className="min-w-0">
          <p className="text-sm truncate">{t.customer.firstName} {t.customer.lastName}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{t.customer.casillero}</p>
        </div>
      ) : (
        <span className="text-[var(--muted-foreground)]">--</span>
      ),
  },
  {
    key: "category",
    header: "Categoria",
    render: (t) => <CategoryBadge category={t.category} />,
  },
  {
    key: "priority",
    header: "Prioridad",
    render: (t) => <PriorityBadge priority={t.priority} />,
  },
  {
    key: "status",
    header: "Estado",
    render: (t) => <StatusBadge status={t.status} />,
  },
  {
    key: "createdAt",
    header: "Fecha",
    render: (t) => (
      <span className="text-[var(--muted-foreground)] text-xs whitespace-nowrap">
        {formatDate(t.createdAt)}
      </span>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TicketsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useTickets(page, 20, statusFilter, priorityFilter);
  const { data: stats } = useTicketStats();

  const tickets = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader title="Tickets de Soporte" description="Gestiona las consultas y problemas de clientes">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
          Nuevo Ticket
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={<Inbox className="h-5 w-5 text-blue-400" />}
            label="Abiertos"
            value={stats.openCount}
            color="blue"
          />
          <KpiCard
            icon={<Clock className="h-5 w-5 text-cyan-400" />}
            label="En Progreso"
            value={stats.byStatus?.IN_PROGRESS ?? 0}
            color="cyan"
          />
          <KpiCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            label="Resueltos este mes"
            value={stats.resolvedThisMonth}
            color="emerald"
          />
          <KpiCard
            icon={<Timer className="h-5 w-5 text-amber-400" />}
            label="Tiempo Prom. Resolucion"
            value={`${(stats.avgResolutionHours ?? 0).toFixed(1)}h`}
            color="amber"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl bg-[var(--muted)]/50 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                statusFilter === tab.value
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-44">
          <Select
            options={PRIORITY_FILTER_OPTIONS}
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        emptyMessage="No se encontraron tickets"
        onRowClick={(t) => navigate(`/tickets/${t.id}`)}
      />

      {meta && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}

      <CreateTicketDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", `bg-${color}-500/15`)}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold font-display">{value}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        </div>
      </div>
    </div>
  );
}
