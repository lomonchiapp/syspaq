import { useState } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Webhook,
  Copy,
  Play,
  Trash2,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { KpiSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@syspaq/ui";
import {
  useWebhooks,
  useCreateWebhook,
  useTestWebhook,
  useToggleWebhook,
  useDeleteWebhook,
} from "@/hooks/use-api";

const AVAILABLE_EVENTS = [
  "shipment.created",
  "shipment.delivered",
  "reception.created",
  "invoice.issued",
  "delivery.completed",
  "pre-alert.created",
];

const EVENT_COLORS: Record<string, string> = {
  "shipment.created": "bg-blue-500/15 text-blue-400",
  "shipment.delivered": "bg-emerald-500/15 text-emerald-400",
  "reception.created": "bg-cyan-500/15 text-cyan-400",
  "invoice.issued": "bg-amber-500/15 text-amber-400",
  "delivery.completed": "bg-indigo-500/15 text-indigo-400",
  "pre-alert.created": "bg-violet-500/15 text-violet-400",
};

export default function WebhooksPage() {
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: webhooks, isLoading, isError, refetch } = useWebhooks();
  const createMutation = useCreateWebhook();
  const testMutation = useTestWebhook();
  const toggleMutation = useToggleWebhook();
  const deleteMutation = useDeleteWebhook();

  const list = webhooks ?? [];

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
    );
  };

  const handleCreate = async () => {
    if (!url.trim() || selectedEvents.length === 0) return;
    try {
      await createMutation.mutateAsync({
        url: url.trim(),
        events: selectedEvents,
      });
      toast.success("Webhook creado exitosamente");
      setShowCreate(false);
      setUrl("");
      setSelectedEvents([]);
    } catch {
      toast.error("Error al crear el webhook");
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await testMutation.mutateAsync(id);
      if (result.success) {
        toast.success("Webhook respondio correctamente");
      } else {
        toast.error("El webhook no respondio correctamente");
      }
    } catch {
      toast.error("Error al probar el webhook");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, isActive: !isActive });
      toast.success(isActive ? "Webhook desactivado" : "Webhook activado");
    } catch {
      toast.error("Error al cambiar el estado");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Webhook eliminado");
      setShowDeleteConfirm(null);
    } catch {
      toast.error("Error al eliminar el webhook");
    }
  };

  const copySecret = (id: string, secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    toast.success("Secreto copiado al portapapeles");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Webhooks"
        description="Suscripciones a eventos"
      >
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreate(true)}
        >
          Nuevo Webhook
        </Button>
      </PageHeader>

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-6">
          <p className="text-[var(--muted-foreground)] mb-3">
            No se pudieron cargar los webhooks.
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
        <div className="flex flex-col items-center justify-center py-20 text-[var(--muted-foreground)]">
          <Webhook className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-semibold mb-1">Sin webhooks</p>
          <p className="text-sm mb-4">
            Crea tu primer webhook para recibir notificaciones de eventos.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Crear Webhook
          </Button>
        </div>
      )}

      {/* Webhook Cards */}
      {!isLoading && !isError && list.length > 0 && (
        <div className="space-y-4">
          {list.map((wh, idx) => (
            <motion.div
              key={wh.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Left content */}
                <div className="flex-1 min-w-0">
                  {/* URL */}
                  <p className="font-mono text-sm truncate mb-3 text-[var(--foreground)]">
                    {wh.url}
                  </p>

                  {/* Events */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {wh.events.map((event) => (
                      <span
                        key={event}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${EVENT_COLORS[event] ?? "bg-gray-500/15 text-gray-400"}`}
                      >
                        {event}
                      </span>
                    ))}
                  </div>

                  {/* Secret + Date */}
                  <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1.5">
                      Secreto:
                      <code className="font-mono">
                        {"••••••••" + wh.secret.slice(-4)}
                      </code>
                      <button
                        onClick={() => copySecret(wh.id, wh.secret)}
                        className="rounded p-0.5 hover:bg-[var(--muted)] transition-colors"
                      >
                        {copiedId === wh.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </span>
                    <span>Creado: {formatDate(wh.createdAt)}</span>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggle(wh.id, wh.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      wh.isActive
                        ? "bg-[var(--primary)]"
                        : "bg-[var(--muted)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        wh.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Play className="h-3.5 w-3.5" />}
                    onClick={() => handleTest(wh.id)}
                    isLoading={testMutation.isPending}
                  >
                    Probar
                  </Button>

                  <button
                    onClick={() => setShowDeleteConfirm(wh.id)}
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
          setUrl("");
          setSelectedEvents([]);
        }}
        title="Nuevo Webhook"
        description="Configura la URL y los eventos que deseas escuchar."
      >
        <div className="space-y-4">
          <Input
            label="URL del Endpoint"
            placeholder="https://tu-servidor.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Eventos
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_EVENTS.map((event) => (
                <label
                  key={event}
                  className="flex items-center gap-2 cursor-pointer rounded-lg border border-[var(--border)] px-3 py-2 transition-colors hover:bg-[var(--muted)]/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
                  />
                  <span className="text-sm">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-[var(--muted-foreground)]">
            El secreto se generara automaticamente al crear el webhook.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                setUrl("");
                setSelectedEvents([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={!url.trim() || selectedEvents.length === 0}
            >
              Crear Webhook
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Eliminar Webhook"
        size="sm"
      >
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Esta seguro de que desea eliminar este webhook? Ya no recibira
          notificaciones de eventos.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
            isLoading={deleteMutation.isPending}
          >
            Eliminar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
