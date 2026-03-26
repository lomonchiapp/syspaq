import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  ChevronDown,
  BookOpen,
  Rocket,
  Package,
  Truck,
  BarChart3,
  CreditCard,
  Globe,
  ShieldCheck,
  Headphones,
  MessageSquare,
  FileText,
  GraduationCap,
  Zap,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@syspaq/ui";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*  Mega-menu data: Producto                                           */
/* ------------------------------------------------------------------ */

const PRODUCT_MENU = {
  featured: {
    title: "Plataforma SysPaq",
    desc: "Todo lo que tu courier necesita para operar, facturar y crecer en una sola plataforma.",
    cta: { label: "Ver todas las funciones", href: "#funciones" },
  },
  columns: [
    {
      group: "Operaciones",
      items: [
        { icon: Package, label: "Envios & Tracking", desc: "9 fases de seguimiento en tiempo real", href: "#funciones" },
        { icon: Truck, label: "Ultima Milla", desc: "Ordenes de entrega y logistica local", href: "#funciones" },
        { icon: Globe, label: "Contenedores", desc: "Consolidacion maritima y aerea", href: "#funciones" },
        { icon: ShieldCheck, label: "Aduanas & DGA", desc: "Etiquetas, despacho y compliance", href: "#funciones" },
      ],
    },
    {
      group: "Negocio",
      items: [
        { icon: CreditCard, label: "Facturacion & Pagos", desc: "Stripe, PayPal y cobros automaticos", href: "#funciones" },
        { icon: BarChart3, label: "Analytics", desc: "KPIs, reportes y metricas en vivo", href: "#funciones" },
        { icon: Zap, label: "E-commerce", desc: "Shopify, WooCommerce y mas", href: "#funciones" },
        { icon: Globe, label: "Portal de Clientes", desc: "Self-service white-label", href: "#funciones" },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Mega-menu data: Recursos                                           */
/* ------------------------------------------------------------------ */

const RESOURCES_MENU = {
  columns: [
    {
      group: "Aprende",
      items: [
        { icon: Rocket, label: "Guia de Inicio", desc: "Configura tu cuenta en minutos", href: "#guia" },
        { icon: BookOpen, label: "Centro de Ayuda", desc: "Tutoriales paso a paso", href: "#guia" },
        { icon: GraduationCap, label: "Casos de Uso", desc: "Como otros couriers usan SysPaq", href: "#como-funciona" },
        { icon: FileText, label: "Blog", desc: "Noticias, tips y mejores practicas", href: "#" },
      ],
    },
    {
      group: "Soporte",
      items: [
        { icon: Headphones, label: "Soporte Prioritario", desc: "Asistencia directa por chat y email", href: "#contacto" },
        { icon: MessageSquare, label: "Comunidad", desc: "Conecta con otros operadores courier", href: "#contacto" },
        { icon: FileText, label: "FAQ", desc: "Respuestas a preguntas frecuentes", href: "#faq" },
        { icon: Zap, label: "Status del Servicio", desc: "Disponibilidad y uptime en vivo", href: "#" },
      ],
    },
  ],
  highlight: {
    title: "Prueba gratis por 14 dias",
    desc: "Sin tarjeta de credito. Configura tu operacion y prueba con datos reales.",
    cta: { label: "Comenzar ahora", href: "#contacto" },
  },
};

const NAV_LINKS = [
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
  { label: "FAQ", href: "#faq" },
  { label: "Contacto", href: "#contacto" },
];

/* ------------------------------------------------------------------ */
/*  MegaMenu Component                                                 */
/* ------------------------------------------------------------------ */

function MegaMenu({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1 text-sm transition-colors",
          open ? "text-white" : "text-surface-300 hover:text-white",
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 top-full mt-3 rounded-2xl border border-surface-700/60 bg-surface-950/95 backdrop-blur-xl shadow-2xl overflow-hidden",
              wide ? "w-[780px]" : "w-[680px]",
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ProductMegaMenu                                                    */
/* ------------------------------------------------------------------ */

function ProductMegaMenu() {
  return (
    <MegaMenu label="Producto" wide>
      <div className="flex">
        {/* Featured left panel */}
        <div className="w-[240px] shrink-0 border-r border-surface-700/40 bg-gradient-to-b from-primary-500/5 to-transparent p-6 flex flex-col justify-between">
          <div>
            <p className="font-display text-sm font-bold text-white">
              {PRODUCT_MENU.featured.title}
            </p>
            <p className="mt-2 text-xs text-surface-400 leading-relaxed">
              {PRODUCT_MENU.featured.desc}
            </p>
          </div>
          <a
            href={PRODUCT_MENU.featured.cta.href}
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
          >
            {PRODUCT_MENU.featured.cta.label}
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 flex-1 gap-0 p-2">
          {PRODUCT_MENU.columns.map((col) => (
            <div key={col.group} className="p-3">
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                {col.group}
              </p>
              <div className="space-y-0.5">
                {col.items.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-800/70 group"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-400 group-hover:bg-primary-500/20 transition-colors">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-200 group-hover:text-white transition-colors">
                        {item.label}
                      </p>
                      <p className="text-xs text-surface-500 leading-snug mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MegaMenu>
  );
}

/* ------------------------------------------------------------------ */
/*  ResourcesMegaMenu                                                  */
/* ------------------------------------------------------------------ */

function ResourcesMegaMenu() {
  return (
    <MegaMenu label="Recursos">
      <div className="flex">
        {/* Columns */}
        <div className="grid grid-cols-2 flex-1 gap-0 p-2">
          {RESOURCES_MENU.columns.map((col) => (
            <div key={col.group} className="p-3">
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                {col.group}
              </p>
              <div className="space-y-0.5">
                {col.items.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-800/70 group"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400 group-hover:bg-accent-500/20 transition-colors">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-200 group-hover:text-white transition-colors">
                        {item.label}
                      </p>
                      <p className="text-xs text-surface-500 leading-snug mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Highlight right panel */}
        <div className="w-[200px] shrink-0 border-l border-surface-700/40 bg-gradient-to-b from-accent-500/5 to-transparent p-5 flex flex-col justify-between">
          <div>
            <p className="font-display text-sm font-bold text-white">
              {RESOURCES_MENU.highlight.title}
            </p>
            <p className="mt-2 text-xs text-surface-400 leading-relaxed">
              {RESOURCES_MENU.highlight.desc}
            </p>
          </div>
          <a
            href={RESOURCES_MENU.highlight.cta.href}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-accent-500 px-4 py-2 text-xs font-semibold text-surface-950 hover:bg-accent-400 transition-colors"
          >
            {RESOURCES_MENU.highlight.cta.label}
          </a>
        </div>
      </div>
    </MegaMenu>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile menu helper: flatten all mega-menu items                    */
/* ------------------------------------------------------------------ */

const MOBILE_PRODUCT_ITEMS = PRODUCT_MENU.columns.flatMap((c) => c.items);
const MOBILE_RESOURCE_ITEMS = RESOURCES_MENU.columns.flatMap((c) => c.items);

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-surface-700/50 bg-surface-950/80 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        {/* Logo */}
        <a href="#">
          <img src="/logo-white.png" alt="SysPaq" className="h-7 w-auto" />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-7 md:flex">
          <ProductMegaMenu />
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-surface-300 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <ResourcesMegaMenu />
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href={import.meta.env.VITE_DASHBOARD_URL || "/dashboard"}
            className="text-sm text-surface-300 transition-colors hover:text-white"
          >
            Iniciar Sesion
          </a>
          <Button
            variant="accent"
            href={`${import.meta.env.VITE_DASHBOARD_URL || ""}/register`}
            className="text-xs px-4 py-2"
          >
            Prueba Gratis
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-surface-300 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-surface-700/50 bg-surface-950/95 backdrop-blur-xl md:hidden"
          >
            <Container className="flex flex-col gap-4 py-6">
              {/* Product section */}
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                  Producto
                </p>
                {MOBILE_PRODUCT_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-2 text-sm text-surface-300 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-primary-400 shrink-0" />
                    {item.label}
                  </a>
                ))}
              </div>

              {/* Nav links */}
              <div className="border-t border-surface-700/40 pt-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm text-surface-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Resources section */}
              <div className="border-t border-surface-700/40 pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                  Recursos & Soporte
                </p>
                {MOBILE_RESOURCE_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-2 text-sm text-surface-300 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-accent-400 shrink-0" />
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-surface-700/50">
                <a
                  href={import.meta.env.VITE_DASHBOARD_URL || "/dashboard"}
                  className="text-sm text-surface-300"
                >
                  Iniciar Sesion
                </a>
                <Button
                  variant="accent"
                  href={`${import.meta.env.VITE_DASHBOARD_URL || ""}/register`}
                  className="text-xs"
                >
                  Prueba Gratis
                </Button>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
