import { useLocation } from "react-router-dom";
import { Sun, Moon, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
import { cn } from "@syspaq/ui";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analytics": "Analytics",
  "/customers": "Clientes",
  "/shipments": "Envíos",
  "/pre-alerts": "Pre-Alertas",
  "/receptions": "Recepciones",
  "/post-alerts": "Post-Alertas",
  "/containers": "Contenedores",
  "/dga": "DGA",
  "/delivery-orders": "Órdenes de Entrega",
  "/invoices": "Facturas",
  "/payments": "Pagos",
  "/credit-notes": "Notas de Crédito",
  "/branches": "Sucursales",
  "/rate-tables": "Tarifas",
  "/webhooks": "Webhooks",
  "/notifications": "Notificaciones",
  "/ecommerce": "E-commerce",
  "/bulk-import": "Importación Masiva",
  "/settings": "Ajustes",
};

export function Header() {
  const location = useLocation();
  const { role, logout } = useAuthStore();
  const { mode, toggle } = useThemeStore();

  const title = PAGE_TITLES[location.pathname] ?? "Dashboard";

  return (
    <header
      className={cn(
        "h-14 flex items-center justify-between px-6",
        "bg-[var(--card)] border-b border-[var(--border)]"
      )}
    >
      <h1 className="text-lg font-semibold font-display pl-10 lg:pl-0">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-md hover:bg-[var(--muted)] transition-colors"
          title={mode === "dark" ? "Modo Claro" : "Modo Oscuro"}
        >
          {mode === "dark" ? (
            <Sun className="h-4 w-4 text-[var(--muted-foreground)]" />
          ) : (
            <Moon className="h-4 w-4 text-[var(--muted-foreground)]" />
          )}
        </button>

        {/* Role badge */}
        {role && (
          <span
            className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-medium",
              role === "ADMIN"
                ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                : role === "OPERATOR"
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
            )}
          >
            {role}
          </span>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-md hover:bg-[var(--destructive)]/10 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
