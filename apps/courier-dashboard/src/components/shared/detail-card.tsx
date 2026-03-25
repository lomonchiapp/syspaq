import type { ReactNode } from "react";
import { cn } from "@syspaq/ui";

interface DetailCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DetailCard({ title, icon, children, actions, className }: DetailCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {icon && (
            <span className="text-[var(--primary)]">{icon}</span>
          )}
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Body */}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
