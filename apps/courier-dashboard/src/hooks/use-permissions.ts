import { useAuthStore } from "@/stores/auth.store";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    "dashboard", "customers", "shipments", "pre-alerts", "receptions",
    "invoices", "payments", "containers", "dga", "delivery-orders",
    "branches", "rate-tables", "analytics", "webhooks", "notifications",
    "ecommerce", "bulk-import", "settings", "post-alerts", "credit-notes",
    "caja-chica", "fleet", "fiscal", "tickets",
  ],
  OPERATOR: [
    "dashboard", "customers", "shipments", "pre-alerts", "receptions",
    "invoices", "payments", "containers", "dga", "delivery-orders",
    "branches", "analytics", "post-alerts", "caja-chica", "fleet", "tickets",
  ],
  INTEGRATION: ["dashboard", "shipments", "analytics"],
};

export function usePermissions() {
  const role = useAuthStore((s) => s.role) ?? "INTEGRATION";
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin) ?? false;
  const allowed = ROLE_PERMISSIONS[role] ?? [];

  return {
    role,
    isSuperAdmin,
    canAccess: (page: string) => allowed.includes(page),
    canManageUsers: role === "ADMIN",
    canManageConfig: role === "ADMIN",
    canManageBilling: role === "ADMIN" || role === "OPERATOR",
    canImport: role === "ADMIN",
    pages: allowed,
  };
}
