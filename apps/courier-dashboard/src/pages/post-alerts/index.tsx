import { useState } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@syspaq/ui";
import { usePostAlerts } from "@/hooks/use-api";
import type { PostAlertItem } from "@/types/api";
import { CreatePostAlertDialog } from "./create-post-alert-dialog";

const columns: Column<PostAlertItem>[] = [
  {
    key: "trackingNumber",
    header: "Tracking #",
    render: (p) => (
      <span className="font-mono font-semibold text-[var(--primary)]">
        {p.trackingNumber}
      </span>
    ),
  },
  {
    key: "recipientName",
    header: "Destinatario",
    render: (p) => p.recipientName || "—",
  },
  {
    key: "senderName",
    header: "Remitente",
    render: (p) => p.senderName || "—",
  },
  {
    key: "carrier",
    header: "Carrier",
    render: (p) => p.carrier || "—",
  },
  {
    key: "fob",
    header: "FOB",
    render: (p) =>
      p.fob != null ? (
        <span className="font-mono">{formatCurrency(p.fob, p.currency)}</span>
      ) : (
        "—"
      ),
    className: "text-right",
  },
  {
    key: "content",
    header: "Contenido",
    render: (p) => (
      <span className="max-w-[200px] truncate block text-[var(--muted-foreground)]">
        {p.content || "—"}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Fecha",
    render: (p) => formatDate(p.createdAt),
  },
];

export default function PostAlertsPage() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError, refetch } = usePostAlerts(page, 20);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Post-Alertas"
        description="Confirmaciones post-entrega"
      >
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nueva Post-Alerta
        </button>
      </PageHeader>

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las post-alertas.
          </p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      )}

      {/* Table */}
      {!isError && (
        <>
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            emptyMessage="No se encontraron post-alertas"
          />
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      )}

      <CreatePostAlertDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </motion.div>
  );
}
