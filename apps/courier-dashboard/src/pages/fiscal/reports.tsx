import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { PageHeader } from "@/components/shared/page-header";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/shared/data-table";
import { formatCurrency, formatDate } from "@syspaq/ui";
import { useFiscalReport607 } from "@/hooks/use-api";
import { FileText, ShoppingBag } from "lucide-react";

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

interface Report607Row {
  rnc: string;
  ncf: string;
  fecha: string;
  monto: number;
  itbis: number;
}

const report607Columns: Column<Report607Row>[] = [
  { key: "rnc", header: "RNC" },
  {
    key: "ncf",
    header: "NCF",
    render: (r) => <span className="font-mono text-sm">{r.ncf}</span>,
  },
  {
    key: "fecha",
    header: "Fecha",
    render: (r) => formatDate(r.fecha),
  },
  {
    key: "monto",
    header: "Monto",
    render: (r) => <span className="font-mono">{formatCurrency(r.monto)}</span>,
    className: "text-right",
  },
  {
    key: "itbis",
    header: "ITBIS",
    render: (r) => <span className="font-mono">{formatCurrency(r.itbis)}</span>,
    className: "text-right",
  },
];

export default function FiscalReportsPage() {
  const periodOptions = useMemo(() => buildPeriodOptions(), []);
  const [period, setPeriod] = useState(periodOptions[0]?.value ?? "");
  const [generate607, setGenerate607] = useState(false);

  const { data: report607, isLoading: loading607 } = useFiscalReport607(
    generate607 ? period : "",
  );

  const report607Rows: Report607Row[] = useMemo(() => {
    if (!report607?.data) return [];
    const raw = report607.data as Record<string, unknown>[];
    if (!Array.isArray(raw)) return [];
    return raw.map((r: any) => ({
      rnc: r.rnc ?? "",
      ncf: r.ncf ?? "",
      fecha: r.fecha ?? r.date ?? "",
      monto: r.monto ?? r.amount ?? 0,
      itbis: r.itbis ?? r.tax ?? 0,
    }));
  }, [report607]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader title="Reportes Fiscales" description="Genera los reportes 606 y 607 requeridos por la DGII">
        <Select
          options={periodOptions}
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setGenerate607(false);
          }}
          className="w-48"
        />
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 607 Card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500/15">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold">Reporte 607 - Ventas</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Detalle de comprobantes de ingresos
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Genera el formato 607 con todas las facturas emitidas durante el periodo seleccionado,
            incluyendo RNC, NCF, montos e ITBIS.
          </p>
          <Button
            onClick={() => setGenerate607(true)}
            isLoading={loading607}
            leftIcon={<FileText className="h-4 w-4" />}
          >
            Generar 607
          </Button>
        </div>

        {/* 606 Card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/15">
              <ShoppingBag className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold">Reporte 606 - Compras</h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Detalle de comprobantes de costos y gastos
              </p>
            </div>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Genera el formato 606 con las compras y gastos registrados durante el periodo seleccionado.
          </p>
          <Button variant="outline" leftIcon={<ShoppingBag className="h-4 w-4" />} disabled>
            Proximamente
          </Button>
        </div>
      </div>

      {/* 607 Results */}
      {generate607 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
            Resultado 607 — {period}
          </h3>
          <DataTable
            columns={report607Columns}
            data={report607Rows}
            isLoading={loading607}
            emptyMessage="No se encontraron registros para este periodo"
          />
        </div>
      )}
    </motion.div>
  );
}
