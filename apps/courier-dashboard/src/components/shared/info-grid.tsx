import type { ReactNode } from "react";
import { cn } from "@syspaq/ui";

interface InfoItem {
  label: string;
  value: ReactNode;
}

interface InfoGridProps {
  items: InfoItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const colsMap = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
};

export function InfoGrid({ items, columns = 2, className }: InfoGridProps) {
  return (
    <div className={cn("grid gap-4", colsMap[columns], className)}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
            {item.label}
          </dt>
          <dd className="text-sm font-medium text-[var(--foreground)]">
            {item.value ?? "—"}
          </dd>
        </div>
      ))}
    </div>
  );
}
