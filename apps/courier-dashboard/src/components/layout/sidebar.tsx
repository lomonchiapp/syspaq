import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  Bell,
  PackageCheck,
  CheckCircle,
  Ship,
  FileCheck,
  Truck,
  FileText,
  CreditCard,
  ReceiptText,
  Building2,
  Calculator,
  Webhook,
  BellRing,
  ShoppingCart,
  Upload,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@syspaq/ui";
import { usePermissions } from "@/hooks/use-permissions";
import { useThemeStore } from "@/stores/theme.store";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  permission: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "General",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
      { label: "Analytics", path: "/analytics", icon: BarChart3, permission: "analytics" },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { label: "Clientes", path: "/customers", icon: Users, permission: "customers" },
      { label: "Envíos", path: "/shipments", icon: Package, permission: "shipments" },
      { label: "Pre-Alertas", path: "/pre-alerts", icon: Bell, permission: "pre-alerts" },
      { label: "Recepciones", path: "/receptions", icon: PackageCheck, permission: "receptions" },
      { label: "Post-Alertas", path: "/post-alerts", icon: CheckCircle, permission: "post-alerts" },
    ],
  },
  {
    title: "Logística",
    items: [
      { label: "Contenedores", path: "/containers", icon: Ship, permission: "containers" },
      { label: "DGA", path: "/dga", icon: FileCheck, permission: "dga" },
      { label: "Órdenes de Entrega", path: "/delivery-orders", icon: Truck, permission: "delivery-orders" },
    ],
  },
  {
    title: "Facturación",
    items: [
      { label: "Facturas", path: "/invoices", icon: FileText, permission: "invoices" },
      { label: "Pagos", path: "/payments", icon: CreditCard, permission: "payments" },
      { label: "Notas de Crédito", path: "/credit-notes", icon: ReceiptText, permission: "credit-notes" },
    ],
  },
  {
    title: "Configuración",
    items: [
      { label: "Sucursales", path: "/branches", icon: Building2, permission: "branches" },
      { label: "Tarifas", path: "/rate-tables", icon: Calculator, permission: "rate-tables" },
      { label: "Webhooks", path: "/webhooks", icon: Webhook, permission: "webhooks" },
      { label: "Notificaciones", path: "/notifications", icon: BellRing, permission: "notifications" },
      { label: "E-commerce", path: "/ecommerce", icon: ShoppingCart, permission: "ecommerce" },
      { label: "Import", path: "/bulk-import", icon: Upload, permission: "bulk-import" },
      { label: "Ajustes", path: "/settings", icon: Settings, permission: "settings" },
    ],
  },
];

function SysPaqLogo() {
  return (
    <img src="/logo-white.png" alt="SysPaq" className="h-7 w-auto" />
  );
}

export function Sidebar() {
  const { canAccess } = usePermissions();
  const { mode, toggle } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b border-[var(--sidebar-border)]">
        <SysPaqLogo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => canAccess(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          isActive
                            ? "bg-[var(--sidebar-accent)]/15 text-[var(--sidebar-accent)] font-semibold"
                            : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/10"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-4 py-3 border-t border-[var(--sidebar-border)]">
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/10 transition-colors"
        >
          {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{mode === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 p-2 rounded-md bg-[var(--card)] border border-[var(--border)] lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static z-40 inset-y-0 left-0 w-[260px] flex flex-col",
          "bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]",
          "transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
