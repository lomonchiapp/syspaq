import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Package, FileText, LogOut, ChevronRight, Box } from "lucide-react";
import { api } from "@/lib/api";
import { clearSession, getCustomer, isAuthenticated } from "@/lib/store";
import { useBranding } from "@/hooks/useBranding";
import { useSlug, usePortalPath } from "@/hooks/useSlug";
import { formatDate } from "@syspaq/ui";

const PHASE_LABELS: Record<string, string> = {
  CREATED: "Creado",
  IN_TRANSIT: "En tránsito",
  AT_WAREHOUSE: "En almacén",
  IN_CUSTOMS: "En aduana",
  OUT_FOR_DELIVERY: "En camino",
  DELIVERED: "Entregado",
  RETURNED: "Devuelto",
  EXCEPTION: "Excepción",
};

const PHASE_COLORS: Record<string, string> = {
  CREATED: "bg-gray-500/20 text-gray-400",
  IN_TRANSIT: "bg-blue-500/20 text-blue-400",
  AT_WAREHOUSE: "bg-indigo-500/20 text-indigo-400",
  IN_CUSTOMS: "bg-amber-500/20 text-amber-400",
  OUT_FOR_DELIVERY: "bg-cyan-500/20 text-cyan-400",
  DELIVERED: "bg-green-500/20 text-green-400",
  RETURNED: "bg-red-500/20 text-red-400",
  EXCEPTION: "bg-red-500/20 text-red-400",
};

interface Shipment {
  id: string;
  trackingNumber: string;
  reference: string | null;
  currentPhase: string;
  createdAt: string;
  events: { type: string; rawStatus: string | null; occurredAt: string }[];
}

interface Invoice {
  id: string;
  number: string;
  total: string;
  currency: string;
  status: string;
  dueAt: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const slug = useSlug();
  const p = usePortalPath();
  const navigate = useNavigate();
  const { branding } = useBranding(slug);
  const customer = getCustomer();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [activeTab, setActiveTab] = useState<"shipments" | "invoices">("shipments");

  const primary = branding?.primaryColor ?? "#01b9bf";

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(p("/login"), { replace: true });
      return;
    }
    api.get<{ data: Shipment[] }>("/portal/me/shipments")
      .then((r) => setShipments(r.data))
      .catch(() => {})
      .finally(() => setLoadingShipments(false));

    api.get<{ data: Invoice[] }>("/portal/me/invoices")
      .then((r) => setInvoices(r.data))
      .catch(() => {});
  }, [slug, navigate]);

  function handleLogout() {
    clearSession();
    navigate(p("/login"));
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {branding?.logo ? (
              <img src={branding.logo} alt={branding.companyName} className="h-8 object-contain" />
            ) : (
              <span className="font-bold text-lg">{branding?.companyName}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">
              {customer?.firstName} {customer?.lastName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Casillero card */}
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${primary}dd, ${primary}88)` }}
        >
          <p className="text-sm opacity-80 mb-1">Tu casillero</p>
          <p className="text-4xl font-bold tracking-wider font-mono">{customer?.casillero}</p>
          <p className="text-sm opacity-70 mt-2">
            {customer?.firstName} {customer?.lastName} · {customer?.email}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10">
          {(["shipments", "invoices"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-current text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
              style={activeTab === tab ? { borderColor: primary, color: primary } : {}}
            >
              {tab === "shipments" ? (
                <><Package className="h-4 w-4" /> Paquetes</>
              ) : (
                <><FileText className="h-4 w-4" /> Facturas</>
              )}
            </button>
          ))}
        </div>

        {/* Shipments tab */}
        {activeTab === "shipments" && (
          <div className="space-y-3">
            {loadingShipments ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-800/50 animate-pulse" />
              ))
            ) : shipments.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Box className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No tienes paquetes registrados</p>
              </div>
            ) : (
              shipments.map((s) => (
                <Link
                  key={s.id}
                  to={p(`/shipments/${s.id}`)}
                  className="flex items-center justify-between rounded-xl bg-gray-900 border border-white/8 p-4 hover:border-white/20 transition"
                >
                  <div className="space-y-1">
                    <p className="font-mono text-sm font-medium">{s.trackingNumber}</p>
                    {s.reference && (
                      <p className="text-xs text-gray-500">{s.reference}</p>
                    )}
                    <p className="text-xs text-gray-500">{formatDate(s.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PHASE_COLORS[s.currentPhase] ?? "bg-gray-500/20 text-gray-400"}`}>
                      {PHASE_LABELS[s.currentPhase] ?? s.currentPhase}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Invoices tab */}
        {activeTab === "invoices" && (
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No tienes facturas registradas</p>
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl bg-gray-900 border border-white/8 p-4">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{inv.number}</p>
                    <p className="text-xs text-gray-500">
                      {inv.dueAt ? `Vence: ${formatDate(inv.dueAt)}` : formatDate(inv.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      inv.status === "PAID" ? "bg-green-500/20 text-green-400" :
                      inv.status === "OVERDUE" ? "bg-red-500/20 text-red-400" :
                      "bg-amber-500/20 text-amber-400"
                    }`}>
                      {inv.status === "PAID" ? "Pagada" : inv.status === "OVERDUE" ? "Vencida" : "Pendiente"}
                    </span>
                    <span className="font-semibold text-sm">
                      {inv.currency} {Number(inv.total).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
