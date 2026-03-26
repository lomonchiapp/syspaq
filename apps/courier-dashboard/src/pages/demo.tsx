import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

const DEMO_CREDENTIALS = {
  email: "admin@syspaq-demo.com",
  password: "demo1234",
  tenant: "demo",
};

export default function DemoPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }

    let cancelled = false;

    async function autoLogin() {
      try {
        await login(
          DEMO_CREDENTIALS.email,
          DEMO_CREDENTIALS.password,
          DEMO_CREDENTIALS.tenant,
        );
        if (!cancelled) navigate("/dashboard", { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo acceder al demo. Intenta de nuevo.",
          );
        }
      }
    }

    autoLogin();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="text-center max-w-sm">
          <p className="text-[var(--destructive)] text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              setError("");
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      <p className="text-sm text-[var(--muted-foreground)]">
        Preparando el demo...
      </p>
    </div>
  );
}
