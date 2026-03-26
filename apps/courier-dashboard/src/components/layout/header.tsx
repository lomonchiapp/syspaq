import { useState, useEffect, useRef } from "react";
import { useLocation, NavLink } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Bell,
} from "lucide-react";
import { cn } from "@syspaq/ui";
import { useSidebarStore } from "@/stores/sidebar.store";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
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
  "/cajachica": "Cajas Chicas",
};

/* ------------------------------------------------------------------ */
/*  User dropdown in top-right                                         */
/* ------------------------------------------------------------------ */

function UserDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, role, logout } = useAuthStore();
  const { mode, toggle } = useThemeStore();

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "??";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "Usuario";
  const email = user?.email ?? "";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const avatarColor =
    role === "ADMIN"
      ? "bg-[var(--primary)]/15 text-[var(--primary)]"
      : role === "OPERATOR"
        ? "bg-[var(--accent)]/15 text-[var(--accent)]"
        : "bg-[var(--muted)] text-[var(--muted-foreground)]";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors",
          "hover:bg-[var(--muted)]",
          open && "bg-[var(--muted)]",
        )}
      >
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold",
            avatarColor,
          )}
        >
          {initials}
        </div>
        <span className="hidden sm:block text-sm font-medium text-[var(--foreground)] max-w-[100px] truncate">
          {user?.firstName ?? "Usuario"}
        </span>
        <ChevronDown
          className={cn(
            "hidden sm:block h-3 w-3 text-[var(--muted-foreground)] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
          {/* User info header */}
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
              {fullName}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] truncate">{email}</p>
            {role && (
              <span
                className={cn(
                  "mt-1.5 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold",
                  role === "ADMIN"
                    ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                    : role === "OPERATOR"
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)]",
                )}
              >
                {role}
              </span>
            )}
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <User className="h-4 w-4 text-[var(--muted-foreground)]" />
              Mi Perfil
            </NavLink>

            <NavLink
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              <Settings className="h-4 w-4 text-[var(--muted-foreground)]" />
              Ajustes
            </NavLink>

            <button
              onClick={() => {
                toggle();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              {mode === "dark" ? (
                <Sun className="h-4 w-4 text-[var(--muted-foreground)]" />
              ) : (
                <Moon className="h-4 w-4 text-[var(--muted-foreground)]" />
              )}
              {mode === "dark" ? "Modo Claro" : "Modo Oscuro"}
            </button>
          </div>

          <div className="border-t border-[var(--border)] p-1.5">
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

export function Header() {
  const location = useLocation();
  const { collapsed, toggle } = useSidebarStore();
  const title = PAGE_TITLES[location.pathname] ?? "Dashboard";

  return (
    <header
      className={cn(
        "h-14 flex items-center justify-between gap-4 px-4 lg:px-6",
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
        <div className="w-8 lg:hidden" />
        <h1 className="text-sm font-semibold font-display whitespace-nowrap">
          {title}
        </h1>
      </div>

      {/* Center: Global search */}
      <div className="flex-1 flex justify-center max-w-2xl">
        <GlobalSearch />
      </div>

      {/* Right: Quick add + notifications + user */}
      <div className="flex items-center gap-1.5 shrink-0">
        <QuickAddMenu />

        <button
          className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)] relative"
          title="Notificaciones"
        >
          <Bell className="h-4 w-4" />
        </button>

        <UserDropdown />
      </div>
    </header>
  );
}
