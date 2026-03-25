import {
  BookOpen,
  Code2,
  Rocket,
  Users,
  Package,
  FileText,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

const API_DOCS_URL = "https://api.syspaq.com/docs";

const USER_STEPS = [
  {
    icon: Users,
    step: "01",
    title: "Crea tu cuenta y configura tu empresa",
    description:
      "Registra tu tenant, agrega tus sucursales y crea los usuarios de tu equipo con sus roles.",
  },
  {
    icon: Package,
    step: "02",
    title: "Agrega clientes y gestiona pre-alertas",
    description:
      "Ingresa tus casilleros, activa el portal self-service y comienza a recibir pre-alertas de sus compras.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Recepciona, consolida y despacha",
    description:
      "Registra recepciones en almacén, consolida en contenedores, procesa aduanas (DGA) y crea órdenes de entrega.",
  },
  {
    icon: FileText,
    step: "04",
    title: "Factura y cobra en automático",
    description:
      "Genera facturas desde las recepciones, cobra con Stripe o PayPal y cierra el ciclo con notas de crédito si aplica.",
  },
];

const DEV_RESOURCES = [
  {
    icon: Code2,
    title: "Referencia de la API REST",
    description:
      "Documentación completa de todos los endpoints: autenticación, paginación, modelos, errores y ejemplos en curl.",
    href: API_DOCS_URL,
    external: true,
    badge: "REST API v1",
    badgeColor: "text-primary-400 bg-primary-500/10 border-primary-500/20",
  },
  {
    icon: BookOpen,
    title: "Autenticación & Tenants",
    description:
      "Aprende a generar tokens JWT con API Key o email/contraseña, y cómo estructurar las llamadas multi-tenant.",
    href: `${API_DOCS_URL}#autenticacion`,
    external: true,
    badge: "Auth",
    badgeColor: "text-accent-400 bg-accent-500/10 border-accent-500/20",
  },
  {
    icon: Package,
    title: "Envíos & Tracking",
    description:
      "Crea envíos, agrega eventos de tracking y consulta el estado de cada paquete en las 9 fases del ciclo.",
    href: `${API_DOCS_URL}#envios`,
    external: true,
    badge: "Shipments",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Code2,
    title: "Webhooks",
    description:
      "Recibe notificaciones en tiempo real en tu servidor cuando cambia el estado de un envío, factura o pago.",
    href: `${API_DOCS_URL}#webhooks`,
    external: true,
    badge: "Events",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
];

export function Guide() {
  return (
    <section id="guia" className="py-24 border-t border-surface-800">
      <Container>
        <SectionHeading
          badge="Guía & Docs"
          title="Todo lo que necesitas para empezar"
          subtitle="Guía de usuario paso a paso y documentación técnica completa para integradores y desarrolladores."
        />

        {/* User Guide */}
        <div className="mb-20">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/15">
              <BookOpen className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">Guía de Usuario</h3>
              <p className="text-sm text-surface-500">Cómo operar SysPaq desde el primer día</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {USER_STEPS.map((step, i) => (
              <AnimateOnScroll key={step.step} delay={i * 0.08}>
                <div className="group relative flex flex-col gap-4 rounded-xl border border-surface-700/50 bg-surface-900/50 p-6 transition-all hover:border-primary-500/30 hover:bg-surface-900">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/10">
                      <step.icon className="h-5 w-5 text-primary-400" />
                    </div>
                    <span className="font-mono text-3xl font-bold text-surface-800 group-hover:text-surface-700 transition-colors">
                      {step.step}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-semibold leading-snug">{step.title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-surface-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>

        {/* Developer Docs */}
        <div>
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15">
                <Code2 className="h-5 w-5 text-accent-400" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold">Documentación para Desarrolladores</h3>
                <p className="text-sm text-surface-500">API REST, webhooks y guías de integración</p>
              </div>
            </div>
            <a
              href={API_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-lg border border-surface-700 px-4 py-2 text-sm text-surface-300 transition-colors hover:border-primary-500/40 hover:text-white sm:flex"
            >
              Ver docs completos
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Code snippet teaser */}
          <AnimateOnScroll>
            <div className="mb-6 overflow-hidden rounded-xl border border-surface-700/50 bg-surface-950">
              <div className="flex items-center gap-2 border-b border-surface-800 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-surface-700" />
                <div className="h-3 w-3 rounded-full bg-surface-700" />
                <div className="h-3 w-3 rounded-full bg-surface-700" />
                <span className="ml-3 text-xs text-surface-500 font-mono">GET /v1/shipments</span>
              </div>
              <div className="grid lg:grid-cols-2">
                <div className="border-r border-surface-800 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Request
                  </p>
                  <pre className="overflow-x-auto text-xs leading-relaxed text-surface-300">
                    <code>{`curl https://api.syspaq.com/v1/shipments \\
  -H "X-Api-Key: spq_live_..." \\
  -H "X-Tenant-Id: tu-empresa" \\
  -G -d "phase=IN_TRANSIT" \\
  -d "limit=20"`}</code>
                  </pre>
                </div>
                <div className="p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Response
                  </p>
                  <pre className="overflow-x-auto text-xs leading-relaxed text-surface-300">
                    <code>{`{
  "data": [
    {
      "id": "shp_abc123",
      "trackingNumber": "SPQ-2025-0042",
      "phase": "IN_TRANSIT",
      "customer": { "name": "María López" },
      "weight": 2.4
    }
  ],
  "meta": { "total": 142, "page": 1 }
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DEV_RESOURCES.map((res, i) => (
              <AnimateOnScroll key={res.title} delay={i * 0.08}>
                <a
                  href={res.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col gap-3 rounded-xl border border-surface-700/50 bg-surface-900/50 p-6 transition-all hover:border-primary-500/30 hover:bg-surface-900"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-800">
                      <res.icon className="h-5 w-5 text-surface-300" />
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${res.badgeColor}`}
                    >
                      {res.badge}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-display font-semibold leading-snug group-hover:text-primary-300 transition-colors">
                      {res.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-surface-400">{res.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-surface-500 group-hover:text-primary-400 transition-colors">
                    Ver documentación <ArrowRight className="h-3 w-3" />
                  </div>
                </a>
              </AnimateOnScroll>
            ))}
          </div>

          <div className="mt-6 sm:hidden text-center">
            <a
              href={API_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
            >
              Ver documentación completa <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
