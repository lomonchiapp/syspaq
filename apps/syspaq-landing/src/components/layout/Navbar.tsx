import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@syspaq/ui";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { label: "Funciones", href: "#funciones" },
  { label: "Cómo Funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
  { label: "Contacto", href: "#contacto" },
];

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
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href={import.meta.env.VITE_DASHBOARD_URL || "/dashboard"}
            className="text-sm text-surface-300 transition-colors hover:text-white"
          >
            Iniciar Sesión
          </a>
          <Button variant="accent" href="#contacto" className="text-xs px-4 py-2">
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
              <div className="flex flex-col gap-3 pt-4 border-t border-surface-700/50">
                <a href="#" className="text-sm text-surface-300">
                  Iniciar Sesión
                </a>
                <Button variant="accent" href="#contacto" className="text-xs">
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
