import { driver, type DriveStep, type Config } from "driver.js";
import "driver.js/dist/driver.css";

/**
 * SysPaq Guided Tour — walks a prospect through every module
 * in the demo dashboard, highlighting competitive advantages.
 */

interface TourStep {
  path: string;
  element?: string;
  title: string;
  description: string;
  side?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  // 1. Dashboard overview
  {
    path: "/dashboard",
    element: "main",
    title: "Bienvenido a SysPaq",
    description:
      "Tu centro de operaciones courier. Desde aqui ves envios activos, ingresos del mes, entregas pendientes y metricas clave — todo en tiempo real.",
  },
  // 2. Sidebar navigation
  {
    path: "/dashboard",
    element: "aside",
    title: "Navegacion Inteligente",
    description:
      "Todos los modulos de tu courier organizados: operaciones, logistica, flota, facturacion, fiscal y soporte. Un solo sistema para todo.",
    side: "right",
  },
  // 3. Customers
  {
    path: "/customers",
    element: "main",
    title: "Gestion de Clientes",
    description:
      "Cada cliente tiene su casillero unico (ej: BLX-00042). Se registran solos desde tu portal white-label con tu marca, colores y dominio.",
  },
  // 4. Shipments
  {
    path: "/shipments",
    element: "main",
    title: "Envios con 9 Fases de Tracking",
    description:
      "Seguimiento completo desde pre-alerta hasta entrega. Tus clientes ven el estado en tiempo real desde su portal. API y webhooks incluidos.",
  },
  // 5. Pre-alerts
  {
    path: "/pre-alerts",
    element: "main",
    title: "Pre-Alertas de Clientes",
    description:
      "Tus clientes notifican sus compras antes de que lleguen a tu bodega. Sabes que esperar y de quien, reduciendo paquetes sin reclamar.",
  },
  // 6. Receptions
  {
    path: "/receptions",
    element: "main",
    title: "Recepciones en Bodega",
    description:
      "Registra peso, dimensiones y cargos al recibir paquetes. Calculo automatico de peso volumetrico y cargos por tarifa.",
  },
  // 7. Containers
  {
    path: "/containers",
    element: "main",
    title: "Consolidacion de Contenedores",
    description:
      "Maritimo FCL/LCL y aereo. Agrupa envios por contenedor con tracking de buque, B/L y sello. Control total de la carga.",
  },
  // 8. DGA
  {
    path: "/dga",
    element: "main",
    title: "Aduanas & DGA Integrado",
    description:
      "Genera etiquetas DGA con codigo de barras, valores FOB e ITBIS. Despacho aduanal directo — algo que otros sistemas NO ofrecen.",
  },
  // 9. Delivery orders
  {
    path: "/delivery-orders",
    element: "main",
    title: "Ultima Milla",
    description:
      "Ordenes de entrega con asignacion de conductor, firma digital, foto de prueba y GPS. Retiro en sucursal o entrega a domicilio.",
  },
  // 10. Fleet
  {
    path: "/fleet",
    element: "main",
    title: "Gestion de Flota Completa",
    description:
      "Conductores, vehiculos y rutas multi-parada con GPS en vivo. Planifica rutas, rastrea entregas en campo. La competencia NO tiene esto.",
  },
  // 11. Invoices
  {
    path: "/invoices",
    element: "main",
    title: "Facturacion Profesional",
    description:
      "Genera facturas desde recepciones automaticamente. Pago parcial, notas de credito, y pasarelas Stripe y PayPal integradas.",
  },
  // 12. Caja Chica
  {
    path: "/caja-chica",
    element: "main",
    title: "Cajas Chicas por Sucursal",
    description:
      "Control financiero en cada punto de entrega. Abre sesion de caja, registra cobros y gastos, reconcilia al cerrar. Unico en el mercado.",
  },
  // 13. Fiscal
  {
    path: "/fiscal",
    element: "main",
    title: "Compliance Fiscal RD",
    description:
      "NCF automatico al emitir facturas (B01, B02). Reportes DGII 606/607 en un click. Aging de cuentas por cobrar. Listo para la DGII.",
  },
  // 14. Tickets
  {
    path: "/tickets",
    element: "main",
    title: "Help Desk Integrado",
    description:
      "Tus clientes crean tickets desde su portal. Conversacion con notas internas, prioridades, asignacion. Sin herramientas externas.",
  },
  // 15. Analytics
  {
    path: "/analytics",
    element: "main",
    title: "Analytics en Tiempo Real",
    description:
      "KPIs, graficas de tendencia, top clientes, rendimiento de entregas. Toma decisiones basadas en datos, no en intuicion.",
  },
  // 16. Bulk import (migration)
  {
    path: "/bulk-import",
    element: "main",
    title: "Migracion Sin Dolor",
    description:
      "Importa clientes, envios e historial desde CSV. Migra de tu sistema anterior sin perder datos ni operaciones. Te acompanamos.",
  },
];

/**
 * Start the guided tour. Navigates between pages automatically.
 * @param navigate - react-router navigate function
 * @param onComplete - callback when tour finishes
 */
export function startGuidedTour(
  navigate: (path: string) => void,
  onComplete?: () => void,
) {
  let currentStepIndex = 0;

  const driverSteps: DriveStep[] = TOUR_STEPS.map((step, i) => ({
    element: step.element,
    popover: {
      title: step.title,
      description: step.description,
      side: step.side ?? "bottom",
      align: "center" as const,
    },
  }));

  const driverInstance = driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    steps: driverSteps,
    nextBtnText: "Siguiente",
    prevBtnText: "Anterior",
    doneBtnText: "Comenzar Gratis",
    progressText: "{{current}} de {{total}}",
    popoverClass: "syspaq-tour-popover",
    stagePadding: 8,
    stageRadius: 12,
    allowClose: true,
    overlayColor: "rgba(0, 0, 0, 0.6)",
    onNextClick: () => {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex >= TOUR_STEPS.length) {
        driverInstance.destroy();
        onComplete?.();
        return;
      }

      const nextStep = TOUR_STEPS[nextIndex];
      const currentStep = TOUR_STEPS[currentStepIndex];

      if (nextStep.path !== currentStep.path) {
        navigate(nextStep.path);
        // Wait for page to render before advancing
        setTimeout(() => {
          currentStepIndex = nextIndex;
          driverInstance.moveNext();
        }, 400);
      } else {
        currentStepIndex = nextIndex;
        driverInstance.moveNext();
      }
    },
    onPrevClick: () => {
      const prevIndex = currentStepIndex - 1;
      if (prevIndex < 0) return;

      const prevStep = TOUR_STEPS[prevIndex];
      const currentStep = TOUR_STEPS[currentStepIndex];

      if (prevStep.path !== currentStep.path) {
        navigate(prevStep.path);
        setTimeout(() => {
          currentStepIndex = prevIndex;
          driverInstance.movePrevious();
        }, 400);
      } else {
        currentStepIndex = prevIndex;
        driverInstance.movePrevious();
      }
    },
    onDestroyStarted: () => {
      driverInstance.destroy();
    },
  } as Config);

  // Navigate to first page and start
  navigate(TOUR_STEPS[0].path);
  setTimeout(() => {
    driverInstance.drive();
  }, 600);

  return driverInstance;
}
