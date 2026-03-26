import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Vault,
  Lock,
  Scale,
  Plus,
} from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@syspaq/ui";
import {
  useCajaChicaSessionDetail,
  useCajaChicaTransactions,
} from "@/hooks/use-api";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailCard } from "@/components/shared/detail-card";
import { InfoGrid } from "@/components/shared/info-grid";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { CloseSessionDialog } from "./close-session-dialog";
import { ReconcileDialog } from "./reconcile-dialog";
import { AddTransactionDialog } from "./add-transaction-dialog";
import type { CajaChicaTransaction } from "@/types/api";

const TX_TYPE_COLORS: Record<string, string> = {
  CASH_IN: "bg-emerald-500/15 text-emerald-400",
  CASH_OUT: "bg-red-500/15 text-red-400",
  BANK_DEPOSIT: "bg-blue-500/15 text-blue-400",
  ADJUSTMENT: "bg-amber-500/15 text-amber-400",
  OPENING_BALANCE: "bg-gray-500/15 text-gray-400",
};

const TX_TYPE_LABELS: Record<string, string> = {
  CASH_IN: "Ingreso",
  CASH_OUT: "Retiro",
  BANK_DEPOSIT: "Deposito Bancario",
  ADJUSTMENT: "Ajuste",
  OPENING_BALANCE: "Balance Apertura",
};

const txColumns: Column<CajaChicaTransaction>[] = [
  {
    key: "createdAt",
    header: "Fecha",
    render: (t) => (
      <span className="text-[var(--muted-foreground)]">
        {formatDateTime(t.createdAt)}
      </span>
    ),
  },
  {
    key: "type",
    header: "Tipo",
    render: (t) => {
      const colors = TX_TYPE_COLORS[t.type] ?? "bg-gray-500/15 text-gray-400";
      const label = TX_TYPE_LABELS[t.type] ?? t.type.replace(/_/g, " ");
      return (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            colors,
          )}
        >
          {label}
        </span>
      );
    },
  },
  {
    key: "amount",
    header: "Monto",
    render: (t) => (
      <span
        className={cn(
          "font-semibold font-mono",
          t.type === "CASH_IN" || t.type === "OPENING_BALANCE"
            ? "text-emerald-400"
            : t.type === "CASH_OUT" || t.type === "BANK_DEPOSIT"
              ? "text-red-400"
              : "text-amber-400",
        )}
      >
        {t.type === "CASH_IN" || t.type === "OPENING_BALANCE" ? "+" : "-"}
        {formatCurrency(t.amount, t.currency)}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "balance",
    header: "Balance",
    render: (t) => (
      <span className="font-mono">{formatCurrency(t.balance, t.currency)}</span>
    ),
    className: "text-right",
  },
  {
    key: "description",
    header: "Descripcion",
    render: (t) => (
      <span className="text-[var(--muted-foreground)] max-w-[200px] truncate block">
        {t.description}
      </span>
    ),
  },
  {
    key: "reference",
    header: "Referencia",
    render: (t) => (
      <span className="text-[var(--muted-foreground)] font-mono text-xs">
        {t.reference || "—"}
      </span>
    ),
  },
];

export default function CajaChicaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [txPage, setTxPage] = useState(1);
  const [showClose, setShowClose] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);

  const { data: session, isLoading, isError } = useCajaChicaSessionDetail(id!);
  const { data: txData, isLoading: txLoading } = useCajaChicaTransactions(txPage, 50, id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)] mb-4">No se pudo cargar la sesion de caja.</p>
        <Button variant="outline" onClick={() => navigate("/caja-chica")}>
          Volver a Caja Chica
        </Button>
      </div>
    );
  }

  const isOpen = session.status === "OPEN";
  const isClosed = session.status === "CLOSED";
  const isReconciled = session.status === "RECONCILED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Back */}
      <button
        onClick={() => navigate("/caja-chica")}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Caja Chica
      </button>

      {/* Header Card */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--card)] to-[var(--secondary)]/60 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl",
              isOpen
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-[var(--primary)]/15 text-[var(--primary)]",
            )}
          >
            <Vault className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={session.status} />
            </div>
            <h1 className="text-2xl font-bold font-display">
              Sesion de Caja
              {session.branch && (
                <span className="text-[var(--muted-foreground)] ml-2">
                  — {session.branch.name}
                  <span className="ml-1.5 font-mono text-base">({session.branch.code})</span>
                </span>
              )}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold font-mono">
              {formatCurrency(
                session.closingBalance ?? session.openingBalance,
                session.currency,
              )}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {session.closingBalance != null ? "Balance de Cierre" : "Balance de Apertura"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[var(--border)]/50">
          {isOpen && (
            <>
              <Button
                variant="accent"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowAddTx(true)}
              >
                Agregar Movimiento
              </Button>
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<Lock className="h-4 w-4" />}
                onClick={() => setShowClose(true)}
              >
                Cerrar Sesion
              </Button>
            </>
          )}
          {isClosed && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Scale className="h-4 w-4" />}
              onClick={() => setShowReconcile(true)}
            >
              Reconciliar
            </Button>
          )}
        </div>
      </div>

      {/* Session Info */}
      <div className="mb-6">
        <DetailCard title="Informacion de la Sesion" icon={<Vault className="h-4 w-4" />}>
          <InfoGrid
            columns={3}
            items={[
              {
                label: "Balance Apertura",
                value: formatCurrency(session.openingBalance, session.currency),
              },
              {
                label: "Balance Cierre",
                value: session.closingBalance != null
                  ? formatCurrency(session.closingBalance, session.currency)
                  : "—",
              },
              {
                label: "Conteo Fisico",
                value: session.physicalCount != null
                  ? formatCurrency(session.physicalCount, session.currency)
                  : "—",
              },
              {
                label: "Diferencia",
                value: session.difference != null ? (
                  <span
                    className={cn(
                      "font-semibold",
                      session.difference === 0
                        ? "text-emerald-400"
                        : session.difference < 0
                          ? "text-red-400"
                          : "text-amber-400",
                    )}
                  >
                    {session.difference >= 0 ? "+" : ""}
                    {formatCurrency(session.difference, session.currency)}
                  </span>
                ) : (
                  "—"
                ),
              },
              {
                label: "Apertura",
                value: formatDateTime(session.openedAt),
              },
              {
                label: "Cierre",
                value: session.closedAt ? formatDateTime(session.closedAt) : "—",
              },
            ]}
          />
          {session.notes && (
            <div className="mt-4 pt-3 border-t border-[var(--border)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                Notas
              </p>
              <p className="text-sm text-[var(--foreground)]">{session.notes}</p>
            </div>
          )}
        </DetailCard>
      </div>

      {/* Transactions table */}
      <div className="mb-6">
        <DetailCard title="Movimientos" icon={<Vault className="h-4 w-4" />}>
          <DataTable
            columns={txColumns}
            data={txData?.data ?? []}
            isLoading={txLoading}
            emptyMessage="No hay movimientos registrados"
          />
          <Pagination
            page={txPage}
            totalPages={txData?.meta.totalPages ?? 1}
            onPageChange={setTxPage}
          />
        </DetailCard>
      </div>

      {/* Dialogs */}
      <CloseSessionDialog
        open={showClose}
        onClose={() => setShowClose(false)}
        sessionId={id!}
        currentBalance={session.closingBalance ?? session.openingBalance}
        currency={session.currency}
      />

      {isClosed && (
        <ReconcileDialog
          open={showReconcile}
          onClose={() => setShowReconcile(false)}
          sessionId={id!}
          closingBalance={session.closingBalance ?? 0}
          currency={session.currency}
        />
      )}

      {isOpen && session.branchId && (
        <AddTransactionDialog
          open={showAddTx}
          onClose={() => setShowAddTx(false)}
          branchId={session.branchId}
        />
      )}
    </motion.div>
  );
}
