import { useState } from "react";
import { X, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/stores/auth.store";

const DISMISSED_KEY = "syspaq-demo-banner-dismissed";

export function DemoBanner() {
  const { tenantId, isAuthenticated } = useAuthStore();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === "1",
  );

  // Only show for demo tenant
  const isDemo = isAuthenticated && tenantId === "demo";
  if (!isDemo || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || "";

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ y: -44, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -44, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="sticky top-0 z-[60] flex items-center justify-between gap-4 px-4 py-2.5 text-white"
          style={{
            background: "linear-gradient(135deg, #01b9bf 0%, #0ea5a0 50%, #ecb75b 100%)",
          }}
        >
          <p className="text-xs font-medium opacity-90 hidden sm:block">
            Estas explorando el demo de SysPaq
          </p>

          <p className="text-xs sm:text-sm font-semibold text-center flex-1">
            Crea tu cuenta y empieza a operar tu courier en 30 segundos
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`${dashboardUrl}/register`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30 transition-colors"
            >
              <Rocket className="h-3.5 w-3.5" />
              Comenzar Gratis
            </a>
            <button
              onClick={handleDismiss}
              className="rounded-md p-1 text-white/70 hover:text-white hover:bg-white/15 transition-colors"
              title="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
