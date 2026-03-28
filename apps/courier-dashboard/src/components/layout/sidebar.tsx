import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  Bell,
  PackageCheck,
  CheckCircle,
  Ship,
  Plane,
  ArrowLeftRight,
  FileCheck,
  Truck,
  FileText,
  CreditCard,
  ReceiptText,
  Vault,
  Building2,
  Calculator,
  Webhook,
  BellRing,
  ShoppingCart,
  Upload,
  Settings,
  Car,
  Sun,
  Moon,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  ChevronUp,
  Palette,
  User,
  ScrollText,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@syspaq/ui";
import { usePermissions } from "@/hooks/use-permissions";
import { useThemeStore } from "@/stores/theme.store";
import { useAuthStore } from "@/stores/auth.store";
import { useSidebarStore } from "@/stores/sidebar.store";
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
      { label: "Envios", path: "/shipments", icon: Package, permission: "shipments" },
      { label: "Pre-Alertas", path: "/pre-alerts", icon: Bell, permission: "pre-alerts" },
      { label: "Recepciones", path: "/receptions", icon: PackageCheck, permission: "receptions" },
      { label: "Post-Alertas", path: "/post-alerts", icon: CheckCircle, permission: "post-alerts" },
    ],
  },
  {
    title: "Logistica",
    items: [
      { label: "Embarcaciones", path: "/voyages", icon: Plane, permission: "voyages" },
      { label: "Contenedores", path: "/containers", icon: Ship, permission: "containers" },
      { label: "Transferencias", path: "/transfers", icon: ArrowLeftRight, permission: "transfers" },
      { label: "DGA", path: "/dga", icon: FileCheck, permission: "dga" },
      { label: "Ordenes Entrega", path: "/delivery-orders", icon: Truck, permission: "delivery-orders" },
    ],
  },
  {
    title: "Flota",
    items: [
      { label: "Panel Flota", path: "/fleet", icon: Car, permission: "fleet" },
    ],
  },
  {
    title: "Facturacion",
    items: [
      { label: "Facturas", path: "/invoices", icon: FileText, permission: "invoices" },
      { label: "Pagos", path: "/payments", icon: CreditCard, permission: "payments" },
      { label: "Notas de Credito", path: "/credit-notes", icon: ReceiptText, permission: "credit-notes" },
      { label: "Caja Chica", path: "/caja-chica", icon: Vault, permission: "caja-chica" },
      { label: "Fiscal", path: "/fiscal", icon: ScrollText, permission: "fiscal" },
    ],
  },
  {
    title: "Configuracion",
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
  {
    title: "Soporte",
    items: [
      { label: "Tickets", path: "/tickets", icon: LifeBuoy, permission: "tickets" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  User Menu                                                          */
/* ------------------------------------------------------------------ */

function UserMenu({ onClose }: { onClose: () => void }) {
  const { mode, toggle } = useThemeStore();
  const { logout } = useAuthStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const items = [
    { icon: User, label: "Mi Perfil", href: "/settings", onClick: onClose },
    {
      icon: mode === "dark" ? Sun : Moon,
      label: mode === "dark" ? "Modo Claro" : "Modo Oscuro",
      onClick: () => { toggle(); onClose(); },
    },
    { icon: Palette, label: "Ajustes", href: "/settings", onClick: onClose },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-2 right-2 mb-2 z-50 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
    >
      <div className="p-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
              <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span>{item.label}</span>
            </div>
          );

          if (item.href) {
            return (
              <NavLink key={item.label} to={item.href} onClick={item.onClick}>
                {content}
              </NavLink>
            );
          }
          return (
            <button key={item.label} onClick={item.onClick} className="w-full text-left">
              {content}
            </button>
          );
        })}
      </div>

      <div className="border-t border-[var(--border)] p-1.5">
        <button
          onClick={() => { logout(); onClose(); }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesion</span>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  User Card                                                          */
/* ------------------------------------------------------------------ */

function UserCard({ collapsed }: { collapsed: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, role } = useAuthStore();

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "??";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "Usuario";
  const email = user?.email ?? "";

  const avatarColor =
    role === "ADMIN"
      ? "bg-[var(--primary)]/15 text-[var(--primary)]"
      : role === "OPERATOR"
        ? "bg-[var(--accent)]/15 text-[var(--accent)]"
        : "bg-[var(--muted)] text-[var(--muted-foreground)]";

  return (
    <div className="relative px-3 py-3 border-t border-[var(--sidebar-border)]">
      {menuOpen && <UserMenu onClose={() => setMenuOpen(false)} />}

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={cn(
          "flex w-full items-center rounded-xl transition-colors",
          "hover:bg-[var(--sidebar-accent)]/10",
          menuOpen && "bg-[var(--sidebar-accent)]/10",
          collapsed ? "justify-center p-2" : "gap-3 p-2.5",
        )}
        title={collapsed ? fullName : undefined}
      >
        {/* Avatar */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg text-xs font-bold",
            collapsed ? "h-8 w-8" : "h-9 w-9",
            avatarColor,
          )}
        >
          {initials}
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-[var(--sidebar-foreground)] truncate">
                {fullName}
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                {email}
              </p>
            </div>
            <ChevronUp
              className={cn(
                "h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200",
                !menuOpen && "rotate-180",
              )}
            />
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

export function Sidebar() {
  const { canAccess, isSuperAdmin } = usePermissions();
  const { mode } = useThemeStore();
  const { collapsed } = useSidebarStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-[var(--sidebar-border)]",
          collapsed ? "justify-center px-3 py-5" : "px-5 py-5",
        )}
      >
        {collapsed ? (
          <img src="/favicon.png" alt="SysPaq" className="h-7 w-7" />
        ) : (
          <img
            src={mode === "dark" ? "/logo-white.png" : "/logo.png"}
            alt="SysPaq"
            className="h-7 w-auto"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto py-4 space-y-5", collapsed ? "px-2" : "px-3")}>
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => canAccess(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]/60">
                  {section.title}
                </p>
              )}
              {collapsed && (
                <div className="mb-1 border-b border-[var(--sidebar-border)] mx-1" />
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center rounded-lg text-[13px] transition-all duration-150",
                          collapsed
                            ? "justify-center p-2.5"
                            : "gap-3 px-3 py-2",
                          isActive
                            ? "bg-[var(--sidebar-accent)]/15 text-[var(--sidebar-accent)] font-semibold shadow-sm"
                            : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/8 hover:text-[var(--sidebar-accent)]",
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Superadmin */}
        {isSuperAdmin && (
          <div>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-500/60">
                Superadmin
              </p>
            )}
            {collapsed && (
              <div className="mb-1 border-b border-amber-500/20 mx-1" />
            )}
            <ul className="space-y-0.5">
              <li>
                <NavLink
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? "Panel Admin" : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center rounded-lg text-[13px] transition-all duration-150",
                      collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2",
                      isActive
                        ? "bg-amber-500/15 text-amber-400 font-semibold shadow-sm"
                        : "text-[var(--sidebar-foreground)] hover:bg-amber-500/8 hover:text-amber-400",
                    )
                  }
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Panel Admin</span>}
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </nav>

      {/* User card footer */}
      <UserCard collapsed={collapsed} />
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
          "fixed lg:static z-40 inset-y-0 left-0 flex flex-col",
          "bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]",
          "transition-all duration-200 lg:translate-x-0",
          collapsed ? "w-[68px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
