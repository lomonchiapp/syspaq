import { useState } from "react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@syspaq/ui";
import { useFiscalSequences } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { CreateSequenceDialog } from "./create-sequence-dialog";
import { Plus } from "lucide-react";
import type { FiscalSequence } from "@/types/api";

const NCF_TYPE_LABELS: Record<string, string> = {
  B01: "Credito Fiscal",
  B02: "Consumo",
  B04: "Notas de Credito",
  B14: "Regimen Especial",
  B15: "Gubernamental",
};

function isExpired(validUntil: string) {
  return new Date(validUntil) < new Date();
}

const columns: Column<FiscalSequence>[] = [
  {
    key: "type",
    header: "Tipo",
    render: (seq) => (
      <div>
        <span className="font-mono font-semibold text-[var(--primary)]">{seq.type}</span>
        <span className="ml-2 text-xs text-[var(--muted-foreground)]">
          {NCF_TYPE_LABELS[seq.type] ?? ""}
        </span>
      </div>
    ),
  },
  {
    key: "prefix",
    header: "Prefijo",
    render: (seq) => <span className="font-mono text-sm">{seq.prefix}</span>,
  },
  {
    key: "currentNumber",
    header: "Numero Actual",
    render: (seq) => <span className="font-mono">{seq.currentNumber}</span>,
    className: "text-right",
  },
  {
    key: "authorizationNumber",
    header: "Autorizacion",
    render: (seq) => seq.authorizationNumber || "—",
  },
  {
    key: "validFrom",
    header: "Valido Desde",
    render: (seq) => formatDate(seq.validFrom),
  },
  {
    key: "validUntil",
    header: "Valido Hasta",
    render: (seq) => formatDate(seq.validUntil),
  },
  {
    key: "isActive",
    header: "Estado",
    render: (seq) => {
      if (!seq.isActive) return <StatusBadge status="INACTIVE" />;
      if (isExpired(seq.validUntil)) return <StatusBadge status="EXPIRED" />;
      return <StatusBadge status="ACTIVE" />;
    },
  },
];

export default function FiscalSequencesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useFiscalSequences();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader title="Secuencias NCF" description="Secuencias de comprobantes fiscales autorizados por la DGII">
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDialogOpen(true)}>
          Nueva Secuencia
        </Button>
      </PageHeader>

      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las secuencias.
          </p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      )}

      {!isError && (
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          emptyMessage="No se encontraron secuencias NCF"
        />
      )}

      <CreateSequenceDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </motion.div>
  );
}
