import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency, cn } from "@syspaq/ui";
import { useFiscalAging } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";
import type { AgingBucket } from "@/types/api";

function AmountCell({ value, variant }: { value: number; variant?: "green" | "yellow" | "orange" | "red" }) {
  const colorMap = {
    green: "text-emerald-400",
    yellow: "text-amber-400",
    orange: "text-orange-400",
    red: "text-red-400",
  };
  const color = variant && value > 0 ? colorMap[variant] : "";
  return (
    <span className={cn("font-mono text-sm", color)}>
      {formatCurrency(value)}
    </span>
  );
}

export default function FiscalAgingPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useFiscalAging();

  const rows = data?.data ?? [];
  const totals = data?.totals;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Aging de Cuentas por Cobrar"
        description="Analisis de deudas por antiguedad de clientes"
      />

      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudo cargar el reporte de aging.
          </p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      )}

      {!isError && (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)]/50">
                  <th className="sticky top-0 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Cliente
                  </th>
                  <th className="sticky top-0 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Casillero
                  </th>
                  <th className="sticky top-0 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Corriente
                  </th>
                  <th className="sticky top-0 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-amber-400">
                    1-30 dias
                  </th>
                  <th className="sticky top-0 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-orange-400">
                    31-60 dias
                  </th>
                  <th className="sticky top-0 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-red-400">
                    61-90 dias
                  </th>
                  <th className="sticky top-0 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-red-500">
                    90+ dias
                  </th>
                  <th className="sticky top-0 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!isLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-[var(--muted-foreground)]">
                      No se encontraron cuentas por cobrar
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  rows.map((row: AgingBucket) => (
                    <tr
                      key={row.customerId}
                      onClick={() => navigate(`/customers/${row.customerId}`)}
                      className="border-t border-[var(--border)] cursor-pointer hover:bg-[var(--muted)]/50 transition-colors even:bg-[var(--muted)]/30"
                    >
                      <td className="px-4 py-3 font-medium">{row.customerName}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-[var(--primary)]">{row.casillero}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AmountCell value={row.current} variant="green" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AmountCell value={row.days30} variant="yellow" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AmountCell value={row.days60} variant="orange" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AmountCell value={row.days90} variant="red" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AmountCell value={row.days90Plus} variant="red" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-semibold">{formatCurrency(row.total)}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>

              {/* Totals footer */}
              {totals && !isLoading && (
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)] bg-[var(--muted)]/60 font-semibold">
                    <td className="px-4 py-3" colSpan={2}>
                      Totales
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AmountCell value={totals.current} variant="green" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AmountCell value={totals.days30} variant="yellow" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AmountCell value={totals.days60} variant="orange" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AmountCell value={totals.days90} variant="red" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AmountCell value={totals.days90Plus} variant="red" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-bold">{formatCurrency(totals.total)}</span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
