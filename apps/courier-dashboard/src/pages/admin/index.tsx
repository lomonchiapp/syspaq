import { Link } from "react-router-dom";
import { Building2, TrendingUp, Users, AlertCircle, RefreshCw } from "lucide-react";
import { useAdminStats, useAdminTenants, useAdminRenewals } from "@/hooks/use-api";
import { formatCurrency } from "@syspaq/ui";

const STATUS_COLORS: Record<string, string> = {
  TRIALING: "bg-blue-500/20 text-blue-400",
  ACTIVE: "bg-green-500/20 text-green-400",
  PAST_DUE: "bg-amber-500/20 text-amber-400",
  SUSPENDED: "bg-red-500/20 text-red-400",
  CANCELLED: "bg-gray-500/20 text-gray-400",
};

const PLAN_LABELS: Record<string, string> = {
  TRIAL: "Trial",
  STARTER: "Starter",
  GROWTH: "Growth",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

export default function AdminDashboard() {
  const { data: stats } = useAdminStats();
  const { data: tenants, isLoading } = useAdminTenants();
  const { data: renewals } = useAdminRenewals(30);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Panel de Administración</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="w-5 h-5" />}
          label="Total tenants"
          value={stats?.totalTenants ?? "—"}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-green-400" />}
          label="Activos"
          value={stats?.byStatus?.ACTIVE ?? 0}
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-amber-400" />}
          label="Vencidos"
          value={stats?.byStatus?.PAST_DUE ?? 0}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          label="MRR este mes"
          value={formatCurrency(stats?.mrrThisMonth ?? 0, "DOP")}
        />
      </div>

      {/* Upcoming renewals */}
      {renewals && renewals.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 mb-3 text-amber-400 font-medium">
            <RefreshCw className="w-4 h-4" />
            Vencen en 30 días ({renewals.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {renewals.map((t) => (
              <Link
                key={t.id}
                to={`/admin/tenants/${t.id}`}
                className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/30 transition-colors"
              >
                {t.name} — {t.periodEnd ? new Date(t.periodEnd).toLocaleDateString("es-DO") : "—"}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tenants table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="text-left px-4 py-3 text-muted">Empresa</th>
              <th className="text-left px-4 py-3 text-muted">Plan</th>
              <th className="text-left px-4 py-3 text-muted">Estado</th>
              <th className="text-right px-4 py-3 text-muted">Clientes</th>
              <th className="text-right px-4 py-3 text-muted">Envíos</th>
              <th className="text-left px-4 py-3 text-muted">Próx. renovación</th>
              <th className="text-right px-4 py-3 text-muted">Último pago</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted">
                  Cargando…
                </td>
              </tr>
            ) : tenants?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted">
                  No hay tenants
                </td>
              </tr>
            ) : (
              tenants?.map((t) => (
                <tr key={t.id} className="border-b border-border hover:bg-surface-2 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/tenants/${t.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {t.name}
                    </Link>
                    <div className="text-xs text-muted">{t.slug}</div>
                  </td>
                  <td className="px-4 py-3">{PLAN_LABELS[t.plan] ?? t.plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.planStatus] ?? ""}`}
                    >
                      {t.planStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{t._count.customers}</td>
                  <td className="px-4 py-3 text-right">{t._count.shipments}</td>
                  <td className="px-4 py-3 text-muted">
                    {t.periodEnd
                      ? new Date(t.periodEnd).toLocaleDateString("es-DO")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">
                    {t.billingRecords[0]
                      ? formatCurrency(t.billingRecords[0].amount, t.billingRecords[0].currency)
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <div className="flex items-center gap-2 text-muted mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
