import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Mail, Lock, Building2, Loader2 } from "lucide-react";
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

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenant, setTenant] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password, tenant);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
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
              Panel de Gestión
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Inicia sesión para continuar
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--card-foreground)] mb-1.5">
                Empresa
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                  required
                  placeholder="mi-empresa"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-sm",
                    "bg-[var(--background)] border border-[var(--input)]",
                    "text-[var(--card-foreground)] placeholder:text-[var(--muted-foreground)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent",
                    "transition-colors"
                  )}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--card-foreground)] mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="usuario@empresa.com"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-sm",
                    "bg-[var(--background)] border border-[var(--input)]",
                    "text-[var(--card-foreground)] placeholder:text-[var(--muted-foreground)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent",
                    "transition-colors"
                  )}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--card-foreground)] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-sm",
                    "bg-[var(--background)] border border-[var(--input)]",
                    "text-[var(--card-foreground)] placeholder:text-[var(--muted-foreground)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent",
                    "transition-colors"
                  )}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-semibold transition-colors",
                "bg-[var(--primary)] text-[var(--primary-foreground)]",
                "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Autenticando..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
