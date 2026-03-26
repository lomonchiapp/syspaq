import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  Prisma,
  TicketCategory,
  TicketCommentAuthorType,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ListTicketsQueryDto } from "./dto/list-tickets-query.dto";

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Create                                                             */
  /* ------------------------------------------------------------------ */

  async create(
    tenantId: string,
    dto: CreateTicketDto,
    actorId: string,
    actorName: string,
  ) {
    // Validate customer if provided
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId },
      });
      if (!customer) {
        throw new NotFoundException("Customer not found");
      }
    }

    // Validate shipment if provided
    if (dto.shipmentId) {
      const shipment = await this.prisma.shipment.findFirst({
        where: { id: dto.shipmentId, tenantId },
      });
      if (!shipment) {
        throw new NotFoundException("Shipment not found");
      }
    }

    // Validate invoice if provided
    if (dto.invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: dto.invoiceId, tenantId },
      });
      if (!invoice) {
        throw new NotFoundException("Invoice not found");
      }
    }

    const ticket = await this.prisma.$transaction(async (tx) => {
      const count = await tx.ticket.count({ where: { tenantId } });
      const number = `TKT-${String(count + 1).padStart(5, "0")}`;

      return tx.ticket.create({
        data: {
          tenantId,
          number,
          customerId: dto.customerId,
          subject: dto.subject,
          description: dto.description,
          category: dto.category ?? TicketCategory.GENERAL,
          priority: dto.priority ?? TicketPriority.MEDIUM,
          shipmentId: dto.shipmentId,
          invoiceId: dto.invoiceId,
        },
        include: { customer: true },
      });
    });

    this.events.emit("ticket.created", {
      tenantId,
      ticketId: ticket.id,
      number: ticket.number,
      actorId,
      actorName,
    });

    return ticket;
  }

  /* ------------------------------------------------------------------ */
  /*  List (paginated)                                                   */
  /* ------------------------------------------------------------------ */

  async list(tenantId: string, query: ListTicketsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.TicketWhereInput = { tenantId };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.category) where.category = query.category;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.customerId) where.customerId = query.customerId;

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const priorityOrder: Record<string, number> = {
      URGENT: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          customer: {
            select: { firstName: true, lastName: true, casillero: true },
          },
        },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    // Prisma orders enums alphabetically; re-sort by priority weight
    data.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 99;
      const pb = priorityOrder[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Find one                                                           */
  /* ------------------------------------------------------------------ */

  async findOne(tenantId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        comments: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    return ticket;
  }

  /* ------------------------------------------------------------------ */
  /*  Update                                                             */
  /* ------------------------------------------------------------------ */

  async update(tenantId: string, id: string, dto: UpdateTicketDto) {
    const existing = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException("Ticket not found");
    }

    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: dto.status,
        priority: dto.priority,
        category: dto.category,
        assignedToId: dto.assignedToId,
      },
      include: { customer: true },
    });

    if (dto.status && dto.status !== existing.status) {
      this.events.emit("ticket.status_changed", {
        tenantId,
        ticketId: id,
        oldStatus: existing.status,
        newStatus: dto.status,
      });
    }

    return ticket;
  }

  /* ------------------------------------------------------------------ */
  /*  Add comment                                                        */
  /* ------------------------------------------------------------------ */

  async addComment(
    tenantId: string,
    ticketId: string,
    dto: CreateCommentDto,
    authorType: TicketCommentAuthorType,
    authorId: string,
    authorName: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorType,
        authorId,
        authorName,
        body: dto.body,
        isInternal: dto.isInternal ?? false,
        attachments: dto.attachments ?? [],
      },
    });

    // Reopen if customer comments on resolved/closed ticket
    if (
      authorType === TicketCommentAuthorType.CUSTOMER &&
      (ticket.status === TicketStatus.RESOLVED ||
        ticket.status === TicketStatus.CLOSED)
    ) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    }

    if (!dto.isInternal) {
      this.events.emit("ticket.commented", {
        tenantId,
        ticketId,
        commentId: comment.id,
        authorType,
        authorName,
      });
    }

    return comment;
  }

  /* ------------------------------------------------------------------ */
  /*  Assign                                                             */
  /* ------------------------------------------------------------------ */

  async assign(
    tenantId: string,
    id: string,
    assignedToId: string,
    actorName: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
    });
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    const data: Prisma.TicketUpdateInput = { assignedToId };
    if (ticket.status === TicketStatus.OPEN) {
      data.status = TicketStatus.IN_PROGRESS;
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data,
      include: { customer: true },
    });

    // System comment
    await this.prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorType: TicketCommentAuthorType.SYSTEM,
        authorId: "system",
        authorName: "Sistema",
        body: `Ticket asignado a ${actorName}`,
        isInternal: true,
      },
    });

    this.events.emit("ticket.assigned", {
      tenantId,
      ticketId: id,
      assignedToId,
      actorName,
    });

    return updated;
  }

  /* ------------------------------------------------------------------ */
  /*  Resolve                                                            */
  /* ------------------------------------------------------------------ */

  async resolve(tenantId: string, id: string, actorName: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
    });
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }
    if (ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException("Cannot resolve a closed ticket");
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date(),
      },
      include: { customer: true },
    });

    await this.prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorType: TicketCommentAuthorType.SYSTEM,
        authorId: "system",
        authorName: "Sistema",
        body: `Ticket resuelto por ${actorName}`,
        isInternal: true,
      },
    });

    this.events.emit("ticket.resolved", {
      tenantId,
      ticketId: id,
      actorName,
    });

    return updated;
  }

  /* ------------------------------------------------------------------ */
  /*  Close                                                              */
  /* ------------------------------------------------------------------ */

  async close(tenantId: string, id: string, actorName: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
    });
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }
    if (ticket.status !== TicketStatus.RESOLVED) {
      throw new BadRequestException(
        "Only resolved tickets can be closed",
      );
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
      },
      include: { customer: true },
    });

    await this.prisma.ticketComment.create({
      data: {
        ticketId: id,
        authorType: TicketCommentAuthorType.SYSTEM,
        authorId: "system",
        authorName: "Sistema",
        body: `Ticket cerrado por ${actorName}`,
        isInternal: true,
      },
    });

    return updated;
  }

  /* ------------------------------------------------------------------ */
  /*  Stats                                                              */
  /* ------------------------------------------------------------------ */

  async getStats(tenantId: string) {
    const openStatuses = [
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
      TicketStatus.WAITING_CUSTOMER,
      TicketStatus.RESOLVED,
    ];

    const [byStatus, byPriority, byCategory] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ["status"],
        where: { tenantId, status: { in: openStatuses } },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ["priority"],
        where: { tenantId, status: { in: openStatuses } },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ["category"],
        where: { tenantId, status: { in: openStatuses } },
        _count: true,
      }),
    ]);

    const openCount = byStatus.reduce((s, g) => s + g._count, 0);

    // Avg resolution time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const resolvedRecent = await this.prisma.ticket.findMany({
      where: {
        tenantId,
        resolvedAt: { not: null, gte: thirtyDaysAgo },
      },
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionHours: number | null = null;
    if (resolvedRecent.length > 0) {
      const totalHours = resolvedRecent.reduce((sum, t) => {
        const diff =
          (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        return sum + diff;
      }, 0);
      avgResolutionHours =
        Math.round((totalHours / resolvedRecent.length) * 100) / 100;
    }

    // Resolved this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const resolvedThisMonth = await this.prisma.ticket.count({
      where: {
        tenantId,
        resolvedAt: { gte: startOfMonth },
      },
    });

    return {
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count })),
      byPriority: byPriority.map((g) => ({
        priority: g.priority,
        count: g._count,
      })),
      byCategory: byCategory.map((g) => ({
        category: g.category,
        count: g._count,
      })),
      avgResolutionHours,
      openCount,
      resolvedThisMonth,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Customer-scoped (Portal)                                           */
  /* ------------------------------------------------------------------ */

  async listByCustomer(
    tenantId: string,
    customerId: string,
    page = 1,
    limit = 20,
  ) {
    const where: Prisma.TicketWhereInput = { tenantId, customerId };

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          comments: {
            where: { isInternal: false },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneForCustomer(
    tenantId: string,
    customerId: string,
    ticketId: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId, customerId },
      include: {
        comments: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    return ticket;
  }

  async addCustomerComment(
    tenantId: string,
    customerId: string,
    ticketId: string,
    body: string,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId, customerId },
    });
    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorType: TicketCommentAuthorType.CUSTOMER,
        authorId: customerId,
        authorName: "Cliente",
        body,
        isInternal: false,
      },
    });

    // Reopen if ticket was resolved
    if (
      ticket.status === TicketStatus.RESOLVED ||
      ticket.status === TicketStatus.CLOSED
    ) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    }

    this.events.emit("ticket.commented", {
      tenantId,
      ticketId,
      commentId: comment.id,
      authorType: TicketCommentAuthorType.CUSTOMER,
      authorName: "Cliente",
    });

    return comment;
  }
}
