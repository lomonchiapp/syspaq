import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Lock,
  Package,
  FileText,
  User,
} from "lucide-react";
import { cn, formatDateTime } from "@syspaq/ui";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  useTicket,
  useAddTicketComment,
  useAssignTicket,
  useResolveTicket,
  useCloseTicket,
} from "@/hooks/use-api";
import type { TicketComment } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Priority helpers                                                   */
/* ------------------------------------------------------------------ */

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-500/15 text-gray-400",
  MEDIUM: "bg-blue-500/15 text-blue-400",
  HIGH: "bg-amber-500/15 text-amber-400",
  URGENT: "bg-red-500/15 text-red-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const CATEGORY_LABELS: Record<string, string> = {
  SHIPMENT_ISSUE: "Problema con Envio",
  BILLING: "Facturacion",
  DAMAGE: "Dano",
  LOST_PACKAGE: "Paquete Perdido",
  GENERAL: "General",
  OTHER: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En Progreso",
  WAITING_CUSTOMER: "Esperando Cliente",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: ticket, isLoading } = useTicket(id ?? "");
  const toast = useToast();

  const addComment = useAddTicketComment();
  const assignTicket = useAssignTicket();
  const resolveTicket = useResolveTicket();
  const closeTicket = useCloseTicket();

  const [commentBody, setCommentBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [showAssignInput, setShowAssignInput] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of comments when they change
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.comments?.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--muted-foreground)]">
        <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
        <p>Ticket no encontrado</p>
      </div>
    );
  }

  const isClosed = ticket.status === "CLOSED";
  const isResolved = ticket.status === "RESOLVED";

  async function handleSendComment() {
    if (!commentBody.trim()) return;
    try {
      await addComment.mutateAsync({
        ticketId: ticket!.id,
        body: commentBody.trim(),
        isInternal,
      });
      setCommentBody("");
      setIsInternal(false);
      toast.success(isInternal ? "Nota interna agregada" : "Comentario enviado");
    } catch {
      toast.error("Error al enviar comentario");
    }
  }

  async function handleAssign() {
    if (!assigneeId.trim()) return;
    try {
      await assignTicket.mutateAsync({ id: ticket!.id, assignedToId: assigneeId.trim() });
      toast.success("Ticket asignado");
      setShowAssignInput(false);
      setAssigneeId("");
    } catch {
      toast.error("Error al asignar ticket");
    }
  }

  async function handleResolve() {
    try {
      await resolveTicket.mutateAsync(ticket!.id);
      toast.success("Ticket marcado como resuelto");
    } catch {
      toast.error("Error al resolver ticket");
    }
  }

  async function handleClose() {
    try {
      await closeTicket.mutateAsync(ticket!.id);
      toast.success("Ticket cerrado");
    } catch {
      toast.error("Error al cerrar ticket");
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/tickets"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Tickets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================================ */}
        {/*  LEFT COLUMN (2/3)                                           */}
        {/* ============================================================ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket header */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="font-mono text-sm font-semibold text-[var(--primary)]">
                {ticket.number}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="inline-flex items-center rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted-foreground)]">
                {CATEGORY_LABELS[ticket.category] ?? ticket.category}
              </span>
            </div>
            <h1 className="text-xl font-bold font-display">{ticket.subject}</h1>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
              Descripcion
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Comment thread */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-6 py-4">
              <MessageSquare className="h-4 w-4 text-[var(--muted-foreground)]" />
              <h2 className="text-sm font-semibold">
                Conversacion ({ticket.comments?.length ?? 0})
              </h2>
            </div>

            {/* Messages area */}
            <div className="max-h-[500px] overflow-y-auto p-6 space-y-4">
              {(!ticket.comments || ticket.comments.length === 0) && (
                <p className="text-center text-sm text-[var(--muted-foreground)] py-8">
                  No hay comentarios aun. Inicia la conversacion.
                </p>
              )}

              {ticket.comments?.map((comment) => (
                <CommentBubble key={comment.id} comment={comment} />
              ))}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment input */}
            {!isClosed && (
              <div className="border-t border-[var(--border)] p-4 space-y-3">
                {isInternal && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">
                      Nota interna - solo visible para el equipo
                    </span>
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Textarea
                      placeholder={isInternal ? "Escribe una nota interna..." : "Escribe una respuesta..."}
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      className={cn(
                        "min-h-[72px] resize-none",
                        isInternal && "border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/25",
                      )}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          handleSendComment();
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="md"
                      onClick={handleSendComment}
                      isLoading={addComment.isPending}
                      disabled={!commentBody.trim()}
                      leftIcon={<Send className="h-4 w-4" />}
                      className={cn(isInternal && "bg-amber-500 hover:bg-amber-600")}
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border)] bg-[var(--secondary)] text-amber-500 focus:ring-amber-500/25 accent-amber-500"
                  />
                  <span className="text-xs text-[var(--muted-foreground)]">Nota Interna</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/*  RIGHT COLUMN (1/3)                                          */}
        {/* ============================================================ */}
        <div className="space-y-6">
          {/* Info card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Informacion
            </h2>

            <InfoRow label="Estado">
              <StatusBadge status={ticket.status} />
            </InfoRow>

            <InfoRow label="Prioridad">
              <PriorityBadge priority={ticket.priority} />
            </InfoRow>

            <InfoRow label="Categoria">
              <span className="text-sm">{CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
            </InfoRow>

            <InfoRow label="Asignado a">
              <span className="text-sm">
                {ticket.assignedToId ? ticket.assignedToId.slice(0, 8) + "..." : "Sin asignar"}
              </span>
            </InfoRow>

            {ticket.customer && (
              <InfoRow label="Cliente">
                <Link
                  to={`/customers/${ticket.customerId}`}
                  className="text-sm text-[var(--primary)] hover:underline inline-flex items-center gap-1.5"
                >
                  <User className="h-3.5 w-3.5" />
                  {ticket.customer.firstName} {ticket.customer.lastName}
                </Link>
              </InfoRow>
            )}

            {ticket.shipmentId && (
              <InfoRow label="Envio">
                <Link
                  to={`/shipments/${ticket.shipmentId}`}
                  className="text-sm text-[var(--primary)] hover:underline inline-flex items-center gap-1.5"
                >
                  <Package className="h-3.5 w-3.5" />
                  Ver envio
                </Link>
              </InfoRow>
            )}

            {ticket.invoiceId && (
              <InfoRow label="Factura">
                <Link
                  to={`/invoices/${ticket.invoiceId}`}
                  className="text-sm text-[var(--primary)] hover:underline inline-flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver factura
                </Link>
              </InfoRow>
            )}
          </div>

          {/* Actions */}
          {!isClosed && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3">
              <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Acciones
              </h2>

              {/* Assign */}
              {!showAssignInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  leftIcon={<UserCheck className="h-4 w-4" />}
                  onClick={() => setShowAssignInput(true)}
                >
                  Asignar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="ID del agente"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  />
                  <Button size="sm" onClick={handleAssign} isLoading={assignTicket.isPending}>
                    OK
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowAssignInput(false); setAssigneeId(""); }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Resolve */}
              {!isResolved && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={handleResolve}
                  isLoading={resolveTicket.isPending}
                >
                  Resolver
                </Button>
              )}

              {/* Close (only if resolved) */}
              {isResolved && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  leftIcon={<XCircle className="h-4 w-4" />}
                  onClick={handleClose}
                  isLoading={closeTicket.isPending}
                >
                  Cerrar
                </Button>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Linea de Tiempo
            </h2>

            <div className="relative pl-6 space-y-5">
              {/* Vertical line */}
              <div className="absolute left-[9px] top-1 bottom-1 w-px bg-[var(--border)]" />

              <TimelineItem
                label="Creado"
                time={ticket.createdAt}
                active
                color="bg-blue-500"
              />
              <TimelineItem
                label="Asignado"
                time={ticket.assignedToId ? ticket.updatedAt : undefined}
                active={!!ticket.assignedToId}
                color="bg-cyan-500"
              />
              <TimelineItem
                label="Resuelto"
                time={ticket.resolvedAt}
                active={!!ticket.resolvedAt}
                color="bg-emerald-500"
              />
              <TimelineItem
                label="Cerrado"
                time={ticket.closedAt}
                active={!!ticket.closedAt}
                color="bg-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comment bubble                                                     */
/* ------------------------------------------------------------------ */

function CommentBubble({ comment }: { comment: TicketComment }) {
  const isSystem = comment.authorType === "SYSTEM";
  const isCustomer = comment.authorType === "CUSTOMER";
  const isOperator = comment.authorType === "OPERATOR" || comment.authorType === "ADMIN";

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-[var(--muted)]/60 px-4 py-1.5">
          <p className="text-xs italic text-[var(--muted-foreground)]">{comment.body}</p>
          <p className="text-[10px] text-[var(--muted-foreground)]/60 text-center mt-0.5">
            {formatDateTime(comment.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  // Internal note (operator, but internal)
  if (comment.isInternal) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] space-y-1">
          <div className="flex items-center justify-end gap-2 mb-1">
            <Lock className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Nota interna
            </span>
          </div>
          <div className="rounded-2xl rounded-tr-md border-2 border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
              {comment.authorName}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)]/60">
              {formatDateTime(comment.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Customer message (left-aligned)
  if (isCustomer) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] space-y-1">
          <div className="rounded-2xl rounded-tl-md bg-[var(--muted)] px-4 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
              {comment.authorName}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)]/60">
              {formatDateTime(comment.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Operator message (right-aligned, primary color)
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] space-y-1">
        <div className="rounded-2xl rounded-tr-md bg-[var(--primary)] px-4 py-3">
          <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{comment.body}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="text-[10px] font-medium text-[var(--muted-foreground)]">
            {comment.authorName}
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)]/60">
            {formatDateTime(comment.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Priority badge (detail)                                            */
/* ------------------------------------------------------------------ */

function PriorityBadge({ priority }: { priority: string }) {
  const colors = PRIORITY_COLORS[priority] ?? "bg-gray-500/15 text-gray-400";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", colors)}>
      {priority === "URGENT" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Info row                                                           */
/* ------------------------------------------------------------------ */

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-[var(--muted-foreground)] shrink-0">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline item                                                      */
/* ------------------------------------------------------------------ */

function TimelineItem({
  label,
  time,
  active,
  color,
}: {
  label: string;
  time?: string;
  active: boolean;
  color: string;
}) {
  return (
    <div className="relative flex items-start gap-3">
      <div
        className={cn(
          "absolute -left-6 top-0.5 h-[18px] w-[18px] rounded-full border-2 border-[var(--card)] z-10",
          active ? color : "bg-[var(--muted)]",
        )}
      />
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", !active && "text-[var(--muted-foreground)]")}>
          {label}
        </p>
        {time ? (
          <p className="text-[11px] text-[var(--muted-foreground)]">{formatDateTime(time)}</p>
        ) : (
          <p className="text-[11px] text-[var(--muted-foreground)]/50">Pendiente</p>
        )}
      </div>
    </div>
  );
}
