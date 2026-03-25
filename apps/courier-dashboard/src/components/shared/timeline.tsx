import { motion } from "motion/react";
import { cn } from "@syspaq/ui";
import type { ReactNode } from "react";

export interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  date: string;
  icon?: ReactNode;
  color?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const defaultColors: Record<string, string> = {
  CREATED: "bg-blue-400",
  RECEIVED: "bg-cyan-400",
  IN_TRANSIT: "bg-amber-400",
  IN_CUSTOMS: "bg-orange-400",
  CLEARED: "bg-teal-400",
  OUT_FOR_DELIVERY: "bg-indigo-400",
  DELIVERED: "bg-emerald-400",
  EXCEPTION: "bg-red-400",
  RETURNED: "bg-rose-400",
  STATUS_UPDATE: "bg-sky-400",
  CUSTOMS_HOLD: "bg-orange-400",
  PICKUP: "bg-violet-400",
};

export function Timeline({ events, className }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
        <p className="text-sm">No hay eventos registrados</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Connecting line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-[var(--border)]" />

      <div className="space-y-0">
        {events.map((event, idx) => {
          const dotColor = event.color || defaultColors[event.type] || "bg-gray-400";

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* Dot */}
              <div className="relative z-10 mt-1.5 shrink-0">
                <div
                  className={cn(
                    "h-[10px] w-[10px] rounded-full ring-4 ring-[var(--card)]",
                    dotColor,
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1 -mt-0.5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 p-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      dotColor.replace("bg-", "bg-") + "/15",
                      dotColor.replace("bg-", "text-"),
                    )}
                  >
                    {event.type.replace(/_/g, " ")}
                  </span>
                  <time className="text-[11px] text-[var(--muted-foreground)] whitespace-nowrap">
                    {event.date}
                  </time>
                </div>
                <p className="text-sm text-[var(--foreground)]">{event.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
