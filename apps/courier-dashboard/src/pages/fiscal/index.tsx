import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@syspaq/ui";
import { useFiscalSummary } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { ListOrdered, FileText, Clock, ArrowRight } from "lucide-react";

function buildPeriodOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-DO", { year: "numeric", month: "long" });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

const NCF_TYPE_LABELS: Record<string, string> = {
  B01: "Credito Fiscal",
  B02: "Consumo",
  B04: "Notas de Credito",
  B14: "Regimen Especial",
  B15: "Gubernamental",
};

const NCF_TYPE_COLORS: Record<string, string> = {
  B01: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  B02: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  B04: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  B14: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  B15: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

export default function FiscalPage() {
  const periodOptions = useMemo(() => buildPeriodOptions(), []);
  const [period, setPeriod] = useState(periodOptions[0]?.value ?? "");

  const { data: summary, isLoading } = useFiscalSummary(period);

  const summaryCards = [
    { label: "Total Ventas", value: summary?.totalSales ?? 0, color: "text-emerald-400" },
    { label: "ITBIS Cobrado", value: summary?.totalITBIS ?? 0, color: "text-blue-400" },
    { label: "Notas de Credito", value: summary?.totalCreditNotes ?? 0, color: "text-amber-400" },
    { label: "Ventas Netas", value: summary?.netSales ?? 0, color: "text-[var(--primary)]" },
  ];

  const ncfEntries = Object.entries(summary?.ncfsByType ?? {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader title="Fiscal" description="Resumen de cumplimiento fiscal y comprobantes">
        <Select
          options={periodOptions}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-48"
        />
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
          >
            <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              {card.label}
            </p>
            {isLoading ? (
              <Skeleton className="h-7 w-28 mt-2" />
            ) : (
              <p className={`text-2xl font-bold font-mono mt-2 ${card.color}`}>
                {formatCurrency(card.value)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* NCFs by type */}
      {ncfEntries.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
            NCFs por Tipo
          </h3>
          <div className="flex flex-wrap gap-3">
            {ncfEntries.map(([type, count]) => (
              <div
                key={type}
                className={`rounded-lg border px-4 py-3 ${NCF_TYPE_COLORS[type] ?? "bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)]"}`}
              >
                <span className="text-lg font-bold font-mono">{count}</span>
                <span className="ml-2 text-sm font-medium">{type}</span>
                <span className="ml-1 text-xs opacity-70">
                  {NCF_TYPE_LABELS[type] ?? ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/fiscal/sequences">
          <div className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--primary)]/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <ListOrdered className="h-5 w-5 text-[var(--primary)]" />
              <h3 className="font-semibold">Secuencias NCF</h3>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Gestiona las secuencias de comprobantes fiscales autorizados por la DGII.
            </p>
            <div className="flex items-center gap-1 mt-3 text-sm text-[var(--primary)] font-medium">
              Ver secuencias <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link to="/fiscal/reports">
          <div className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--primary)]/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold">Reportes 606/607</h3>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Genera los reportes de compras y ventas requeridos por la DGII.
            </p>
            <div className="flex items-center gap-1 mt-3 text-sm text-blue-400 font-medium">
              Generar reportes <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link to="/fiscal/aging">
          <div className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--primary)]/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-amber-400" />
              <h3 className="font-semibold">Aging de Cuentas</h3>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Analisis de cuentas por cobrar por antiguedad de deuda.
            </p>
            <div className="flex items-center gap-1 mt-3 text-sm text-amber-400 font-medium">
              Ver aging <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
