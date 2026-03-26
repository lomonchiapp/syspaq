import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { CajaChicaStatus, CajaChicaTxType, Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { OpenSessionDto } from "./dto/open-session.dto";
import { CloseSessionDto } from "./dto/close-session.dto";
import { ReconcileSessionDto } from "./dto/reconcile-session.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { ListSessionsQueryDto } from "./dto/list-sessions-query.dto";
import { ListTransactionsQueryDto } from "./dto/list-transactions-query.dto";

@Injectable()
export class CajaChicaService {
  constructor(private readonly prisma: PrismaService) {}

  async openSession(tenantId: string, dto: OpenSessionDto, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Validate branch exists and belongs to tenant
      const branch = await tx.branch.findFirst({
        where: { id: dto.branchId, tenantId, isActive: true },
      });
      if (!branch) {
        throw new NotFoundException(
          `Branch ${dto.branchId} not found`,
        );
      }

      // Check no OPEN session for this branch
      const existingOpen = await tx.cajaChicaSession.findFirst({
        where: {
          tenantId,
          branchId: dto.branchId,
          status: CajaChicaStatus.OPEN,
        },
      });
      if (existingOpen) {
        throw new ConflictException(
          `Branch ${branch.name} already has an open session`,
        );
      }

      // Create session
      const session = await tx.cajaChicaSession.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          openedById: actorId,
          openingBalance: dto.openingBalance ?? 0,
          currency: dto.currency ?? "USD",
          notes: dto.notes,
          status: CajaChicaStatus.OPEN,
        },
        include: { branch: true },
      });

      // If openingBalance > 0, create OPENING_BALANCE transaction
      if ((dto.openingBalance ?? 0) > 0) {
        await tx.cajaChicaTransaction.create({
          data: {
            tenantId,
            sessionId: session.id,
            branchId: dto.branchId,
            type: CajaChicaTxType.OPENING_BALANCE,
            amount: dto.openingBalance!,
            balance: dto.openingBalance!,
            currency: dto.currency ?? "USD",
            description: "Balance inicial de apertura",
            createdById: actorId,
          },
        });
      }

      return session;
    });
  }

  async closeSession(
    tenantId: string,
    sessionId: string,
    dto: CloseSessionDto,
    actorId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.cajaChicaSession.findFirst({
        where: { id: sessionId, tenantId },
      });
      if (!session) {
        throw new NotFoundException(`Session ${sessionId} not found`);
      }
      if (session.status !== CajaChicaStatus.OPEN) {
        throw new BadRequestException(
          `Session is not open (current status: ${session.status})`,
        );
      }

      // Get last transaction balance or fall back to openingBalance
      const lastTx = await tx.cajaChicaTransaction.findFirst({
        where: { sessionId, tenantId },
        orderBy: { createdAt: "desc" },
      });
      const closingBalance = lastTx
        ? Number(lastTx.balance)
        : Number(session.openingBalance);

      return tx.cajaChicaSession.update({
        where: { id: sessionId },
        data: {
          status: CajaChicaStatus.CLOSED,
          closingBalance,
          closedAt: new Date(),
          closedById: actorId,
          notes: dto.notes
            ? session.notes
              ? `${session.notes}\n${dto.notes}`
              : dto.notes
            : session.notes,
        },
        include: { branch: true },
      });
    });
  }

  async reconcileSession(
    tenantId: string,
    sessionId: string,
    dto: ReconcileSessionDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.cajaChicaSession.findFirst({
        where: { id: sessionId, tenantId },
      });
      if (!session) {
        throw new NotFoundException(`Session ${sessionId} not found`);
      }
      if (session.status !== CajaChicaStatus.CLOSED) {
        throw new BadRequestException(
          `Session must be CLOSED to reconcile (current status: ${session.status})`,
        );
      }

      const closingBalance = Number(session.closingBalance ?? 0);
      const difference = dto.physicalCount - closingBalance;

      // If there is a difference, create an ADJUSTMENT transaction
      if (difference !== 0) {
        const lastTx = await tx.cajaChicaTransaction.findFirst({
          where: { sessionId, tenantId },
          orderBy: { createdAt: "desc" },
        });
        const currentBalance = lastTx
          ? Number(lastTx.balance)
          : Number(session.openingBalance);

        await tx.cajaChicaTransaction.create({
          data: {
            tenantId,
            sessionId,
            branchId: session.branchId,
            type: CajaChicaTxType.ADJUSTMENT,
            amount: Math.abs(difference),
            balance: currentBalance + difference,
            currency: session.currency,
            description:
              difference > 0
                ? `Ajuste de reconciliación: sobrante de ${Math.abs(difference).toFixed(2)}`
                : `Ajuste de reconciliación: faltante de ${Math.abs(difference).toFixed(2)}`,
          },
        });
      }

      return tx.cajaChicaSession.update({
        where: { id: sessionId },
        data: {
          physicalCount: dto.physicalCount,
          difference,
          status: CajaChicaStatus.RECONCILED,
          notes: dto.notes
            ? session.notes
              ? `${session.notes}\n${dto.notes}`
              : dto.notes
            : session.notes,
        },
        include: { branch: true },
      });
    });
  }

  async listSessions(tenantId: string, query: ListSessionsQueryDto) {
    const { branchId, status, dateFrom, dateTo, page = 1, limit = 20 } = query;

    const where: Prisma.CajaChicaSessionWhereInput = { tenantId };
    if (branchId) where.branchId = branchId;
    if (status) where.status = status as CajaChicaStatus;
    if (dateFrom || dateTo) {
      where.openedAt = {};
      if (dateFrom) where.openedAt.gte = new Date(dateFrom);
      if (dateTo) where.openedAt.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.cajaChicaSession.findMany({
        where,
        include: { branch: { select: { name: true, code: true } } },
        orderBy: { openedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cajaChicaSession.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSession(tenantId: string, sessionId: string) {
    const session = await this.prisma.cajaChicaSession.findFirst({
      where: { id: sessionId, tenantId },
      include: {
        branch: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }
    return session;
  }

  async createTransaction(
    tenantId: string,
    dto: CreateTransactionDto,
    actorId: string,
  ) {
    // Only allow manual creation of CASH_OUT, BANK_DEPOSIT, ADJUSTMENT
    const allowed: CajaChicaTxType[] = [
      CajaChicaTxType.CASH_OUT,
      CajaChicaTxType.BANK_DEPOSIT,
      CajaChicaTxType.ADJUSTMENT,
    ];
    if (!allowed.includes(dto.type)) {
      throw new BadRequestException(
        `Transaction type ${dto.type} cannot be created manually`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Find OPEN session for this branch
      const session = await tx.cajaChicaSession.findFirst({
        where: {
          tenantId,
          branchId: dto.branchId,
          status: CajaChicaStatus.OPEN,
        },
      });
      if (!session) {
        throw new BadRequestException(
          `No open session found for branch ${dto.branchId}`,
        );
      }

      // Get last transaction balance
      const lastTx = await tx.cajaChicaTransaction.findFirst({
        where: { sessionId: session.id, tenantId },
        orderBy: { createdAt: "desc" },
      });
      const currentBalance = lastTx
        ? Number(lastTx.balance)
        : Number(session.openingBalance);

      // Calculate new balance
      let newBalance: number;
      if (dto.type === CajaChicaTxType.CASH_OUT || dto.type === CajaChicaTxType.BANK_DEPOSIT) {
        newBalance = currentBalance - dto.amount;
      } else {
        // ADJUSTMENT: amount can be positive or negative (use signed)
        newBalance = currentBalance + dto.amount;
      }

      return tx.cajaChicaTransaction.create({
        data: {
          tenantId,
          sessionId: session.id,
          branchId: dto.branchId,
          type: dto.type,
          amount: dto.amount,
          balance: newBalance,
          currency: session.currency,
          description: dto.description,
          reference: dto.reference,
          createdById: actorId,
        },
      });
    });
  }

  async listTransactions(tenantId: string, query: ListTransactionsQueryDto) {
    const {
      branchId,
      sessionId,
      type,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.CajaChicaTransactionWhereInput = { tenantId };
    if (branchId) where.branchId = branchId;
    if (sessionId) where.sessionId = sessionId;
    if (type) where.type = type as CajaChicaTxType;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.cajaChicaTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cajaChicaTransaction.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSummary(tenantId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });

    const summaries = await Promise.all(
      branches.map(async (branch) => {
        const openSession = await this.prisma.cajaChicaSession.findFirst({
          where: {
            tenantId,
            branchId: branch.id,
            status: CajaChicaStatus.OPEN,
          },
        });

        if (!openSession) {
          return {
            branchId: branch.id,
            branchName: branch.name,
            branchCode: branch.code,
            hasOpenSession: false,
            currentBalance: null,
            currency: null,
            sessionId: null,
            openedAt: null,
          };
        }

        // Get last transaction balance
        const lastTx = await this.prisma.cajaChicaTransaction.findFirst({
          where: { sessionId: openSession.id, tenantId },
          orderBy: { createdAt: "desc" },
        });
        const currentBalance = lastTx
          ? Number(lastTx.balance)
          : Number(openSession.openingBalance);

        return {
          branchId: branch.id,
          branchName: branch.name,
          branchCode: branch.code,
          hasOpenSession: true,
          currentBalance,
          currency: openSession.currency,
          sessionId: openSession.id,
          openedAt: openSession.openedAt,
        };
      }),
    );

    return summaries;
  }

  @OnEvent("payment.recorded")
  async handlePaymentRecorded(payload: {
    tenantId: string;
    paymentId: string;
    branchId?: string;
    method: string;
    amount: number;
    currency: string;
  }) {
    if (payload.method !== "CASH" || !payload.branchId) return;

    const session = await this.prisma.cajaChicaSession.findFirst({
      where: {
        tenantId: payload.tenantId,
        branchId: payload.branchId,
        status: CajaChicaStatus.OPEN,
      },
    });
    if (!session) return;

    // Get last transaction balance
    const lastTx = await this.prisma.cajaChicaTransaction.findFirst({
      where: { sessionId: session.id, tenantId: payload.tenantId },
      orderBy: { createdAt: "desc" },
    });
    const currentBalance = lastTx
      ? Number(lastTx.balance)
      : Number(session.openingBalance);

    await this.prisma.cajaChicaTransaction.create({
      data: {
        tenantId: payload.tenantId,
        sessionId: session.id,
        branchId: payload.branchId,
        type: CajaChicaTxType.CASH_IN,
        amount: payload.amount,
        balance: currentBalance + payload.amount,
        currency: payload.currency,
        description: `Pago en efectivo #${payload.paymentId.slice(0, 8)}`,
        paymentId: payload.paymentId,
      },
    });
  }
}
