import { motion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
      className="relative mx-auto mt-16 max-w-5xl"
    >
      {/* Glow behind */}
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary-500/20 via-accent-500/10 to-primary-500/20 blur-2xl" />

      {/* Browser frame */}
      <div className="relative overflow-hidden rounded-xl border border-surface-700/60 bg-surface-900 shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-surface-700/60 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
          <div className="ml-4 h-5 w-64 rounded bg-surface-800" />
        </div>

        {/* Screenshot */}
        <img
          src="/homedash.jpg"
          alt="SysPaq Dashboard"
          className="w-full object-cover object-top"
          loading="eager"
        />
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-32 pb-20">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-primary-500/8 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-accent-500/6 blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-surface-400) 1px, transparent 1px), linear-gradient(90deg, var(--color-surface-400) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-400">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
              Plataforma para Couriers en LATAM
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl"
          >
            Tu operación courier,{" "}
            <span className="bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
              simplificada.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-surface-400 leading-relaxed sm:text-xl"
          >
            Gestiona envíos, recepciones, aduanas, entregas y facturación
            desde una sola plataforma. Con API completa, portal de clientes
            e integraciones e-commerce.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button variant="accent" href="#contacto">
              Comenzar Prueba Gratis
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" href={`${import.meta.env.VITE_DASHBOARD_URL || ""}/demo?tour=1`}>
              <Play className="h-4 w-4" />
              Ver Como Funciona
            </Button>
          </motion.div>
        </div>

        {/* Dashboard mockup */}
        <DashboardMockup />
      </Container>
    </section>
  );
}
