import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@syspaq/ui";
import { Skeleton } from "@/components/shared/loading-skeleton";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No se encontraron resultados",
  onRowClick,
}: DataTableProps<T>) {
  /* --- Loading state ------------------------------------------------ */
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "sticky top-0 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t border-[var(--border)]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* --- Empty state -------------------------------------------------- */
  if (data.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "sticky top-0 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground)]">
          <PackageOpen className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  /* --- Data --------------------------------------------------------- */
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--muted)]/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "sticky top-0 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIdx) => (
              <tr
                key={(item as any).id ?? rowIdx}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "border-t border-[var(--border)] transition-colors",
                  "even:bg-[var(--muted)]/30",
                  onRowClick && "cursor-pointer hover:bg-[var(--muted)]/50",
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render
                      ? col.render(item)
                      : (item as any)[col.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
