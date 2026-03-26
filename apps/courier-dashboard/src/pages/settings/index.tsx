import { useState } from "react";
import { motion } from "motion/react";
import {
  Settings,
  Building2,
  Key,
  CreditCard,
  Mail,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Globe,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { Dialog } from "@/components/ui/dialog";
import { formatDateTime } from "@syspaq/ui";
import { useTenantSettings, useUpdateTenantSettings, useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/hooks/use-api";
import type { ApiKeyItem } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Create API Key Dialog                                               */
/* ------------------------------------------------------------------ */

function CreateKeyDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (key: ApiKeyItem) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("INTEGRATION");
  const createKey = useCreateApiKey();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await createKey.mutateAsync({ name, role });
    setName("");
    setRole("INTEGRATION");
    onCreated(result);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nueva Clave API" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--card-foreground)] mb-1.5">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Integración Shopify"
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--card-foreground)] mb-1.5">
            Rol
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-colors"
          >
            <option value="INTEGRATION">INTEGRATION</option>
            <option value="OPERATOR">OPERATOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createKey.isPending}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary)]/90 disabled:opacity-60 transition-colors"
          >
            {createKey.isPending ? "Creando..." : "Crear clave"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Raw Key Reveal                                                      */
/* ------------------------------------------------------------------ */

function RawKeyReveal({ rawKey, onDismiss }: { rawKey: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);

  async function handleCopy() {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
        Clave creada — guárdala ahora, no se mostrará de nuevo
      </p>
      <div className="flex items-center gap-2 rounded bg-[var(--background)] border border-[var(--border)] px-3 py-2">
        <code className="flex-1 text-xs font-mono text-[var(--primary)] break-all">
          {visible ? rawKey : rawKey.slice(0, 16) + "••••••••••••••••••••"}
        </code>
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary)]/80"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <button
        onClick={onDismiss}
        className="mt-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        Ya la guardé, ocultar
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const { data: tenant, isLoading: tenantLoading } = useTenantSettings();
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys();
  const revokeKey = useRevokeApiKey();
  const updateSettings = useUpdateTenantSettings();

  const [createOpen, setCreateOpen] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Portal branding form state
  const [portalForm, setPortalForm] = useState({
    portalCompanyName: "",
    portalLogo: "",
    portalPrimaryColor: "#01b9bf",
    portalBgImage: "",
    portalWelcomeText: "",
  });
  const [portalSaved, setPortalSaved] = useState(false);

  // Sync form when tenant data loads
  const [portalInitialized, setPortalInitialized] = useState(false);
  if (tenant && !portalInitialized) {
    setPortalForm({
      portalCompanyName: tenant.portalCompanyName ?? "",
      portalLogo: tenant.portalLogo ?? "",
      portalPrimaryColor: tenant.portalPrimaryColor ?? "#01b9bf",
      portalBgImage: tenant.portalBgImage ?? "",
      portalWelcomeText: tenant.portalWelcomeText ?? "",
    });
    setPortalInitialized(true);
  }

  async function savePortalBranding() {
    await updateSettings.mutateAsync(portalForm);
    setPortalSaved(true);
    setTimeout(() => setPortalSaved(false), 2500);
  }

  const keyList = apiKeys ?? [];

  async function handleRevoke(id: string) {
    if (!confirm("¿Estás seguro de que quieres revocar esta clave? Esta acción no se puede deshacer.")) return;
    setRevokingId(id);
    try {
      await revokeKey.mutateAsync(id);
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <PageHeader
        title="Configuracion"
        description="Ajustes del sistema"
      />

      <div className="space-y-6">
        {/* Tenant Info */}
        <DetailCard
          title="Informacion del Tenant"
          icon={<Building2 className="h-4 w-4" />}
        >
          {tenantLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : tenant ? (
            <>
              <InfoGrid
                columns={2}
                items={[
                  { label: "Nombre", value: tenant.tenantName },
                  { label: "Slug", value: tenant.slug },
                  { label: "Prefijo Casillero", value: tenant.casilleroPrefix },
                  {
                    label: "Contador Casilleros",
                    value: String(tenant.casilleroCounter),
                  },
                ]}
              />
              <p className="mt-4 text-xs text-[var(--muted-foreground)] italic">
                Estos datos son configurados por el administrador del sistema.
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No se pudo cargar la informacion del tenant.
            </p>
          )}
        </DetailCard>

        {/* API Keys */}
        <DetailCard
          title="Claves API"
          icon={<Key className="h-4 w-4" />}
          actions={
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 text-xs rounded-lg border border-[var(--border)] px-3 py-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva clave
            </button>
          }
        >
          {newRawKey && (
            <RawKeyReveal rawKey={newRawKey} onDismiss={() => setNewRawKey(null)} />
          )}

          {keysLoading ? (
            <div className="space-y-3 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : keyList.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-6">
              No hay claves API registradas.
            </p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Prefijo
                    </th>
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Nombre
                    </th>
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Rol
                    </th>
                    <th className="py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Ultimo Uso
                    </th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {keyList.map((key) => (
                    <tr
                      key={key.id}
                      className="border-b border-[var(--border)]/50"
                    >
                      <td className="py-2.5 font-mono text-[var(--primary)]">
                        {key.prefix}...
                      </td>
                      <td className="py-2.5">{key.name}</td>
                      <td className="py-2.5">
                        <StatusBadge status={key.role} />
                      </td>
                      <td className="py-2.5 text-[var(--muted-foreground)]">
                        {key.lastUsedAt
                          ? formatDateTime(key.lastUsedAt)
                          : "Nunca"}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleRevoke(key.id)}
                          disabled={revokingId === key.id}
                          className="text-[var(--muted-foreground)] hover:text-red-400 disabled:opacity-40 transition-colors"
                          title="Revocar clave"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DetailCard>

        {/* Payment Gateways */}
        <DetailCard
          title="Pasarelas de Pago"
          icon={<CreditCard className="h-4 w-4" />}
        >
          {tenantLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : tenant ? (
            <div className="space-y-3">
              <PaymentGatewayRow
                name="Stripe"
                configured={tenant.stripeConfigured}
              />
              <PaymentGatewayRow
                name="PayPal"
                configured={tenant.paypalConfigured}
              />
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No se pudo cargar la configuracion de pagos.
            </p>
          )}
        </DetailCard>

        {/* Portal Branding */}
        <DetailCard
          title="Portal del Cliente"
          icon={<Globe className="h-4 w-4" />}
          actions={
            <a
              href={`${import.meta.env.VITE_PORTAL_URL || "https://portal.syspaq.com"}/${tenant?.slug ?? ""}/login`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Ver portal →
            </a>
          }
        >
          {tenantLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[var(--muted-foreground)]">
                Personaliza el portal que verán los titulares de casilleros al iniciar sesión.
                URL: <code className="text-[var(--primary)]">{import.meta.env.VITE_PORTAL_URL || "https://portal.syspaq.com"}/{tenant?.slug}/login</code>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Nombre visible</span>
                  <input
                    type="text"
                    value={portalForm.portalCompanyName}
                    onChange={(e) => setPortalForm((f) => ({ ...f, portalCompanyName: e.target.value }))}
                    placeholder={tenant?.tenantName ?? "Mi Empresa"}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Color primario</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={portalForm.portalPrimaryColor}
                      onChange={(e) => setPortalForm((f) => ({ ...f, portalPrimaryColor: e.target.value }))}
                      className="h-9 w-12 rounded border border-[var(--border)] bg-[var(--input)] cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={portalForm.portalPrimaryColor}
                      onChange={(e) => setPortalForm((f) => ({ ...f, portalPrimaryColor: e.target.value }))}
                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">URL del logo</span>
                  <input
                    type="url"
                    value={portalForm.portalLogo}
                    onChange={(e) => setPortalForm((f) => ({ ...f, portalLogo: e.target.value }))}
                    placeholder="https://mi-empresa.com/logo.png"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">URL imagen de fondo</span>
                  <input
                    type="url"
                    value={portalForm.portalBgImage}
                    onChange={(e) => setPortalForm((f) => ({ ...f, portalBgImage: e.target.value }))}
                    placeholder="https://mi-empresa.com/bg.jpg"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Mensaje de bienvenida</span>
                  <input
                    type="text"
                    value={portalForm.portalWelcomeText}
                    onChange={(e) => setPortalForm((f) => ({ ...f, portalWelcomeText: e.target.value }))}
                    placeholder="Bienvenido a tu casillero virtual"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </label>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={savePortalBranding}
                  disabled={updateSettings.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary)]/90 disabled:opacity-60 transition-colors"
                >
                  {portalSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {portalSaved ? "Guardado" : updateSettings.isPending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </DetailCard>

        {/* SMTP */}
        <DetailCard
          title="Correo SMTP"
          icon={<Mail className="h-4 w-4" />}
        >
          {tenantLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          ) : tenant ? (
            <>
              <InfoGrid
                columns={3}
                items={[
                  {
                    label: "Host",
                    value: tenant.smtpHost || "No configurado",
                  },
                  {
                    label: "Puerto",
                    value: tenant.smtpPort
                      ? String(tenant.smtpPort)
                      : "—",
                  },
                  {
                    label: "Usuario",
                    value: tenant.smtpUser
                      ? tenant.smtpUser.replace(
                          /(.{3}).*(@.*)$/,
                          "$1***$2",
                        )
                      : "—",
                  },
                ]}
              />
              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    tenant.smtpHost
                      ? "bg-emerald-400"
                      : "bg-gray-400"
                  }`}
                />
                <span className="text-xs text-[var(--muted-foreground)]">
                  {tenant.smtpHost
                    ? "SMTP configurado"
                    : "SMTP no configurado"}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No se pudo cargar la configuracion SMTP.
            </p>
          )}
        </DetailCard>
      </div>

      <CreateKeyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(key) => key.rawKey && setNewRawKey(key.rawKey)}
      />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payment Gateway Row                                                */
/* ------------------------------------------------------------------ */

function PaymentGatewayRow({
  name,
  configured,
}: {
  name: string;
  configured: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)]/50 bg-[var(--secondary)]/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-[var(--muted-foreground)]" />
        <span className="text-sm font-semibold">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            configured ? "bg-emerald-400" : "bg-gray-400"
          }`}
        />
        <span
          className={`text-xs font-medium ${
            configured ? "text-emerald-400" : "text-[var(--muted-foreground)]"
          }`}
        >
          {configured ? "Configurado" : "No configurado"}
        </span>
      </div>
    </div>
  );
}
