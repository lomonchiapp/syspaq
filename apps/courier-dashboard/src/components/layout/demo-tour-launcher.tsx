import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Play } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { startGuidedTour } from "@/lib/guided-tour";

/**
 * Detects demo mode and either auto-starts the tour (if ?tour=1)
 * or shows a floating "Iniciar Tour" button.
 */
export function DemoTourLauncher() {
  const { tenantId, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tourActive, setTourActive] = useState(false);
  const tourStarted = useRef(false);

  const isDemo = isAuthenticated && tenantId === "demo";
  const shouldAutoStart = searchParams.get("tour") === "1";

  // Auto-start tour if ?tour=1
  useEffect(() => {
    if (!isDemo || !shouldAutoStart || tourStarted.current) return;
    tourStarted.current = true;

    // Remove the query param
    const params = new URLSearchParams(searchParams);
    params.delete("tour");
    setSearchParams(params, { replace: true });

    // Small delay to let the page render
    setTimeout(() => {
      setTourActive(true);
      startGuidedTour(navigate, () => {
        setTourActive(false);
        // Navigate to register after tour completes
        const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || "";
        window.location.href = `${dashboardUrl}/register`;
      });
    }, 800);
  }, [isDemo, shouldAutoStart]);

  const handleStartTour = () => {
    setTourActive(true);
    startGuidedTour(navigate, () => {
      setTourActive(false);
    });
  };

  if (!isDemo || tourActive) return null;

  return (
    <button
      onClick={handleStartTour}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/25 hover:brightness-110 transition-all hover:scale-105"
      title="Ver tour guiado de SysPaq"
    >
      <Play className="h-4 w-4" />
      Iniciar Tour
    </button>
  );
}
