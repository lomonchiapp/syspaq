import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { setSession } from "@/lib/store";
import { useBranding } from "@/hooks/useBranding";
import { useSlug, usePortalPath } from "@/hooks/useSlug";

const ID_TYPE_OPTIONS = [
  { value: "", label: "Seleccionar..." },
  { value: "CEDULA", label: "Cedula" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "RNC", label: "RNC" },
  { value: "OTHER", label: "Otro" },
];

export default function Register() {
  const slug = useSlug();
  const p = usePortalPath();
  const navigate = useNavigate();
  const { branding, loading: brandingLoading } = useBranding(slug);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    idType: "",
    idNumber: "",
    preferredBranchId: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const primary = branding?.primaryColor ?? "#01b9bf";

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Nombre y apellido son requeridos");
      return;
    }
    if (!form.email.trim()) {
      setError("El correo es requerido");
      return;
    }
    if (form.password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }
    if (!form.preferredBranchId) {
      setError("Selecciona tu sucursal de retiro");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        preferredBranchId: form.preferredBranchId,
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.idType) payload.idType = form.idType;
      if (form.idNumber.trim()) payload.idNumber = form.idNumber.trim();

      const res = await api.post<{
        access_token: string;
        customer: { id: string; email: string; firstName: string; lastName: string; casillero: string };
      }>(`/portal/${slug}/auth/register`, payload);

      setSession(res.access_token, res.customer);
      navigate(p("/dashboard"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setSubmitting(false);
    }
  }

  if (brandingLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center" />;
  }

  const inputClass =
    "w-full rounded-lg bg-white/10 border border-white/15 px-4 py-2.5 text-white placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition";

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-900 bg-cover bg-center py-12"
      style={branding?.bgImage ? { backgroundImage: `url(${branding.bgImage})` } : {}}
    >
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl bg-gray-900/90 backdrop-blur-sm border border-white/10 p-8 shadow-2xl">
          <div className="flex justify-center mb-4">
            {branding?.logo ? (
              <img src={branding.logo} alt={branding.companyName} className="h-12 object-contain" />
            ) : (
              <span className="text-2xl font-bold text-white">{branding?.companyName}</span>
            )}
          </div>

          <h2 className="text-center text-lg font-semibold text-white mb-1">Crear Cuenta</h2>
          <p className="text-center text-xs text-gray-400 mb-6">
            Registrate para rastrear tus paquetes y gestionar tus envios
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="Nombre"
                required
                className={inputClass}
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              />
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="Apellido"
                required
                className={inputClass}
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              />
            </div>

            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="Correo electronico"
              required
              className={inputClass}
              style={{ "--tw-ring-color": primary } as React.CSSProperties}
            />

            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Contrasena (min. 8 caracteres)"
                required
                minLength={8}
                className={`${inputClass} pr-10`}
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

            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="Telefono (opcional)"
              className={inputClass}
              style={{ "--tw-ring-color": primary } as React.CSSProperties}
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.idType}
                onChange={(e) => update("idType", e.target.value)}
                className={`${inputClass} appearance-none`}
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              >
                {ID_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-gray-900">
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={form.idNumber}
                onChange={(e) => update("idNumber", e.target.value)}
                placeholder="No. documento"
                className={inputClass}
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Sucursal de retiro
              </label>
              <select
                value={form.preferredBranchId}
                onChange={(e) => update("preferredBranchId", e.target.value)}
                required
                className={`${inputClass} appearance-none`}
                style={{ "--tw-ring-color": primary } as React.CSSProperties}
              >
                <option value="" className="bg-gray-900">
                  Selecciona tu sucursal...
                </option>
                {(branding?.branches ?? []).map((b) => (
                  <option key={b.id} value={b.id} className="bg-gray-900">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
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
              {submitting ? "Creando cuenta..." : "Crear Cuenta"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            Ya tienes cuenta?{" "}
            <Link to={p("/login")} className="font-medium hover:underline" style={{ color: primary }}>
              Iniciar Sesion
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
