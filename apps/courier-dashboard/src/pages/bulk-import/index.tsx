import { useState } from "react";
import { motion } from "motion/react";
import {
  Upload,
  Users,
  Package,
  Bell,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@syspaq/ui";
import {
  useBulkImports,
  useBulkImportDetail,
  useStartImport,
} from "@/hooks/use-api";
import type { BulkImportItem } from "@/types/api";

const IMPORT_TYPES = [
  {
    type: "customers",
    title: "Clientes",
    description: "Importar clientes con casilleros auto-generados",
    icon: Users,
    color: "var(--primary)",
    placeholder: `[
  { "firstName": "Juan", "lastName": "Perez", "email": "juan@example.com", "phone": "8091234567" }
]`,
  },
  {
    type: "shipments",
    title: "Envios",
    description: "Importar envios con eventos de tracking",
    icon: Package,
    color: "#f59e0b",
    placeholder: `[
  { "trackingNumber": "1Z999AA10123456784", "customerId": "...", "carrier": "UPS" }
]`,
  },
  {
    type: "pre-alerts",
    title: "Pre-Alertas",
    description: "Importar pre-alertas de clientes",
    icon: Bell,
    color: "#8b5cf6",
    placeholder: `[
  { "trackingNumber": "1Z...", "customerId": "...", "description": "Laptop", "estimatedValue": 500 }
]`,
  },
];

const STATUS_MAP: Record<string, string> = {
  COMPLETED: "DELIVERED",
  PROCESSING: "IN_TRANSIT",
  FAILED: "FAILED",
  PENDING: "PENDING",
};

const importColumns: Column<BulkImportItem>[] = [
  {
    key: "type",
    header: "Tipo",
    render: (r) => (
      <span className="capitalize font-semibold">{r.type}</span>
    ),
  },
  {
    key: "totalRows",
    header: "Total",
    render: (r) => r.totalRows,
    className: "text-right",
  },
  {
    key: "succeeded",
    header: "Exitosos",
    render: (r) => (
      <span className="text-emerald-400 font-semibold">{r.succeeded}</span>
    ),
    className: "text-right",
  },
  {
    key: "failed",
    header: "Fallidos",
    render: (r) => (
      <span className={r.failed > 0 ? "text-red-400 font-semibold" : ""}>
        {r.failed}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "status",
    header: "Estado",
    render: (r) => {
      if (r.status === "PROCESSING") {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 text-blue-400 px-2.5 py-0.5 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            PROCESANDO
          </span>
        );
      }
      return <StatusBadge status={STATUS_MAP[r.status] ?? r.status} />;
    },
  },
  {
    key: "createdAt",
    header: "Fecha",
    render: (r) => formatDateTime(r.createdAt),
  },
];

export default function BulkImportPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [importType, setImportType] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [parseError, setParseError] = useState("");
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useBulkImports(page, 20);
  const startImportMutation = useStartImport();
  const { data: detail, isLoading: detailLoading } = useBulkImportDetail(
    showDetail ?? "",
  );

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    setParseError("");
    setParsedCount(null);
    if (!text.trim()) return;
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setParseError("El JSON debe ser un array");
        return;
      }
      setParsedCount(parsed.length);
    } catch {
      setParseError("JSON invalido");
    }
  };

  const handleStartImport = async () => {
    if (!importType || !jsonText.trim()) return;
    try {
      const items = JSON.parse(jsonText);
      await startImportMutation.mutateAsync({ type: importType, items });
      toast.success("Importacion iniciada exitosamente");
      setShowImport(false);
      setJsonText("");
      setParsedCount(null);
      setImportType("");
    } catch {
      toast.error("Error al iniciar la importacion");
    }
  };

  const openImportDialog = (type: string) => {
    setImportType(type);
    setJsonText("");
    setParsedCount(null);
    setParseError("");
    setShowImport(true);
  };

  const currentPlaceholder =
    IMPORT_TYPES.find((t) => t.type === importType)?.placeholder ?? "";

  return (
    <div>
      <PageHeader
        title="Importacion Masiva"
        description="Migrar datos desde otros sistemas"
      />

      {/* Import Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {IMPORT_TYPES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.type}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.07 }}
              className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--primary)] hover:shadow-lg hover:shadow-[var(--primary)]/5 cursor-pointer"
              onClick={() => openImportDialog(item.type)}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
                style={{
                  backgroundColor: `color-mix(in srgb, ${item.color} 12%, transparent)`,
                }}
              >
                <Icon className="h-6 w-6" style={{ color: item.color }} />
              </div>
              <h3 className="text-base font-bold font-display mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {item.description}
              </p>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Importar
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Imports */}
      <div>
        <h2 className="text-lg font-bold font-display mb-4">
          Importaciones Recientes
        </h2>

        {isError && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center mb-4">
            <p className="text-[var(--muted-foreground)] mb-3">
              No se pudieron cargar las importaciones.
            </p>
            <Button variant="primary" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {!isError && (
          <>
            <DataTable
              columns={importColumns}
              data={data?.data ?? []}
              isLoading={isLoading}
              emptyMessage="No hay importaciones registradas"
              onRowClick={(item) => setShowDetail(item.id)}
            />
            <Pagination
              page={page}
              totalPages={data?.meta.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Import Dialog */}
      <Dialog
        open={showImport}
        onClose={() => {
          setShowImport(false);
          setJsonText("");
          setParsedCount(null);
          setParseError("");
        }}
        title={`Importar ${IMPORT_TYPES.find((t) => t.type === importType)?.title ?? ""}`}
        description="Pega un array JSON con los datos a importar."
        size="lg"
      >
        <div className="space-y-4">
          <Textarea
            label="Datos JSON"
            placeholder={currentPlaceholder}
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={10}
            className="font-mono text-xs"
          />

          {/* Parse feedback */}
          {parseError && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {parseError}
            </div>
          )}
          {parsedCount !== null && !parseError && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {parsedCount} elementos detectados
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowImport(false);
                setJsonText("");
                setParsedCount(null);
                setParseError("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStartImport}
              isLoading={startImportMutation.isPending}
              disabled={!parsedCount || !!parseError}
            >
              Iniciar Importacion
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={!!showDetail}
        onClose={() => setShowDetail(null)}
        title="Detalle de Importacion"
        size="lg"
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-2xl font-bold">{detail.totalRows}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Total</p>
              </div>
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {detail.succeeded}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Exitosos
                </p>
              </div>
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-2xl font-bold text-red-400">
                  {detail.failed}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Fallidos
                </p>
              </div>
              <div className="rounded-lg bg-[var(--secondary)] p-3 text-center">
                <p className="text-2xl font-bold">{detail.processed}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Procesados
                </p>
              </div>
            </div>

            {detail.errors && detail.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Errores</h4>
                <div className="max-h-[300px] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--secondary)] divide-y divide-[var(--border)]">
                  {detail.errors.map((err, idx) => (
                    <div key={idx} className="px-4 py-2.5 text-sm">
                      <span className="font-mono text-red-400 mr-2">
                        Fila {err.row}:
                      </span>
                      <span className="text-[var(--muted-foreground)]">
                        {err.error}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!detail.errors || detail.errors.length === 0) && (
              <div className="flex flex-col items-center py-8 text-[var(--muted-foreground)]">
                <CheckCircle2 className="h-10 w-10 mb-3 text-emerald-400 opacity-60" />
                <p className="text-sm">
                  No se registraron errores en esta importacion
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            No se pudo cargar el detalle.
          </p>
        )}
      </Dialog>
    </div>
  );
}
