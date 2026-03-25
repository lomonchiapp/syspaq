import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@syspaq/ui";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "¿Puedo probar SysPaq antes de pagar?",
    answer:
      "Sí. Todos los planes incluyen 14 días de prueba gratuita sin necesidad de tarjeta de crédito. Además, puedes explorar el dashboard de demo en cualquier momento con datos reales de ejemplo — sin registro.",
  },
  {
    question: "¿Qué pasa si supero el límite de envíos de mi plan?",
    answer:
      "No cortamos tu servicio. Si superas el límite de tu plan en un mes, simplemente te notificamos y te ofrecemos hacer upgrade. Puedes cambiar de plan en cualquier momento desde el panel de ajustes.",
  },
  {
    question: "¿SysPaq funciona para couriers que operan entre Estados Unidos y el Caribe / LatAm?",
    answer:
      "Exactamente para eso fue diseñado. SysPaq cubre el ciclo completo de un courier internacional: casilleros en EE.UU., recepciones, consolidación en contenedores, proceso aduanal (DGA), órdenes de entrega locales y facturación en tu moneda.",
  },
  {
    question: "¿Cuántos usuarios puedo crear?",
    answer:
      "Depende de tu plan: Starter (2 usuarios), Growth (8 usuarios), Pro (25 usuarios), Enterprise (ilimitados). Cada usuario tiene un rol — ADMIN, OPERADOR o INTEGRACIÓN — con permisos independientes.",
  },
  {
    question: "¿Puedo conectar mi tienda de e-commerce?",
    answer:
      "Sí. Los planes Growth en adelante incluyen integración nativa con Shopify y WooCommerce. Las órdenes de tu tienda entran automáticamente como pre-alertas en SysPaq. También puedes conectar cualquier plataforma via API.",
  },
  {
    question: "¿SysPaq tiene API pública?",
    answer:
      "Sí, API REST completa disponible desde el plan Growth. Soporta autenticación por JWT y API Keys, paginación estándar, webhooks configurables por evento y documentación interactiva en api.syspaq.com/docs.",
  },
  {
    question: "¿Puedo migrar mis datos desde otro sistema?",
    answer:
      "Los planes Pro y Enterprise incluyen importación masiva por CSV/Excel para clientes y envíos. En Enterprise ofrecemos migración asistida por nuestro equipo. Habla con nosotros si tienes un volumen grande de datos históricos.",
  },
  {
    question: "¿Está disponible en español?",
    answer:
      "Completamente. Todo el dashboard, notificaciones, facturas y emails están en español. El soporte técnico también opera en español.",
  },
  {
    question: "¿Puedo cancelar en cualquier momento?",
    answer:
      "Sí. No hay contratos de permanencia. Si cancelas, mantienes el acceso hasta el final del período pagado y puedes exportar todos tus datos.",
  },
];

function FaqRow({ item, index }: { item: FaqItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <AnimateOnScroll delay={index * 0.04}>
      <div className="border-b border-surface-800">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between gap-4 py-5 text-left"
        >
          <span className="font-medium text-surface-100">{item.question}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-surface-400 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            open ? "max-h-96 pb-5" : "max-h-0",
          )}
        >
          <p className="text-sm leading-relaxed text-surface-400">{item.answer}</p>
        </div>
      </div>
    </AnimateOnScroll>
  );
}

export function Faq() {
  return (
    <section id="faq" className="py-24">
      <Container>
        <SectionHeading
          badge="FAQ"
          title="Preguntas frecuentes"
          subtitle="Todo lo que necesitas saber antes de empezar."
        />
        <div className="mx-auto max-w-3xl">
          {FAQS.map((item, i) => (
            <FaqRow key={item.question} item={item} index={i} />
          ))}
        </div>
        <p className="mt-12 text-center text-sm text-surface-500">
          ¿Tienes otra pregunta?{" "}
          <a href="#contacto" className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
            Escríbenos directamente
          </a>
        </p>
      </Container>
    </section>
  );
}
