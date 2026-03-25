import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, DollarSign, Edit2, X, Check } from "lucide-react";
import {
  useAdminTenant,
  useUpdateAdminTenant,
  useRecordPayment,
  type BillingRecord,
} from "@/hooks/use-api";
import { formatCurrency, formatDate } from "@syspaq/ui";

const PLAN_TIERS = ["TRIAL", "STARTER", "GROWTH", "PRO", "ENTERPRISE"];
const PLAN_STATUSES = ["TRIALING", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"];
const BILLING_METHODS = ["AZUL", "CASH", "BANK_TRANSFER", "CHECK", "OTHER"];

const STATUS_COLORS: Record<string, string> = {
  TRIALING: "bg-blue-500/20 text-blue-400",
  ACTIVE: "bg-green-500/20 text-green-400",
  PAST_DUE: "bg-amber-500/20 text-amber-400",
  SUSPENDED: "bg-red-500/20 text-red-400",
  CANCELLED: "bg-gray-500/20 text-gray-400",
};

export default function AdminTenantDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: tenant, isLoading } = useAdminTenant(id!);
  const updateTenant = useUpdateAdminTenant(id!);
  const recordPayment = useRecordPayment(id!);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ plan: "", planStatus: "", periodEnd: "", adminNotes: "" });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    currency: "DOP",
    method: "CASH",
    reference: "",
    notes: "",
    periodEnd: "",
  });

  if (isLoading) {
    return <div className="text-muted text-center py-20">Cargando…</div>;
  }
  if (!tenant) {
    return <div className="text-muted text-center py-20">Tenant no encontrado</div>;
  }

  function startEdit() {
    setEditData({
      plan: tenant!.plan,
      planStatus: tenant!.planStatus,
      periodEnd: tenant!.periodEnd ? tenant!.periodEnd.slice(0, 10) : "",
      adminNotes: tenant!.adminNotes ?? "",
    });
    setEditMode(true);
  }

  async function saveEdit() {
    await updateTenant.mutateAsync({
      plan: editData.plan || undefined,
      planStatus: editData.planStatus || undefined,
      periodEnd: editData.periodEnd ? new Date(editData.periodEnd).toISOString() : undefined,
      adminNotes: editData.adminNotes || undefined,
    });
    setEditMode(false);
  }

  async function submitPayment() {
    if (!paymentData.amount || !paymentData.method) return;
    await recordPayment.mutateAsync({
      amount: parseFloat(paymentData.amount),
      currency: paymentData.currency,
      method: paymentData.method,
      reference: paymentData.reference || undefined,
      notes: paymentData.notes || undefined,
      periodEnd: paymentData.periodEnd ? new Date(paymentData.periodEnd).toISOString() : undefined,
    });
    setShowPaymentDialog(false);
    setPaymentData({ amount: "", currency: "DOP", method: "CASH", reference: "", notes: "", periodEnd: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{tenant.name}</h1>
          <p className="text-muted text-sm">{tenant.slug}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowPaymentDialog(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Registrar pago
          </button>
          {!editMode ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-surface-2 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-surface-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={updateTenant.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Guardar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h2 className="font-medium">Suscripción</h2>
            {editMode ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs text-muted mb-1 block">Plan</span>
                  <select
                    value={editData.plan}
                    onChange={(e) => setEditData((d) => ({ ...d, plan: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    {PLAN_TIERS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-muted mb-1 block">Estado</span>
                  <select
                    value={editData.planStatus}
                    onChange={(e) => setEditData((d) => ({ ...d, planStatus: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    {PLAN_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-muted mb-1 block">Vence</span>
                  <input
                    type="date"
                    value={editData.periodEnd}
                    onChange={(e) => setEditData((d) => ({ ...d, periodEnd: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <Row label="Plan" value={tenant.plan} />
                <Row
                  label="Estado"
                  value={
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[tenant.planStatus] ?? ""}`}>
                      {tenant.planStatus}
                    </span>
                  }
                />
                <Row label="Inicio" value={tenant.periodStart ? formatDate(tenant.periodStart) : "—"} />
                <Row label="Vence" value={tenant.periodEnd ? formatDate(tenant.periodEnd) : "—"} />
                <Row label="Trial hasta" value={tenant.trialEndsAt ? formatDate(tenant.trialEndsAt) : "—"} />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <h2 className="font-medium">Uso</h2>
            <div className="space-y-2 text-sm">
              <Row label="Clientes" value={tenant._count.customers} />
              <Row label="Envíos" value={tenant._count.shipments} />
              <Row label="Usuarios" value={tenant._count.users} />
              <Row label="Creado" value={formatDate(tenant.createdAt)} />
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <h2 className="font-medium">Notas</h2>
            {editMode ? (
              <textarea
                value={editData.adminNotes}
                onChange={(e) => setEditData((d) => ({ ...d, adminNotes: e.target.value }))}
                rows={4}
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="Notas internas…"
              />
            ) : (
              <p className="text-sm text-muted whitespace-pre-wrap">
                {tenant.adminNotes || "Sin notas"}
              </p>
            )}
          </div>

          {/* Users */}
          <div className="rounded-xl border border-border p-4">
            <h2 className="font-medium mb-3">Usuarios</h2>
            <div className="space-y-2">
              {tenant.users.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{u.firstName} {u.lastName}</span>
                    <div className="text-xs text-muted">{u.email}</div>
                  </div>
                  <span className="text-xs text-muted">{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Billing history */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-surface-2 font-medium">
              Historial de pagos
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-muted">Fecha</th>
                  <th className="text-right px-4 py-2 text-muted">Monto</th>
                  <th className="text-left px-4 py-2 text-muted">Método</th>
                  <th className="text-left px-4 py-2 text-muted">Referencia</th>
                  <th className="text-left px-4 py-2 text-muted">Período</th>
                </tr>
              </thead>
              <tbody>
                {tenant.billingRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted">
                      Sin pagos registrados
                    </td>
                  </tr>
                ) : (
                  tenant.billingRecords.map((r) => (
                    <BillingRow key={r.id} record={r} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface rounded-2xl border border-border p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Registrar Pago</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-muted mb-1 block">Monto *</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData((d) => ({ ...d, amount: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted mb-1 block">Moneda</span>
                  <input
                    type="text"
                    value={paymentData.currency}
                    onChange={(e) => setPaymentData((d) => ({ ...d, currency: e.target.value }))}
                    className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-muted mb-1 block">Método *</span>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData((d) => ({ ...d, method: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
                >
                  {BILLING_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-muted mb-1 block">Referencia</span>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData((d) => ({ ...d, reference: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="TXN-123456"
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted mb-1 block">Vence (nuevo período)</span>
                <input
                  type="date"
                  value={paymentData.periodEnd}
                  onChange={(e) => setPaymentData((d) => ({ ...d, periodEnd: e.target.value }))}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted mb-1 block">Notas</span>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData((d) => ({ ...d, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm hover:bg-surface-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitPayment}
                disabled={recordPayment.isPending || !paymentData.amount}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {recordPayment.isPending ? "Guardando…" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function BillingRow({ record }: { record: BillingRecord }) {
  return (
    <tr className="border-b border-border hover:bg-surface-2 transition-colors">
      <td className="px-4 py-2 text-muted">{formatDate(record.paidAt)}</td>
      <td className="px-4 py-2 text-right font-medium">
        {formatCurrency(record.amount, record.currency)}
      </td>
      <td className="px-4 py-2">{record.method}</td>
      <td className="px-4 py-2 text-muted">{record.reference || "—"}</td>
      <td className="px-4 py-2 text-muted text-xs">
        {record.periodEnd ? formatDate(record.periodEnd) : "—"}
      </td>
    </tr>
  );
}
