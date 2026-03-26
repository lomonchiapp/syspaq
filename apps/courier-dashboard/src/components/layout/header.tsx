import { useLocation } from "react-router-dom";
import { cn } from "@syspaq/ui";
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
  const title = PAGE_TITLES[location.pathname] ?? "Dashboard";

  return (
    <header
      className={cn(
        "h-14 flex items-center justify-between gap-6 px-4 lg:px-6",
        "bg-[var(--card)] border-b border-[var(--border)]",
      )}
    >
      {/* Left: Page title */}
      <h1 className="text-sm font-semibold font-display pl-10 lg:pl-0 whitespace-nowrap shrink-0">
        {title}
      </h1>

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
