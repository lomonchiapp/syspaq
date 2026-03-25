import { cn } from "@syspaq/ui";

const STATUS_COLORS: Record<string, string> = {
  // Shipment phases
  CREATED: "bg-blue-500/15 text-blue-400",
  RECEIVED: "bg-cyan-500/15 text-cyan-400",
  IN_TRANSIT: "bg-amber-500/15 text-amber-400",
  IN_CUSTOMS: "bg-orange-500/15 text-orange-400",
  CLEARED: "bg-teal-500/15 text-teal-400",
  OUT_FOR_DELIVERY: "bg-indigo-500/15 text-indigo-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-400",
  EXCEPTION: "bg-red-500/15 text-red-400",
  RETURNED: "bg-rose-500/15 text-rose-400",
  // Invoice statuses
  DRAFT: "bg-gray-500/15 text-gray-400",
  ISSUED: "bg-blue-500/15 text-blue-400",
  PARTIAL: "bg-amber-500/15 text-amber-400",
  PAID: "bg-emerald-500/15 text-emerald-400",
  OVERDUE: "bg-red-500/15 text-red-400",
  CANCELLED: "bg-gray-500/15 text-gray-400",
  // Delivery
  PENDING: "bg-gray-500/15 text-gray-400",
  ASSIGNED: "bg-blue-500/15 text-blue-400",
  FAILED: "bg-red-500/15 text-red-400",
  // Generic
  ACTIVE: "bg-emerald-500/15 text-emerald-400",
  INACTIVE: "bg-gray-500/15 text-gray-400",
};

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? "bg-gray-500/15 text-gray-400";
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colors,
      )}
    >
      {label}
    </span>
  );
}
