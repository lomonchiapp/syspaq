import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, Building2, User, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/stores/theme.store";
import { cn } from "@syspaq/ui";

function SysPaqLogo() {
  const { mode } = useThemeStore();
  return (
    <img
      src={mode === "dark" ? "/logo-white.png" : "/logo.png"}
      alt="SysPaq"
      className="h-10 w-auto"
    />
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--card-foreground)] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className={cn(
          "w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-sm",
          "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]",
          "transition-colors"
        )}
      />
      {hint && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{hint}</p>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);

  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  // Auto-generate slug from company name
  function handleCompanyNameChange(v: string) {
    setCompanyName(v);
    const generated = v
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40);
    setSlug(generated);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signup({ companyName, slug, email, firstName, lastName, password });
      setApiKey(result.api_key);
      setTenantSlug(result.tenant.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  }

  // Success screen — show API key once
  if (apiKey && tenantSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 shadow-xl">
            <div className="flex flex-col items-center mb-6">
              <SysPaqLogo />
              <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <Check className="h-6 w-6 text-emerald-400" />
              </div>
              <h1 className="mt-3 text-xl font-bold font-display text-[var(--card-foreground)]">
                ¡Cuenta creada!
              </h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)] text-center">
                Tu tenant <strong className="text-[var(--card-foreground)]">{tenantSlug}</strong> está listo.
              </p>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                API Key — guárdala ahora, no se mostrará de nuevo
              </p>
              <div className="flex items-center justify-between gap-3 rounded bg-[var(--background)] border border-[var(--border)] px-3 py-2.5">
                <code className="text-xs font-mono text-[var(--primary)] break-all">{apiKey}</code>
                <CopyButton text={apiKey} />
              </div>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                Tu Tenant ID: <strong className="font-mono text-[var(--foreground)]">{tenantSlug}</strong>
              </p>
            </div>

            <div className="space-y-2 mb-6 text-sm text-[var(--muted-foreground)]">
              <p>Con estas credenciales puedes:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Iniciar sesión en el dashboard con tu email y contraseña</li>
                <li>Consumir la API REST usando la API key</li>
                <li>Crear más claves desde <strong>Ajustes → Claves API</strong></li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/dashboard", { replace: true })}
                className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary)]/90 transition-colors"
              >
                Ir al Dashboard
              </button>
              <a
                href="https://api.syspaq.com/docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              >
                Ver Documentación API
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 shadow-xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <SysPaqLogo />
            <h1 className="mt-4 text-xl font-bold font-display text-[var(--card-foreground)]">
              Crear cuenta
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              14 días gratis — sin tarjeta de crédito
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Nombre de la empresa"
              value={companyName}
              onChange={handleCompanyNameChange}
              placeholder="Mi Courier SRL"
            />

            <Field
              label="Slug del tenant"
              value={slug}
              onChange={setSlug}
              placeholder="mi-courier"
              hint="Letras minúsculas, números y guiones. Usado como ID de tu cuenta."
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Nombre"
                value={firstName}
                onChange={setFirstName}
                placeholder="Juan"
              />
              <Field
                label="Apellido"
                value={lastName}
                onChange={setLastName}
                placeholder="Pérez"
              />
            </div>

            <Field
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="admin@miempresa.com"
            />

            <Field
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Mínimo 8 caracteres"
            />

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold",
                "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors",
                "disabled:opacity-60 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta gratis"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-[var(--primary)] hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
