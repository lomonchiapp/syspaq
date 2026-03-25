import { useState } from "react";
import { Send, MonitorPlay, Copy, Check } from "lucide-react";
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
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

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

            {/* Contact form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {submitted ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-primary-500/30 bg-primary-500/10 p-8 text-center">
                  <div>
                    <p className="font-display text-xl font-semibold text-primary-400">
                      Recibido
                    </p>
                    <p className="mt-2 text-sm text-surface-400">
                      Nos pondremos en contacto contigo pronto.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 rounded-xl border border-surface-700/50 bg-surface-900/50 p-6 sm:p-8"
                >
                  <h3 className="font-display text-lg font-semibold">Solicitar Demo Personalizada</h3>
                  <p className="text-sm text-surface-400">Te contactamos para una demo con tu equipo.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Nombre"
                      required
                      className="rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-sm text-white placeholder:text-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      className="rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-sm text-white placeholder:text-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Empresa"
                      className="rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-sm text-white placeholder:text-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      className="rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-sm text-white placeholder:text-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <textarea
                    placeholder="Cuéntanos sobre tu operación..."
                    rows={3}
                    className="w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-sm text-white placeholder:text-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                  />
                  <Button variant="accent" className="w-full">
                    <Send className="h-4 w-4" />
                    Solicitar Demo
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
