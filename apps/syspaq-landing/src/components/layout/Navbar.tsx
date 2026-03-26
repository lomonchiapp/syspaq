import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, BookOpen, Code2, Webhook, Rocket, FileText, HelpCircle, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@syspaq/ui";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const DOCS_MENU = [
  {
    group: "Primeros Pasos",
    items: [
      { icon: Rocket, label: "Guía de inicio rápido", desc: "Crea tu cuenta y configura tu primer envío", href: "https://api.syspaq.com/docs#/auth" },
      { icon: BookOpen, label: "Conceptos básicos", desc: "Tenants, casilleros, fases de envío y más", href: "https://api.syspaq.com/docs" },
    ],
  },
  {
    group: "Referencia API",
    items: [
      { icon: Code2, label: "REST API", desc: "Documentación completa de todos los endpoints", href: "https://api.syspaq.com/docs" },
      { icon: Webhook, label: "Webhooks", desc: "Recibe eventos en tiempo real en tu sistema", href: "https://api.syspaq.com/docs#/webhooks" },
      { icon: Package, label: "E-commerce", desc: "Integra Shopify, WooCommerce y más", href: "https://api.syspaq.com/docs#/ecommerce" },
    ],
  },
  {
    group: "Recursos",
    items: [
      { icon: FileText, label: "OpenAPI / Swagger", desc: "Descarga el spec y genera tu cliente SDK", href: "https://api.syspaq.com/openapi.json" },
      { icon: HelpCircle, label: "FAQ técnico", desc: "Preguntas frecuentes de integradores", href: "#faq" },
    ],
  },
];

const NAV_LINKS = [
  { label: "Funciones", href: "#funciones" },
  { label: "Cómo Funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
  { label: "FAQ", href: "#faq" },
  { label: "Contacto", href: "#contacto" },
];

function DocsMenu() {
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
          open ? "text-white" : "text-surface-300 hover:text-white"
        )}
      >
        Guía & Docs
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[640px] rounded-2xl border border-surface-700/60 bg-surface-950/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header strip */}
            <div className="border-b border-surface-700/40 px-6 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">Documentación & Guías</span>
              <a
                href="https://api.syspaq.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                Ver docs completos →
              </a>
            </div>

            <div className="grid grid-cols-3 gap-0 p-2">
              {DOCS_MENU.map((section) => (
                <div key={section.group} className="p-3">
                  <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                    {section.group}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-800/70 group"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-400 group-hover:bg-primary-500/20 transition-colors">
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-200 group-hover:text-white transition-colors">
                            {item.label}
                          </p>
                          <p className="text-xs text-surface-500 leading-snug mt-0.5">{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer strip */}
            <div className="border-t border-surface-700/40 px-6 py-3 bg-surface-900/50 flex items-center gap-2">
              <span className="text-xs text-surface-500">API base URL:</span>
              <code className="text-xs font-mono text-primary-400">https://api.syspaq.com/v1</code>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-surface-300 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <DocsMenu />
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href={import.meta.env.VITE_DASHBOARD_URL || "/dashboard"}
            className="text-sm text-surface-300 transition-colors hover:text-white"
          >
            Iniciar Sesión
          </a>
          <Button variant="accent" href={`${import.meta.env.VITE_DASHBOARD_URL || ""}/register`} className="text-xs px-4 py-2">
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
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-surface-300 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}

              {/* Docs section in mobile */}
              <div className="border-t border-surface-700/40 pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-surface-600">
                  Guía & Docs
                </p>
                {DOCS_MENU.flatMap((s) => s.items).map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-2 text-sm text-surface-300 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-primary-400 shrink-0" />
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-surface-700/50">
                <a href={import.meta.env.VITE_DASHBOARD_URL || "/dashboard"} className="text-sm text-surface-300">
                  Iniciar Sesión
                </a>
                <Button variant="accent" href={`${import.meta.env.VITE_DASHBOARD_URL || ""}/register`} className="text-xs">
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
