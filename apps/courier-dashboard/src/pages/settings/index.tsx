import { motion } from "motion/react";
import {
  Settings,
  Building2,
  Key,
  CreditCard,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { formatDateTime } from "@syspaq/ui";
import { useTenantSettings, useApiKeys } from "@/hooks/use-api";

export default function SettingsPage() {
  const { data: tenant, isLoading: tenantLoading } = useTenantSettings();
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys();

  const keyList = apiKeys ?? [];

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
        >
          {keysLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : keyList.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-6">
              No hay claves API registradas.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-[var(--muted-foreground)] italic">
                Las claves API se gestionan desde la linea de comandos.
              </p>
            </>
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
