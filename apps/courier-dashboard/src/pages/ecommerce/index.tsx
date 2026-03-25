import { useState } from "react";
import { motion } from "motion/react";
import {
  Plus,
  ShoppingCart,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { KpiSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@syspaq/ui";
import {
  useEcommerceConnections,
  useCreateConnection,
  useDeleteConnection,
} from "@/hooks/use-api";

const PLATFORM_OPTIONS = [
  { value: "SHOPIFY", label: "Shopify" },
  { value: "WOOCOMMERCE", label: "WooCommerce" },
];

const PLATFORM_STYLES: Record<string, string> = {
  SHOPIFY: "bg-emerald-500/15 text-emerald-400",
  WOOCOMMERCE: "bg-violet-500/15 text-violet-400",
};

export default function EcommercePage() {
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form
  const [platform, setPlatform] = useState("");
  const [shopDomain, setShopDomain] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const { data: connections, isLoading, isError, refetch } = useEcommerceConnections();
  const createMutation = useCreateConnection();
  const deleteMutation = useDeleteConnection();

  const list = connections ?? [];

  const generateSecret = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    const secret = Array.from(arr, (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    setWebhookSecret(secret);
  };

  const handleCreate = async () => {
    if (!platform || !shopDomain.trim()) return;
    try {
      await createMutation.mutateAsync({
        platform,
        shopDomain: shopDomain.trim(),
        webhookSecret: webhookSecret || undefined,
      });
      toast.success("Conexion creada exitosamente");
      setShowCreate(false);
      resetForm();
    } catch {
      toast.error("Error al crear la conexion");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Conexion eliminada");
      setShowDeleteConfirm(null);
    } catch {
      toast.error("Error al eliminar la conexion");
    }
  };

  const resetForm = () => {
    setPlatform("");
    setShopDomain("");
    setWebhookSecret("");
  };

  return (
    <div>
      <PageHeader
        title="E-commerce"
        description="Integraciones con tiendas online"
      >
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          Nueva Conexion
        </Button>
      </PageHeader>

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-6">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar las conexiones.
          </p>
          <Button variant="primary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && list.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)]/10 mb-6">
            <ShoppingCart className="h-10 w-10 text-[var(--primary)] opacity-70" />
          </div>
          <h2 className="text-xl font-bold font-display mb-2">
            Conecta tu primera tienda
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md mb-6">
            Integra tu tienda de Shopify o WooCommerce para sincronizar pedidos
            y envios automaticamente con tu sistema de courier.
          </p>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreate(true)}
          >
            Nueva Conexion
          </Button>
        </div>
      )}

      {/* Connection Cards */}
      {!isLoading && !isError && list.length > 0 && (
        <div className="space-y-4">
          {list.map((conn, idx) => (
            <motion.div
              key={conn.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${PLATFORM_STYLES[conn.platform] ?? "bg-gray-500/15 text-gray-400"}`}
                    >
                      {conn.platform}
                    </span>
                    <StatusBadge
                      status={conn.isActive ? "ACTIVE" : "INACTIVE"}
                    />
                  </div>
                  <p className="text-base font-bold truncate mb-1">
                    {conn.shopDomain}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Conectado desde {formatDate(conn.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(conn.id);
                    }}
                    className="rounded-lg p-2 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          resetForm();
        }}
        title="Nueva Conexion E-commerce"
        description="Conecta tu tienda online para sincronizar pedidos."
      >
        <div className="space-y-4">
          <Select
            label="Plataforma"
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="Selecciona una plataforma"
          />
          <Input
            label="Dominio de la Tienda"
            placeholder="mi-tienda.myshopify.com"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
          />
          <div>
            <Input
              label="Secreto del Webhook"
              placeholder="Se generara automaticamente si se deja vacio"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
            <button
              type="button"
              onClick={generateSecret}
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              Generar secreto
            </button>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={!platform || !shopDomain.trim()}
            >
              Crear Conexion
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Eliminar Conexion"
        size="sm"
      >
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Esta seguro de que desea eliminar esta conexion? Los pedidos ya no se
          sincronizaran automaticamente.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              showDeleteConfirm && handleDelete(showDeleteConfirm)
            }
            isLoading={deleteMutation.isPending}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
