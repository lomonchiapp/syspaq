import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  Car,
  Route,
  CheckCircle2,
  Play,
} from "lucide-react";
import { cn, formatDate } from "@syspaq/ui";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { KpiSkeleton } from "@/components/shared/loading-skeleton";
import {
  useFleetDashboard,
  useDrivers,
  useVehicles,
  useRoutes,
} from "@/hooks/use-api";
import { CreateDriverDialog } from "./create-driver-dialog";
import { CreateVehicleDialog } from "./create-vehicle-dialog";
import { CreateRouteDialog } from "./create-route-dialog";
import type { Driver, Vehicle, RouteItem } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            color,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold font-mono">{value}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Driver columns                                                     */
/* ------------------------------------------------------------------ */

const driverColumns: Column<Driver>[] = [
  {
    key: "name",
    header: "Nombre",
    render: (d) => (
      <span className="font-semibold">
        {d.firstName} {d.lastName}
      </span>
    ),
  },
  {
    key: "phone",
    header: "Telefono",
    render: (d) => <span className="font-mono text-xs">{d.phone}</span>,
  },
  {
    key: "license",
    header: "Licencia",
    render: (d) => (
      <span className="text-[var(--muted-foreground)]">
        {d.licenseNumber ? `${d.licenseType ?? ""} ${d.licenseNumber}` : "—"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Estado",
    render: (d) => <StatusBadge status={d.status} />,
  },
  {
    key: "vehicle",
    header: "Vehiculo",
    render: (d) =>
      d.vehicle ? (
        <span className="text-xs font-mono">
          {d.vehicle.plate} — {d.vehicle.brand} {d.vehicle.model}
        </span>
      ) : (
        <span className="text-[var(--muted-foreground)]">—</span>
      ),
  },
];

/* ------------------------------------------------------------------ */
/*  Vehicle columns                                                    */
/* ------------------------------------------------------------------ */

const vehicleColumns: Column<Vehicle>[] = [
  {
    key: "plate",
    header: "Placa",
    render: (v) => <span className="font-semibold font-mono">{v.plate}</span>,
  },
  {
    key: "brandModel",
    header: "Marca / Modelo",
    render: (v) => (
      <span>
        {v.brand} {v.model}
        {v.year && (
          <span className="ml-1.5 text-[var(--muted-foreground)] text-xs">({v.year})</span>
        )}
      </span>
    ),
  },
  {
    key: "type",
    header: "Tipo",
    render: (v) => (
      <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--muted-foreground)]">
        {v.type.replace(/_/g, " ")}
      </span>
    ),
  },
  {
    key: "capacity",
    header: "Capacidad",
    render: (v) =>
      v.capacityWeightLbs ? (
        <span className="text-xs font-mono">{v.capacityWeightLbs} lbs</span>
      ) : (
        <span className="text-[var(--muted-foreground)]">—</span>
      ),
  },
  {
    key: "status",
    header: "Estado",
    render: (v) => <StatusBadge status={v.status} />,
  },
  {
    key: "branch",
    header: "Sucursal",
    render: (v) =>
      v.currentBranch ? (
        <span className="text-xs">
          {v.currentBranch.name}{" "}
          <span className="font-mono text-[var(--muted-foreground)]">({v.currentBranch.code})</span>
        </span>
      ) : (
        <span className="text-[var(--muted-foreground)]">—</span>
      ),
  },
];

/* ------------------------------------------------------------------ */
/*  Route columns                                                      */
/* ------------------------------------------------------------------ */

const routeColumns: Column<RouteItem>[] = [
  {
    key: "number",
    header: "Numero",
    render: (r) => <span className="font-semibold font-mono">{r.number}</span>,
  },
  {
    key: "driver",
    header: "Conductor",
    render: (r) =>
      r.driver ? (
        <span>{r.driver.firstName} {r.driver.lastName}</span>
      ) : (
        <span className="text-[var(--muted-foreground)]">—</span>
      ),
  },
  {
    key: "vehicle",
    header: "Vehiculo",
    render: (r) =>
      r.vehicle ? (
        <span className="text-xs font-mono">{r.vehicle.plate}</span>
      ) : (
        <span className="text-[var(--muted-foreground)]">—</span>
      ),
  },
  {
    key: "branch",
    header: "Sucursal",
    render: (r) =>
      r.branch ? (
        <span className="text-xs">{r.branch.name}</span>
      ) : (
        <span className="text-[var(--muted-foreground)]">—</span>
      ),
  },
  {
    key: "stops",
    header: "Paradas",
    render: (r) => (
      <span className="font-mono text-xs">
        {r.completedStops}/{r.totalStops}
      </span>
    ),
  },
  {
    key: "status",
    header: "Estado",
    render: (r) => <StatusBadge status={r.status} />,
  },
  {
    key: "plannedDate",
    header: "Fecha",
    render: (r) => (
      <span className="text-[var(--muted-foreground)]">{formatDate(r.plannedDate)}</span>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "drivers", label: "Conductores" },
  { key: "vehicles", label: "Vehiculos" },
  { key: "routes", label: "Rutas" },
];

export default function FleetPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("drivers");

  const [driverPage, setDriverPage] = useState(1);
  const [vehiclePage, setVehiclePage] = useState(1);
  const [routePage, setRoutePage] = useState(1);

  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [showCreateVehicle, setShowCreateVehicle] = useState(false);
  const [showCreateRoute, setShowCreateRoute] = useState(false);

  const { data: dashData, isLoading: dashLoading } = useFleetDashboard();
  const { data: driversData, isLoading: driversLoading } = useDrivers(driverPage);
  const { data: vehiclesData, isLoading: vehiclesLoading } = useVehicles(vehiclePage);
  const { data: routesData, isLoading: routesLoading } = useRoutes(routePage);

  return (
    <div>
      <PageHeader title="Flota" description="Gestion de conductores, vehiculos y rutas">
        {tab === "drivers" && (
          <button
            onClick={() => setShowCreateDriver(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nuevo Conductor
          </button>
        )}
        {tab === "vehicles" && (
          <button
            onClick={() => setShowCreateVehicle(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nuevo Vehiculo
          </button>
        )}
        {tab === "routes" && (
          <button
            onClick={() => setShowCreateRoute(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Nueva Ruta
          </button>
        )}
      </PageHeader>

      {/* KPI cards */}
      {dashLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      ) : dashData ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard
            label="Conductores Disponibles"
            value={dashData.availableDrivers}
            icon={Users}
            color="bg-emerald-500/15 text-emerald-400"
          />
          <KpiCard
            label="Vehiculos Disponibles"
            value={dashData.availableVehicles}
            icon={Car}
            color="bg-blue-500/15 text-blue-400"
          />
          <KpiCard
            label="Rutas Activas"
            value={dashData.activeRoutes}
            icon={Play}
            color="bg-cyan-500/15 text-cyan-400"
          />
          <KpiCard
            label="Rutas Planificadas"
            value={dashData.plannedRoutes}
            icon={Route}
            color="bg-amber-500/15 text-amber-400"
          />
          <KpiCard
            label="Completadas Hoy"
            value={dashData.completedToday}
            icon={CheckCircle2}
            color="bg-[var(--primary)]/15 text-[var(--primary)]"
          />
        </div>
      ) : null}

      {/* Tabs */}
      <Tabs tabs={TABS} activeTab={tab} onChange={setTab} className="mb-6" />

      {/* Tab: Conductores */}
      {tab === "drivers" && (
        <>
          <DataTable
            columns={driverColumns}
            data={driversData?.data ?? []}
            isLoading={driversLoading}
            emptyMessage="No se encontraron conductores"
            onRowClick={(d) => navigate(`/fleet/drivers/${d.id}`)}
          />
          <Pagination
            page={driverPage}
            totalPages={driversData?.meta.totalPages ?? 1}
            onPageChange={setDriverPage}
          />
        </>
      )}

      {/* Tab: Vehiculos */}
      {tab === "vehicles" && (
        <>
          <DataTable
            columns={vehicleColumns}
            data={vehiclesData?.data ?? []}
            isLoading={vehiclesLoading}
            emptyMessage="No se encontraron vehiculos"
            onRowClick={(v) => navigate(`/fleet/vehicles/${v.id}`)}
          />
          <Pagination
            page={vehiclePage}
            totalPages={vehiclesData?.meta.totalPages ?? 1}
            onPageChange={setVehiclePage}
          />
        </>
      )}

      {/* Tab: Rutas */}
      {tab === "routes" && (
        <>
          <DataTable
            columns={routeColumns}
            data={routesData?.data ?? []}
            isLoading={routesLoading}
            emptyMessage="No se encontraron rutas"
            onRowClick={(r) => navigate(`/fleet/routes/${r.id}`)}
          />
          <Pagination
            page={routePage}
            totalPages={routesData?.meta.totalPages ?? 1}
            onPageChange={setRoutePage}
          />
        </>
      )}

      {/* Dialogs */}
      <CreateDriverDialog open={showCreateDriver} onClose={() => setShowCreateDriver(false)} />
      <CreateVehicleDialog open={showCreateVehicle} onClose={() => setShowCreateVehicle(false)} />
      <CreateRouteDialog open={showCreateRoute} onClose={() => setShowCreateRoute(false)} />
    </div>
  );
}
