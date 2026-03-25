import { useState, useMemo } from "react";
import {
  Package,
  PackageCheck,
  DollarSign,
  Clock,
  TrendingUp,
  Users,
  CreditCard,
  Truck,
  RefreshCw,
} from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/charts/kpi-card";
import { AreaChart } from "@/components/charts/area-chart";
import { DonutChart } from "@/components/charts/pie-chart";
import { KpiSkeleton, ChartSkeleton, Skeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency } from "@syspaq/ui";
import {
  useOverview,
  useShipmentTimeSeries,
  useRevenueTimeSeries,
  useShipmentsByPhase,
  useTopCustomers,
  useDeliveryPerformance,
  usePaymentMethods,
} from "@/hooks/use-api";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PHASE_COLORS: Record<string, string> = {
  CREATED: "#3b82f6",
  RECEIVED: "#06b6d4",
  IN_TRANSIT: "#f59e0b",
  IN_CUSTOMS: "#f97316",
  CLEARED: "#14b8a6",
  OUT_FOR_DELIVERY: "#6366f1",
  DELIVERED: "#22c55e",
  EXCEPTION: "#ef4444",
  RETURNED: "#f43f5e",
};

const PHASE_LABELS: Record<string, string> = {
  CREATED: "Creados",
  RECEIVED: "Recibidos",
  IN_TRANSIT: "En Transito",
  IN_CUSTOMS: "En Aduana",
  CLEARED: "Desaduanados",
  OUT_FOR_DELIVERY: "En Reparto",
  DELIVERED: "Entregados",
  EXCEPTION: "Excepcion",
  RETURNED: "Devueltos",
};

const BAR_COLORS = [
  "#01B9BF",
  "#22C55E",
  "#F59E0B",
  "#6366F1",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getDefaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

/* ------------------------------------------------------------------ */
/*  Error block                                                       */
/* ------------------------------------------------------------------ */

function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <p className="text-[var(--muted-foreground)] mb-4">
        No se pudieron cargar los datos.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
      >
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom bar tooltip                                                */
/* ------------------------------------------------------------------ */

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg">
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-sm text-emerald-400">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function AnalyticsPage() {
  const defaults = useMemo(getDefaultRange, []);
  const [dateFrom, setDateFrom] = useState(defaults.dateFrom);
  const [dateTo, setDateTo] = useState(defaults.dateTo);

  const overview = useOverview();
  const shipmentTs = useShipmentTimeSeries(dateFrom, dateTo);
  const revenueTs = useRevenueTimeSeries(dateFrom, dateTo);
  const byPhase = useShipmentsByPhase();
  const topCustomers = useTopCustomers(dateFrom, dateTo);
  const deliveryPerf = useDeliveryPerformance(dateFrom, dateTo);
  const paymentMethods = usePaymentMethods(dateFrom, dateTo);

  const d = overview.data;

  /* Phase donut data */
  const phaseDonut = useMemo(() => {
    if (!byPhase.data?.data) return [];
    return byPhase.data.data.map((item) => ({
      name: PHASE_LABELS[item.phase] ?? item.phase,
      value: item.count,
      color: PHASE_COLORS[item.phase] ?? "#6b7280",
    }));
  }, [byPhase.data]);

  /* Payment bar chart data */
  const paymentBarData = useMemo(() => {
    if (!paymentMethods.data?.data) return [];
    return paymentMethods.data.data.map((item) => ({
      method: item.method,
      total: item.total,
    }));
  }, [paymentMethods.data]);

  return (
    <div>
      <PageHeader
        title="Analiticas"
        description="Metricas e inteligencia de negocio"
      />

      {/* Date range selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--muted-foreground)]">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--muted-foreground)]">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {overview.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : d ? (
          <>
            <KpiCard
              title="Total Envios"
              value={d.shipments.total}
              icon={Package}
              color="#01B9BF"
              index={0}
            />
            <KpiCard
              title="Entregados Hoy"
              value={d.shipments.deliveredToday}
              icon={PackageCheck}
              color="#22C55E"
              index={1}
            />
            <KpiCard
              title="Facturado Total"
              value={formatCurrency(d.financial.totalInvoiced)}
              icon={DollarSign}
              color="#ECB75B"
              index={2}
            />
            <KpiCard
              title="Balance Pendiente"
              value={formatCurrency(d.financial.outstandingBalance)}
              icon={Clock}
              color={d.financial.outstandingBalance > 0 ? "#EF4444" : "#22C55E"}
              index={3}
            />
          </>
        ) : overview.isError ? (
          <div className="col-span-4">
            <ErrorBlock onRetry={() => overview.refetch()} />
          </div>
        ) : null}
      </div>

      {/* Charts Row 1 -- time series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {shipmentTs.isLoading ? (
          <ChartSkeleton />
        ) : shipmentTs.isError ? (
          <ErrorBlock onRetry={() => shipmentTs.refetch()} />
        ) : shipmentTs.data?.data ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-base font-semibold font-display mb-4">
              Envios en el Periodo
            </h2>
            <AreaChart
              data={shipmentTs.data.data}
              xKey="date"
              series={[
                { key: "created", color: "#01B9BF", label: "Creados" },
                { key: "delivered", color: "#22C55E", label: "Entregados" },
              ]}
            />
          </div>
        ) : null}

        {revenueTs.isLoading ? (
          <ChartSkeleton />
        ) : revenueTs.isError ? (
          <ErrorBlock onRetry={() => revenueTs.refetch()} />
        ) : revenueTs.data?.data ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-base font-semibold font-display mb-4">
              Ingresos en el Periodo
            </h2>
            <AreaChart
              data={revenueTs.data.data}
              xKey="date"
              series={[
                { key: "invoiced", color: "#ECB75B", label: "Facturado" },
                { key: "collected", color: "#22C55E", label: "Cobrado" },
              ]}
              formatValue={(v) => formatCurrency(v)}
            />
          </div>
        ) : null}
      </div>

      {/* Charts Row 2 -- donut + delivery performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Shipments by phase */}
        {byPhase.isLoading ? (
          <ChartSkeleton />
        ) : byPhase.isError ? (
          <ErrorBlock onRetry={() => byPhase.refetch()} />
        ) : phaseDonut.length > 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-base font-semibold font-display mb-4">
              Envios por Fase
            </h2>
            <DonutChart data={phaseDonut} />
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
              {phaseDonut.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[var(--muted-foreground)]">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Delivery Performance */}
        {deliveryPerf.isLoading ? (
          <ChartSkeleton />
        ) : deliveryPerf.isError ? (
          <ErrorBlock onRetry={() => deliveryPerf.refetch()} />
        ) : deliveryPerf.data ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-base font-semibold font-display mb-6">
              Rendimiento de Entregas
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-3">
                  <TrendingUp className="h-7 w-7 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold font-display">
                  {deliveryPerf.data.onTimeRate.toFixed(1)}%
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">Tasa a Tiempo</p>
              </div>
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-3">
                  <Clock className="h-7 w-7 text-blue-400" />
                </div>
                <p className="text-2xl font-bold font-display">
                  {deliveryPerf.data.averageDeliveryDays.toFixed(1)}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">Dias Promedio</p>
              </div>
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 mb-3">
                  <Truck className="h-7 w-7 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold font-display">
                  {deliveryPerf.data.totalDelivered.toLocaleString()}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">Entregados</p>
              </div>
              <div className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-3">
                  <Package className="h-7 w-7 text-red-400" />
                </div>
                <p className="text-2xl font-bold font-display text-red-400">
                  {deliveryPerf.data.totalFailed.toLocaleString()}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">Fallidos</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Row 3 -- Top Customers + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Top Customers */}
        {topCustomers.isLoading ? (
          <ChartSkeleton />
        ) : topCustomers.isError ? (
          <ErrorBlock onRetry={() => topCustomers.refetch()} />
        ) : topCustomers.data?.data ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="text-base font-semibold font-display">
                Top Clientes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Cliente
                    </th>
                    <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Casillero
                    </th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Envios
                    </th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.data.data.map((c, idx) => (
                    <tr
                      key={c.customerId}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-2.5 font-medium">{c.customerName}</td>
                      <td className="py-2.5 font-mono text-[var(--primary)]">
                        {c.casillero}
                      </td>
                      <td className="py-2.5 text-right text-[var(--muted-foreground)]">
                        {c.shipmentCount}
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatCurrency(c.totalSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Payment Methods breakdown */}
        {paymentMethods.isLoading ? (
          <ChartSkeleton />
        ) : paymentMethods.isError ? (
          <ErrorBlock onRetry={() => paymentMethods.refetch()} />
        ) : paymentBarData.length > 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="text-base font-semibold font-display">
                Metodos de Pago
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsBarChart
                data={paymentBarData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <YAxis
                  type="category"
                  dataKey="method"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={24}>
                  {paymentBarData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={BAR_COLORS[idx % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </div>
  );
}
