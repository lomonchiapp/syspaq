import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { setSession } from "@/lib/store";
import { useBranding } from "@/hooks/useBranding";
import { useSlug, usePortalPath } from "@/hooks/useSlug";

export default function Login() {
  const slug = useSlug();
  const p = usePortalPath();
  const navigate = useNavigate();
  const { branding, loading: brandingLoading } = useBranding(slug);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const primary = branding?.primaryColor ?? "#01b9bf";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post<{
        access_token: string;
        customer: { id: string; email: string; firstName: string; lastName: string; casillero: string };
      }>(`/portal/${slug}/auth/login`, { email, password });

      setSession(res.access_token, res.customer);
      navigate(p("/dashboard"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion");
    } finally {
      setSubmitting(false);
    }
  }

  if (brandingLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center" />;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-900 bg-cover bg-center"
      style={branding?.bgImage ? { backgroundImage: `url(${branding.bgImage})` } : {}}
    >
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="rounded-2xl bg-gray-900/90 backdrop-blur-sm border border-white/10 p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            {branding?.logo ? (
              <img src={branding.logo} alt={branding.companyName} className="h-12 object-contain" />
            ) : (
              <span className="text-2xl font-bold text-white">{branding?.companyName}</span>
            )}
          </div>

          {branding?.welcomeText && (
            <p className="text-center text-sm text-gray-400 mb-6">{branding.welcomeText}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Correo electronico"
              className="w-full rounded-lg bg-white/10 border border-white/15 px-4 py-2.5 text-white placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ "--tw-ring-color": primary } as React.CSSProperties}
            />

            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Contrasena"
                className="w-full rounded-lg bg-white/10 border border-white/15 px-4 py-2.5 pr-10 text-white placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: primary }}
            >
              {submitting ? "Entrando..." : "Iniciar Sesion"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            No tienes cuenta?{" "}
            <Link to={p("/register")} className="font-medium hover:underline" style={{ color: primary }}>
              Registrate
            </Link>
          </p>

          <p className="text-center text-[11px] text-gray-600 mt-5">
            Powered by{" "}
            <a href="https://syspaq.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
              SysPaq
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
