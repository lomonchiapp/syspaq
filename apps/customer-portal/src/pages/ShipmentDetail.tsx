import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { isAuthenticated } from "@/lib/store";
import { useBranding } from "@/hooks/useBranding";
import { useSlug, usePortalPath } from "@/hooks/useSlug";
import { formatDate } from "@syspaq/ui";

const PHASE_LABELS: Record<string, string> = {
  CREATED: "Creado",
  IN_TRANSIT: "En transito",
  AT_WAREHOUSE: "En almacen",
  IN_CUSTOMS: "En aduana",
  OUT_FOR_DELIVERY: "En camino",
  DELIVERED: "Entregado",
  RETURNED: "Devuelto",
  EXCEPTION: "Excepcion",
};

interface TrackingEvent {
  type: string;
  rawStatus: string | null;
  occurredAt: string;
  location?: { city?: string; country?: string } | null;
}

interface ShipmentDetailData {
  id: string;
  trackingNumber: string;
  reference: string | null;
  currentPhase: string;
  createdAt: string;
  events: TrackingEvent[];
}

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const slug = useSlug();
  const p = usePortalPath();
  const navigate = useNavigate();
  const { branding } = useBranding(slug);
  const [shipment, setShipment] = useState<ShipmentDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const primary = branding?.primaryColor ?? "#01b9bf";

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate(p("/login"), { replace: true });
      return;
    }
    api.get<ShipmentDetailData>(`/portal/me/shipments/${id}`)
      .then(setShipment)
      .catch(() => navigate(p("/dashboard")))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-white/10 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={p("/dashboard")} className="text-gray-400 hover:text-white transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {branding?.logo ? (
            <img src={branding.logo} alt={branding.companyName} className="h-7 object-contain" />
          ) : (
            <span className="font-bold">{branding?.companyName}</span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-800/50 animate-pulse" />
            ))}
          </div>
        ) : shipment ? (
          <>
            <div className="rounded-2xl bg-gray-900 border border-white/10 p-5 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Numero de tracking</p>
              <p className="text-2xl font-mono font-bold">{shipment.trackingNumber}</p>
              {shipment.reference && <p className="text-sm text-gray-400">{shipment.reference}</p>}
              <span
                className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${primary}25`, color: primary }}
              >
                {PHASE_LABELS[shipment.currentPhase] ?? shipment.currentPhase}
              </span>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Historial de eventos
              </h2>
              <div className="relative pl-6 space-y-0">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-white/10" />

                {shipment.events.length === 0 ? (
                  <p className="text-sm text-gray-500">Sin eventos registrados aun</p>
                ) : (
                  shipment.events.map((ev, i) => (
                    <div key={i} className="relative pb-6 last:pb-0">
                      <div
                        className="absolute -left-[18px] mt-1 h-3 w-3 rounded-full border-2"
                        style={{
                          borderColor: i === 0 ? primary : "rgb(75 85 99)",
                          backgroundColor: i === 0 ? primary : "rgb(17 24 39)",
                        }}
                      />
                      <div className="bg-gray-900 border border-white/8 rounded-xl p-4 space-y-1">
                        <p className="font-medium text-sm">
                          {ev.rawStatus ?? ev.type}
                        </p>
                        {ev.location && (ev.location.city || ev.location.country) && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[ev.location.city, ev.location.country].filter(Boolean).join(", ")}
                          </p>
                        )}
                        <p className="text-xs text-gray-600">{formatDate(ev.occurredAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
