import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@syspaq/ui";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  index?: number;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "var(--primary)",
  index = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
    >
      <div className="flex items-center gap-4">
        {/* Icon circle */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>

        {/* Content */}
        <div className="min-w-0">
          <p className="text-2xl font-bold font-display leading-tight truncate">
            {value}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Trend */}
        {trend && (
          <div
            className={cn(
              "ml-auto flex items-center gap-0.5 text-xs font-semibold shrink-0",
              trend.isPositive ? "text-emerald-400" : "text-red-400",
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
    </motion.div>
  );
}
