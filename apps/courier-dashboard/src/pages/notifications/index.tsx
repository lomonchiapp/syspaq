import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Bell, History } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs } from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@syspaq/ui";
import {
  useNotificationTemplates,
  useCreateTemplate,
  useToggleTemplate,
  useNotificationLogs,
} from "@/hooks/use-api";
import type { NotificationTemplateItem, NotificationLogItem } from "@/types/api";

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: "bg-blue-500/15 text-blue-400",
  SMS: "bg-emerald-500/15 text-emerald-400",
  PUSH: "bg-violet-500/15 text-violet-400",
  WEBHOOK: "bg-amber-500/15 text-amber-400",
};

const CHANNEL_OPTIONS = [
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "PUSH", label: "Push" },
  { value: "WEBHOOK", label: "Webhook" },
];

const LOG_STATUS_COLORS: Record<string, string> = {
  SENT: "bg-emerald-500/15 text-emerald-400",
  FAILED: "bg-red-500/15 text-red-400",
  PENDING: "bg-gray-500/15 text-gray-400",
};

function ChannelBadge({ channel }: { channel: string }) {
  const colors = CHANNEL_COLORS[channel] ?? "bg-gray-500/15 text-gray-400";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors}`}
    >
      {channel}
    </span>
  );
}

const templateColumns: Column<NotificationTemplateItem>[] = [
  { key: "event", header: "Evento" },
  {
    key: "channel",
    header: "Canal",
    render: (t) => <ChannelBadge channel={t.channel} />,
  },
  {
    key: "subject",
    header: "Asunto",
    render: (t) => t.subject || "—",
  },
  {
    key: "isActive",
    header: "Estado",
    render: (t) => (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          t.isActive
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-gray-500/15 text-gray-400"
        }`}
      >
        {t.isActive ? "Activo" : "Inactivo"}
      </span>
    ),
  },
];

const logColumns: Column<NotificationLogItem>[] = [
  {
    key: "createdAt",
    header: "Fecha",
    render: (l) => formatDateTime(l.createdAt),
  },
  {
    key: "channel",
    header: "Canal",
    render: (l) => <ChannelBadge channel={l.channel} />,
  },
  {
    key: "recipient",
    header: "Destinatario",
    render: (l) => (
      <span className="max-w-[200px] truncate block">{l.recipient}</span>
    ),
  },
  { key: "event", header: "Evento" },
  {
    key: "status",
    header: "Estado",
    render: (l) => {
      const colors =
        LOG_STATUS_COLORS[l.status] ?? "bg-gray-500/15 text-gray-400";
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors}`}
        >
          {l.status}
        </span>
      );
    },
  },
];

export default function NotificationsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("templates");
  const [logPage, setLogPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  // Form
  const [event, setEvent] = useState("");
  const [channel, setChannel] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const {
    data: templates,
    isLoading: templatesLoading,
    isError: templatesError,
    refetch: refetchTemplates,
  } = useNotificationTemplates();
  const toggleMutation = useToggleTemplate();
  const createMutation = useCreateTemplate();
  const {
    data: logs,
    isLoading: logsLoading,
    isError: logsError,
    refetch: refetchLogs,
  } = useNotificationLogs(logPage, 20);

  const handleCreate = async () => {
    if (!event.trim() || !channel || !body.trim()) return;
    try {
      await createMutation.mutateAsync({
        event: event.trim(),
        channel,
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      toast.success("Plantilla creada exitosamente");
      setShowCreate(false);
      resetForm();
    } catch {
      toast.error("Error al crear la plantilla");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, isActive: !isActive });
    } catch {
      toast.error("Error al cambiar el estado");
    }
  };

  const resetForm = () => {
    setEvent("");
    setChannel("");
    setSubject("");
    setBody("");
  };

  const templateList = templates ?? [];
  const logList = logs?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        description="Plantillas y registros de notificaciones"
      />

      <Tabs
        tabs={[
          { key: "templates", label: "Plantillas" },
          { key: "logs", label: "Historial" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === "templates" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-end mb-4">
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreate(true)}
            >
              Nueva Plantilla
            </Button>
          </div>

          {templatesError && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
              <p className="text-[var(--muted-foreground)] mb-3">
                No se pudieron cargar las plantillas.
              </p>
              <Button variant="primary" onClick={() => refetchTemplates()}>
                Reintentar
              </Button>
            </div>
          )}

          {!templatesError && (
            <DataTable
              columns={[
                ...templateColumns,
                {
                  key: "actions",
                  header: "",
                  render: (t: NotificationTemplateItem) => (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(t.id, t.isActive);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        t.isActive
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--muted)]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          t.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  ),
                  className: "w-16",
                },
              ]}
              data={templateList}
              isLoading={templatesLoading}
              emptyMessage="No hay plantillas configuradas"
            />
          )}
        </motion.div>
      )}

      {activeTab === "logs" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {logsError && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
              <p className="text-[var(--muted-foreground)] mb-3">
                No se pudo cargar el historial.
              </p>
              <Button variant="primary" onClick={() => refetchLogs()}>
                Reintentar
              </Button>
            </div>
          )}

          {!logsError && (
            <>
              <DataTable
                columns={logColumns}
                data={logList}
                isLoading={logsLoading}
                emptyMessage="No hay registros de notificaciones"
              />
              <Pagination
                page={logPage}
                totalPages={logs?.meta.totalPages ?? 1}
                onPageChange={setLogPage}
              />
            </>
          )}
        </motion.div>
      )}

      {/* Create Template Dialog */}
      <Dialog
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          resetForm();
        }}
        title="Nueva Plantilla"
        description="Configura una nueva plantilla de notificacion."
      >
        <div className="space-y-4">
          <Input
            label="Evento"
            placeholder="Ej: shipment.delivered"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
          />
          <Select
            label="Canal"
            options={CHANNEL_OPTIONS}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="Selecciona un canal"
          />
          <Input
            label="Asunto"
            placeholder="Asunto del mensaje (para email)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            label="Cuerpo del Mensaje"
            placeholder="Hola {{customerName}}, tu envio {{trackingNumber}} ha sido..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            Usa {"{{variable}}"} para insertar datos dinamicos en el mensaje.
          </p>
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
              disabled={!event.trim() || !channel || !body.trim()}
            >
              Crear Plantilla
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
