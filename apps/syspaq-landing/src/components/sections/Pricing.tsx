import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { cn } from "@syspaq/ui";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface Tier {
  name: string;
  monthlyPrice: number | null;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  badge?: string;
  limit: string;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    monthlyPrice: 79,
    description: "Para couriers que están arrancando su operación digital.",
    limit: "Hasta 300 envíos/mes",
    features: [
      "300 envíos / mes",
      "2 usuarios operadores",
      "1 sucursal",
      "Tracking completo (9 fases)",
      "Pre-alertas y recepciones",
      "Facturación básica",
      "Soporte por email",
    ],
    cta: "Empezar Gratis 14 días",
  },
  {
    name: "Growth",
    monthlyPrice: 149,
    description: "El plan favorito de couriers en expansión multi-sucursal.",
    limit: "Hasta 1,500 envíos/mes",
    highlighted: true,
    badge: "Más Popular",
    features: [
      "1,500 envíos / mes",
      "8 usuarios operadores",
      "3 sucursales",
      "Todo en Starter",
      "Contenedores & DGA/Aduanas",
      "Órdenes de entrega",
      "API completa & Webhooks",
      "Integraciones Shopify / WooCommerce",
      "Pasarela de pagos (Stripe & PayPal)",
      "Analytics avanzados",
      "Soporte prioritario",
    ],
    cta: "Empezar Gratis 14 días",
  },
  {
    name: "Pro",
    monthlyPrice: 249,
    description: "Para operaciones de alto volumen con múltiples equipos.",
    limit: "Hasta 5,000 envíos/mes",
    features: [
      "5,000 envíos / mes",
      "25 usuarios operadores",
      "Sucursales ilimitadas",
      "Todo en Growth",
      "Importación masiva (CSV/Excel)",
      "Reportes personalizados",
      "Notas de crédito avanzadas",
      "Portal de clientes self-service",
      "Soporte 24/7 con SLA",
    ],
    cta: "Empezar Gratis 14 días",
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    description: "Para redes courier con operaciones a escala o requisitos específicos.",
    limit: "Volumen personalizado",
    features: [
      "Envíos ilimitados",
      "Usuarios ilimitados",
      "Todo en Pro",
      "Infraestructura dedicada",
      "White-label disponible",
      "Onboarding y migración asistida",
      "SLA garantizado por contrato",
      "Gerente de cuenta dedicado",
    ],
    cta: "Hablar con Ventas",
  },
];

function PricingCard({ tier, index, annual }: { tier: Tier; index: number; annual: boolean }) {
  const price = tier.monthlyPrice
    ? annual
      ? Math.round(tier.monthlyPrice * 0.8)
      : tier.monthlyPrice
    : null;

  return (
    <AnimateOnScroll delay={index * 0.08}>
      <div
        className={cn(
          "relative flex h-full flex-col rounded-2xl border p-7",
          tier.highlighted
            ? "border-primary-500/60 bg-gradient-to-b from-primary-500/10 to-surface-900 shadow-xl shadow-primary-500/10"
            : "border-surface-700/50 bg-surface-900/50",
        )}
      >
        {tier.badge && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-4 py-1 text-xs font-semibold text-white">
            <Zap className="h-3 w-3" />
            {tier.badge}
          </span>
        )}

        <div>
          <h3 className="font-display text-lg font-semibold">{tier.name}</h3>
          <div className="mt-4 flex items-baseline gap-1">
            {price !== null ? (
              <>
                <span className="font-display text-4xl font-bold">${price}</span>
                <span className="text-sm text-surface-400">/mes</span>
                {annual && (
                  <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                    −20%
                  </span>
                )}
              </>
            ) : (
              <span className="font-display text-4xl font-bold">Custom</span>
            )}
          </div>
          <p className="mt-1 text-xs font-medium text-primary-400">{tier.limit}</p>
          <p className="mt-3 text-sm text-surface-400">{tier.description}</p>
        </div>

        <ul className="mt-7 flex-1 space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
              <span className="text-surface-300">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Button
            variant={tier.highlighted ? "accent" : "secondary"}
            href="#contacto"
            className="w-full"
          >
            {tier.cta}
          </Button>
        </div>
      </div>
    </AnimateOnScroll>
  );
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="precios" className="py-24">
      <Container>
        <SectionHeading
          badge="Precios"
          title="Planes para cada etapa de tu courier"
          subtitle="Sin contratos de permanencia. Cancela cuando quieras. 14 días de prueba gratis en cualquier plan."
        />

        {/* Toggle anual/mensual */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <span className={cn("text-sm", !annual ? "text-white" : "text-surface-500")}>
            Mensual
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              annual ? "bg-primary-500" : "bg-surface-700",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                annual ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
          <span className={cn("text-sm", annual ? "text-white" : "text-surface-500")}>
            Anual
            <span className="ml-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
              Ahorra 20%
            </span>
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {TIERS.map((tier, i) => (
            <PricingCard key={tier.name} tier={tier} index={i} annual={annual} />
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-surface-500">
          ¿Más de 5,000 envíos/mes o necesitas condiciones especiales?{" "}
          <a href="#contacto" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
            Contáctanos para un plan Enterprise a medida.
          </a>
        </p>
      </Container>
    </section>
  );
}
