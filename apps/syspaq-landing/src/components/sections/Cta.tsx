import { useState } from "react";
import { MonitorPlay, Copy, Check, Rocket, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const DEMO_CREDENTIALS = {
  tenant: "demo",
  email: "admin@syspaq-demo.com",
  password: "demo1234",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center rounded p-1 text-surface-400 hover:text-primary-400 transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function Cta() {
  return (
    <section id="contacto" className="relative py-24">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-900/10 via-primary-500/5 to-transparent" />

      <Container className="relative">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
              Moderniza tu courier{" "}
              <span className="text-primary-400">hoy</span>
            </h2>
            <p className="mt-4 text-lg text-surface-400">
              Prueba el dashboard con datos reales o solicita una demo personalizada.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Demo sandbox card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-xl border border-primary-500/30 bg-primary-500/5 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20">
                  <MonitorPlay className="h-5 w-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">Probar Demo</h3>
                  <p className="text-xs text-surface-400">Acceso inmediato, sin registro</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-surface-300">
                Explora el dashboard con datos de ejemplo: clientes, envíos, aduanas, facturas y más.
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-lg bg-surface-900/80 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-500">Empresa</span>
                    <CopyButton text={DEMO_CREDENTIALS.tenant} />
                  </div>
                  <code className="mt-1 block text-sm text-primary-300 font-mono">{DEMO_CREDENTIALS.tenant}</code>
                </div>
                <div className="rounded-lg bg-surface-900/80 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-500">Correo</span>
                    <CopyButton text={DEMO_CREDENTIALS.email} />
                  </div>
                  <code className="mt-1 block text-sm text-primary-300 font-mono">{DEMO_CREDENTIALS.email}</code>
                </div>
                <div className="rounded-lg bg-surface-900/80 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-500">Contraseña</span>
                    <CopyButton text={DEMO_CREDENTIALS.password} />
                  </div>
                  <code className="mt-1 block text-sm text-primary-300 font-mono">{DEMO_CREDENTIALS.password}</code>
                </div>
              </div>

              <Button variant="accent" href={import.meta.env.VITE_DASHBOARD_URL || "/dashboard"} className="mt-6 w-full">
                <MonitorPlay className="h-4 w-4" />
                Abrir Dashboard Demo
              </Button>
            </motion.div>

            {/* Signup CTA card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col rounded-xl border border-accent-400/30 bg-accent-400/5 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-400/20">
                  <Rocket className="h-5 w-5 text-accent-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">Crear mi cuenta</h3>
                  <p className="text-xs text-surface-400">14 días gratis — sin tarjeta</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-surface-300">
                Crea tu tenant en segundos. Recibes acceso al dashboard completo y tu primera API key para empezar a integrar.
              </p>

              <ul className="mt-6 space-y-2.5">
                {[
                  "Tenant + usuario admin + API key",
                  "Hasta 100 envíos de prueba",
                  "Documentación API incluida",
                  "Sin contrato, cancela cuando quieras",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-surface-300">
                    <Check className="h-4 w-4 shrink-0 text-accent-400" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3">
                <Button
                  variant="accent"
                  href={`${import.meta.env.VITE_DASHBOARD_URL || ""}/register`}
                  className="w-full"
                >
                  <Rocket className="h-4 w-4" />
                  Empezar gratis
                </Button>
                <a
                  href="#contacto-demo"
                  className="flex items-center justify-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors"
                >
                  ¿Necesitas una demo personalizada?
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
