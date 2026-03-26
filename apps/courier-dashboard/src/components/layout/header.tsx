import { useLocation } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@syspaq/ui";
import { useSidebarStore } from "@/stores/sidebar.store";
import { GlobalSearch } from "./global-search";
import { QuickAddMenu } from "./quick-add-menu";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analytics": "Analytics",
  "/customers": "Clientes",
  "/shipments": "Envios",
  "/pre-alerts": "Pre-Alertas",
  "/receptions": "Recepciones",
  "/post-alerts": "Post-Alertas",
  "/containers": "Contenedores",
  "/dga": "DGA",
  "/delivery-orders": "Ordenes de Entrega",
  "/invoices": "Facturas",
  "/payments": "Pagos",
  "/credit-notes": "Notas de Credito",
  "/branches": "Sucursales",
  "/rate-tables": "Tarifas",
  "/webhooks": "Webhooks",
  "/notifications": "Notificaciones",
  "/ecommerce": "E-commerce",
  "/bulk-import": "Importacion Masiva",
  "/settings": "Ajustes",
};

export function Header() {
  const location = useLocation();
  const { collapsed, toggle } = useSidebarStore();
  const title = PAGE_TITLES[location.pathname] ?? "Dashboard";

  return (
    <header
      className={cn(
        "h-14 flex items-center justify-between gap-6 px-4 lg:px-6",
        "bg-[var(--card)] border-b border-[var(--border)]",
      )}
    >
      {/* Left: Collapse toggle + page title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggle}
          className="hidden lg:flex p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        {/* Mobile spacer for hamburger */}
        <div className="w-8 lg:hidden" />

        <h1 className="text-sm font-semibold font-display whitespace-nowrap">
          {title}
        </h1>
      </div>

      {/* Center: Global search */}
      <div className="flex-1 flex justify-center max-w-2xl">
        <GlobalSearch />
      </div>

      {/* Right: Quick add */}
      <div className="shrink-0">
        <QuickAddMenu />
      </div>
    </header>
  );
}
