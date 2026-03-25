import { useMemo } from "react";
import {
  Package,
  PackageCheck,
  Clock,
  DollarSign,
  Users,
  Bell,
  Ship,
  Truck,
  RefreshCw,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/charts/kpi-card";
import { AreaChart } from "@/components/charts/area-chart";
import { DonutChart } from "@/components/charts/pie-chart";
import { KpiSkeleton, ChartSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency } from "@syspaq/ui";
import {
  useOverview,
  useShipmentTimeSeries,
  useRevenueTimeSeries,
  useShipmentsByPhase,
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getLast30Days() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

/* ------------------------------------------------------------------ */
/*  Error state                                                       */
/* ------------------------------------------------------------------ */

function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <p className="text-[var(--muted-foreground)] mb-4">
        No se pudieron cargar los datos. Verifica tu conexion e intenta de nuevo.
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
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { dateFrom, dateTo } = useMemo(getLast30Days, []);

  const overview = useOverview();
  const shipmentTs = useShipmentTimeSeries(dateFrom, dateTo);
  const revenueTs = useRevenueTimeSeries(dateFrom, dateTo);
  const byPhase = useShipmentsByPhase();

  const d = overview.data;

  /* ------ Phase donut data ---------------------------------------- */
  const phaseDonut = useMemo(() => {
    if (!byPhase.data?.data) return [];
    return byPhase.data.data.map((item) => ({
      name: PHASE_LABELS[item.phase] ?? item.phase,
      value: item.count,
      color: PHASE_COLORS[item.phase] ?? "#6b7280",
    }));
  }, [byPhase.data]);

  /* ------ Delivery summary data ----------------------------------- */
  const deliverySummary = d
    ? [
        { label: "Pendientes Hoy", value: d.deliveryOrders.pendingToday, color: "var(--muted-foreground)" },
        { label: "En Transito", value: d.deliveryOrders.inTransitNow, color: "#01B9BF" },
        { label: "Entregados Hoy", value: d.deliveryOrders.deliveredToday, color: "#22C55E" },
        { label: "Fallidos Hoy", value: d.deliveryOrders.failedToday, color: "#EF4444" },
      ]
    : [];

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen general de operaciones"
      />

      {/* ---- Error state ------------------------------------------ */}
      {overview.isError && (
        <ErrorBlock onRetry={() => overview.refetch()} />
      )}

      {/* ---- KPI Row 1 — primary metrics -------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {overview.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : d ? (
          <>
            <KpiCard
              title="Envios Hoy"
              value={d.shipments.createdToday}
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
              title="Pendientes Retiro"
              value={d.receptions.pendingPickup}
              icon={Clock}
              color="#F59E0B"
              index={2}
            />
            <KpiCard
              title="Balance Pendiente"
              value={formatCurrency(d.financial.outstandingBalance)}
              icon={DollarSign}
              color={d.financial.outstandingBalance > 0 ? "#EF4444" : "#22C55E"}
              index={3}
            />
          </>
        ) : null}
      </div>

      {/* ---- KPI Row 2 — secondary metrics ------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {overview.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : d ? (
          <>
            <KpiCard
              title="Clientes Activos"
              value={d.customers.active}
              icon={Users}
              color="#6366F1"
              index={4}
            />
            <KpiCard
              title="Pre-Alertas"
              value={d.preAlerts.pending}
              subtitle={`${d.preAlerts.unmatched} sin vincular`}
              icon={Bell}
              color="#ECB75B"
              index={5}
            />
            <KpiCard
              title="Contenedores"
              value={d.containers.inTransit}
              subtitle={`${d.containers.open} abiertos`}
              icon={Ship}
              color="#06B6D4"
              index={6}
            />
            <KpiCard
              title="Entregas Activas"
              value={d.deliveryOrders.inTransitNow}
              subtitle={`${d.deliveryOrders.failedToday} fallidas hoy`}
              icon={Truck}
              color="#F97316"
              index={7}
            />
          </>
        ) : null}
      </div>

      {/* ---- Charts Row 1 — time series --------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Shipments time series */}
        {shipmentTs.isLoading ? (
          <ChartSkeleton />
        ) : shipmentTs.isError ? (
          <ErrorBlock onRetry={() => shipmentTs.refetch()} />
        ) : shipmentTs.data?.data ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-base font-semibold font-display mb-4">
              Envios — Ultimos 30 dias
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

        {/* Revenue time series */}
        {revenueTs.isLoading ? (
          <ChartSkeleton />
        ) : revenueTs.isError ? (
          <ErrorBlock onRetry={() => revenueTs.refetch()} />
        ) : revenueTs.data?.data ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-base font-semibold font-display mb-4">
              Ingresos — Ultimos 30 dias
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

      {/* ---- Charts Row 2 — donut + delivery summary -------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            {/* Legend */}
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

        {/* Delivery performance summary */}
        {overview.isLoading ? (
          <ChartSkeleton />
        ) : d ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-base font-semibold font-display mb-4">
              Entregas del Dia
            </h2>
            <div className="space-y-4 mt-6">
              {deliverySummary.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {item.label}
                  </span>
                  <span
                    className="text-xl font-bold font-display"
                    style={{ color: item.color }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial quick stats */}
            <hr className="border-[var(--border)] my-5" />
            <h3 className="text-sm font-semibold mb-3">Finanzas</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[var(--muted-foreground)]">Facturado</p>
                <p className="font-semibold">{formatCurrency(d.financial.totalInvoiced)}</p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Cobrado</p>
                <p className="font-semibold text-emerald-400">
                  {formatCurrency(d.financial.totalCollected)}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Pendiente</p>
                <p className="font-semibold text-red-400">
                  {formatCurrency(d.financial.outstandingBalance)}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted-foreground)]">Facturas Vencidas</p>
                <p className="font-semibold text-red-400">{d.financial.overdueCount}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
