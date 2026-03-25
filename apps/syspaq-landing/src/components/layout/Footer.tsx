import { Container } from "@/components/ui/Container";

const LINKS = {
  Producto: ["Funciones", "Precios", "API Docs", "Changelog"],
  Empresa: ["Nosotros", "Blog", "Carreras", "Contacto"],
  Legal: ["Privacidad", "Términos", "SLA"],
};

export function Footer() {
  return (
    <footer className="border-t border-surface-800 bg-surface-950 py-16">
      <Container>
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div>
              <img src="/logo-white.png" alt="SysPaq" className="h-7 w-auto" />
            </div>
            <p className="mt-4 text-sm text-surface-400 leading-relaxed">
              La plataforma todo-en-uno para couriers internacionales en Latinoamérica.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-surface-300">
                {title}
              </h4>
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-surface-500 transition-colors hover:text-primary-400"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-surface-800 pt-8 sm:flex-row">
          <p className="text-xs text-surface-600">
            &copy; {new Date().getFullYear()} SysPaq. Todos los derechos reservados.
          </p>
          <p className="text-xs text-surface-600">
            Hecho con pasión en Latinoamérica
          </p>
        </div>
      </Container>
    </footer>
  );
}
