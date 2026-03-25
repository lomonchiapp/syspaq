import { Check } from "lucide-react";
import { cn } from "@syspaq/ui";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    price: "$149",
    period: "/mes",
    description: "Ideal para couriers pequeños iniciando operaciones.",
    features: [
      "Hasta 500 envíos/mes",
      "3 usuarios",
      "1 sucursal",
      "Tracking completo",
      "Facturación básica",
      "Soporte por email",
    ],
    cta: "Comenzar Gratis",
  },
  {
    name: "Professional",
    price: "$399",
    period: "/mes",
    description: "Para couriers en crecimiento con operaciones multi-sucursal.",
    features: [
      "Hasta 5,000 envíos/mes",
      "15 usuarios",
      "5 sucursales",
      "DGA & aduanas",
      "Portal de clientes",
      "API completa & webhooks",
      "Integraciones e-commerce",
      "Pasarela de pagos",
      "Analytics avanzados",
      "Soporte prioritario",
    ],
    highlighted: true,
    cta: "Comenzar Gratis",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Para operaciones de alto volumen con necesidades específicas.",
    features: [
      "Envíos ilimitados",
      "Usuarios ilimitados",
      "Sucursales ilimitadas",
      "Todo en Professional",
      "Reportes personalizados",
      "Importación masiva",
      "SLA garantizado",
      "Soporte dedicado 24/7",
      "Onboarding personalizado",
    ],
    cta: "Contactar Ventas",
  },
];

function PricingCard({ tier, index }: { tier: Tier; index: number }) {
  return (
    <AnimateOnScroll delay={index * 0.1}>
      <div
        className={cn(
          "relative flex h-full flex-col rounded-2xl border p-8",
          tier.highlighted
            ? "border-primary-500/50 bg-surface-900 shadow-lg shadow-primary-500/10"
            : "border-surface-700/50 bg-surface-900/50",
        )}
      >
        {tier.highlighted && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-4 py-1 text-xs font-semibold text-white">
            Más Popular
          </span>
        )}

        <div>
          <h3 className="font-display text-lg font-semibold">{tier.name}</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-display text-4xl font-bold">{tier.price}</span>
            {tier.period && (
              <span className="text-sm text-surface-400">{tier.period}</span>
            )}
          </div>
          <p className="mt-3 text-sm text-surface-400">{tier.description}</p>
        </div>

        <ul className="mt-8 flex-1 space-y-3">
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
  return (
    <section id="precios" className="py-24">
      <Container>
        <SectionHeading
          badge="Precios"
          title="Planes para cada etapa de tu courier"
          subtitle="Comienza gratis. Escala cuando lo necesites."
        />
        <div className="grid gap-8 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <PricingCard key={tier.name} tier={tier} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}
