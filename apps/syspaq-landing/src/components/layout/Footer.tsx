import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

const LINKS: Record<string, { label: string; href: string }[]> = {
  Producto: [
    { label: "Funciones", href: "#funciones" },
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Precios", href: "#precios" },
    { label: "Demo Sandbox", href: "#contacto" },
    { label: "Portal de Clientes", href: "#funciones" },
  ],
  Recursos: [
    { label: "Guia de Inicio", href: "#guia" },
    { label: "Centro de Ayuda", href: "#guia" },
    { label: "FAQ", href: "#faq" },
    { label: "Blog", href: "#" },
    { label: "Casos de Uso", href: "#como-funciona" },
  ],
  Soporte: [
    { label: "Contacto", href: "#contacto" },
    { label: "Soporte Prioritario", href: "#contacto" },
    { label: "Comunidad", href: "#contacto" },
    { label: "Status del Servicio", href: "#" },
  ],
  Legal: [
    { label: "Politica de Privacidad", href: "#" },
    { label: "Terminos de Servicio", href: "#" },
    { label: "Acuerdo de Nivel de Servicio (SLA)", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-surface-800 bg-surface-950">
      {/* Newsletter / CTA band */}
      <div className="border-b border-surface-800">
        <Container className="flex flex-col items-center justify-between gap-6 py-12 sm:flex-row">
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Mantente al dia con SysPaq
            </h3>
            <p className="mt-1 text-sm text-surface-400">
              Recibe tips, actualizaciones de producto y noticias del sector courier.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-sm items-center gap-2"
          >
            <input
              type="email"
              placeholder="tucorreo@empresa.com"
              className="flex-1 rounded-lg border border-surface-700 bg-surface-900 px-4 py-2.5 text-sm text-white placeholder:text-surface-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-colors"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors shrink-0"
            >
              Suscribir
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </Container>
      </div>

      {/* Main footer content */}
      <Container className="py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand column - spans 2 */}
          <div className="lg:col-span-2">
            <img src="/logo-white.png" alt="SysPaq" className="h-7 w-auto" />
            <p className="mt-4 text-sm text-surface-400 leading-relaxed max-w-xs">
              La plataforma todo-en-uno para couriers internacionales en Latinoamerica.
              Gestiona envios, aduanas, facturacion y entregas desde un solo lugar.
            </p>

            {/* Contact info */}
            <div className="mt-6 space-y-2.5">
              <a
                href="mailto:hola@syspaq.com"
                className="flex items-center gap-2.5 text-sm text-surface-400 hover:text-primary-400 transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0" />
                hola@syspaq.com
              </a>
              <a
                href="tel:+18095550000"
                className="flex items-center gap-2.5 text-sm text-surface-400 hover:text-primary-400 transition-colors"
              >
                <Phone className="h-4 w-4 shrink-0" />
                +1 (809) 555-0000
              </a>
              <div className="flex items-start gap-2.5 text-sm text-surface-400">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Santo Domingo, Republica Dominicana</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-display text-xs font-semibold uppercase tracking-wider text-surface-300">
                {title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-surface-500 transition-colors hover:text-primary-400"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-surface-800">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-surface-600">
            &copy; {new Date().getFullYear()} SysPaq. Todos los derechos reservados.
          </p>

          {/* Company attribution */}
          <div className="flex items-center gap-1.5 text-xs text-surface-600">
            <span>Un producto de</span>
            <a
              href="https://ixi.do"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-surface-400 hover:text-primary-400 transition-colors"
            >
              ixi Dominicana
            </a>
            <span className="text-surface-700">|</span>
            <a
              href="https://valnetrd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-surface-400 hover:text-primary-400 transition-colors"
            >
              Valnet SRL
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
