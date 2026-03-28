import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  EventSource,
  Prisma,
  TrackingEventType,
  TransferStatus,
  TransferType,
} from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { AuditService } from "@/common/audit/audit.service";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { AddTransferItemDto } from "./dto/add-transfer-item.dto";

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /* ─── Create ─────────────────────────────────────────────── */

  async create(tenantId: string, dto: CreateTransferDto) {
    try {
      return await this.prisma.transfer.create({
        data: {
          tenantId,
          number: dto.number,
          type: TransferType.OUTBOUND,
          status: TransferStatus.PENDING,
          originBranchId: dto.originBranchId,
          destBranchId: dto.destBranchId,
          notes: dto.notes,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException(
          "Transfer number already exists for this tenant",
        );
      }
      throw e;
    }
  }

  /* ─── List ───────────────────────────────────────────────── */

  async list(
    tenantId: string,
    page = 1,
    limit = 20,
    filters: {
      status?: TransferStatus;
      type?: TransferType;
      branchId?: string;
    } = {},
  ) {
    const where: Prisma.TransferWhereInput = {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.branchId && {
        OR: [
          { originBranchId: filters.branchId },
          { destBranchId: filters.branchId },
        ],
      }),
    };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.transfer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          originBranch: { select: { id: true, name: true, code: true } },
          destBranch: { select: { id: true, name: true, code: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.transfer.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ─── Find One ───────────────────────────────────────────── */

  async findOne(tenantId: string, id: string) {
    const transfer = await this.prisma.transfer.findFirst({
      where: { id, tenantId },
      include: {
        originBranch: { select: { id: true, name: true, code: true } },
        destBranch: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            shipment: {
              select: {
                id: true,
                trackingNumber: true,
                customer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
        linkedTransfer: {
          select: {
            id: true,
            number: true,
            type: true,
            status: true,
          },
        },
        counterpart: {
          select: {
            id: true,
            number: true,
            type: true,
            status: true,
          },
        },
      },
    });
    if (!transfer) throw new NotFoundException("Transfer not found");
    return transfer;
  }

  /* ─── Add Item ───────────────────────────────────────────── */

  async addItem(tenantId: string, transferId: string, dto: AddTransferItemDto) {
    const transfer = await this.findOne(tenantId, transferId);

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        "Can only add items to transfers in PENDING status",
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const item = await tx.transferItem.create({
          data: {
            transferId: transfer.id,
            shipmentId: dto.shipmentId,
            weightLbs: dto.weightLbs,
            pieces: dto.pieces ?? 1,
            notes: dto.notes,
          },
          include: { shipment: { select: { id: true, trackingNumber: true } } },
        });

        // Recalculate totals
        const agg = await tx.transferItem.aggregate({
          where: { transferId: transfer.id },
          _sum: { pieces: true, weightLbs: true },
        });

        await tx.transfer.update({
          where: { id: transfer.id },
          data: {
            totalPieces: agg._sum.pieces ?? 0,
            totalWeightLbs: agg._sum.weightLbs ?? null,
          },
        });

        return item;
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException(
          "Shipment already exists in this transfer",
        );
      }
      throw e;
    }
  }

  /* ─── Remove Item ────────────────────────────────────────── */

  async removeItem(tenantId: string, transferId: string, shipmentId: string) {
    const transfer = await this.findOne(tenantId, transferId);

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        "Can only remove items from transfers in PENDING status",
      );
    }

    const item = await this.prisma.transferItem.findFirst({
      where: { transferId: transfer.id, shipmentId },
    });
    if (!item) throw new NotFoundException("Item not found in transfer");

    await this.prisma.$transaction(async (tx) => {
      await tx.transferItem.delete({ where: { id: item.id } });

      const agg = await tx.transferItem.aggregate({
        where: { transferId: transfer.id },
        _sum: { pieces: true, weightLbs: true },
      });

      await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          totalPieces: agg._sum.pieces ?? 0,
          totalWeightLbs: agg._sum.weightLbs ?? null,
        },
      });
    });

    return { message: "Item removed from transfer" };
  }

  /* ─── Dispatch ─────────────────────────────────────────────── */

  async dispatch(tenantId: string, id: string) {
    const transfer = await this.findOne(tenantId, id);

    if (transfer.type !== TransferType.OUTBOUND) {
      throw new BadRequestException("Only OUTBOUND transfers can be dispatched");
    }
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException("Transfer must be in PENDING status to dispatch");
    }

    return await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Update outbound transfer to DISPATCHED
      const updated = await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: TransferStatus.DISPATCHED,
          dispatchedAt: now,
        },
      });

      // 2. Create INBOUND counterpart at destination
      const inboundNumber = `${transfer.number}-IN`;
      const inbound = await tx.transfer.create({
        data: {
          tenantId,
          number: inboundNumber,
          type: TransferType.INBOUND,
          status: TransferStatus.IN_TRANSIT,
          originBranchId: transfer.originBranchId,
          destBranchId: transfer.destBranchId,
          linkedTransferId: transfer.id,
          totalPieces: transfer.totalPieces,
          totalWeightLbs: transfer.totalWeightLbs,
          notes: transfer.notes,
        },
      });

      // 3. Copy items to inbound transfer
      const items = await tx.transferItem.findMany({
        where: { transferId: transfer.id },
      });

      if (items.length > 0) {
        await tx.transferItem.createMany({
          data: items.map((item) => ({
            transferId: inbound.id,
            shipmentId: item.shipmentId,
            weightLbs: item.weightLbs,
            pieces: item.pieces,
            notes: item.notes,
          })),
        });

        // 4. Fire TRANSFER_DISPATCHED tracking events on all contained shipments
        await tx.trackingEvent.createMany({
          data: items.map((item) => ({
            tenantId,
            shipmentId: item.shipmentId,
            occurredAt: now,
            type: TrackingEventType.TRANSFER_DISPATCHED,
            source: EventSource.SYSTEM,
            payload: {
              transferId: transfer.id,
              transferNumber: transfer.number,
              destBranchId: transfer.destBranchId,
              destBranchName: transfer.destBranch.name,
            },
          })),
        });
      }

      // 5. Audit log
      this.audit.log({
        tenantId,
        actor: "system",
        actorType: "API_KEY" as any,
        action: "transfer.dispatch",
        resource: "transfer",
        resourceId: transfer.id,
        meta: { inboundTransferId: inbound.id },
      });

      return { ...updated, inboundTransfer: inbound };
    });
  }

  /* ─── Receive ──────────────────────────────────────────────── */

  async receive(tenantId: string, id: string) {
    const transfer = await this.findOne(tenantId, id);

    if (transfer.type !== TransferType.INBOUND) {
      throw new BadRequestException("Only INBOUND transfers can be received");
    }
    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException("Transfer must be in IN_TRANSIT status to receive");
    }

    return await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Update inbound transfer to RECEIVED
      const updated = await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: TransferStatus.RECEIVED,
          receivedAt: now,
        },
      });

      // 2. Fire TRANSFER_RECEIVED tracking events on all contained shipments
      const items = await tx.transferItem.findMany({
        where: { transferId: transfer.id },
        select: { shipmentId: true },
      });

      if (items.length > 0) {
        await tx.trackingEvent.createMany({
          data: items.map((item) => ({
            tenantId,
            shipmentId: item.shipmentId,
            occurredAt: now,
            type: TrackingEventType.TRANSFER_RECEIVED,
            source: EventSource.SYSTEM,
            payload: {
              transferId: transfer.id,
              transferNumber: transfer.number,
              branchId: transfer.destBranchId,
              branchName: transfer.destBranch.name,
            },
          })),
        });
      }

      // 3. Audit log
      this.audit.log({
        tenantId,
        actor: "system",
        actorType: "API_KEY" as any,
        action: "transfer.receive",
        resource: "transfer",
        resourceId: transfer.id,
      });

      return updated;
    });
  }

  /* ─── Cancel ───────────────────────────────────────────────── */

  async cancel(tenantId: string, id: string) {
    const transfer = await this.findOne(tenantId, id);

    if (transfer.status === TransferStatus.CANCELLED) {
      throw new BadRequestException("Transfer is already cancelled");
    }
    if (transfer.status === TransferStatus.RECEIVED) {
      throw new BadRequestException("Cannot cancel a received transfer");
    }

    const updated = await this.prisma.transfer.update({
      where: { id: transfer.id },
      data: { status: TransferStatus.CANCELLED },
    });

    // Cancel linked counterpart if it exists
    const linkedId = transfer.linkedTransfer?.id ?? transfer.counterpart?.id;
    if (linkedId) {
      const linked = await this.prisma.transfer.findFirst({
        where: { id: linkedId, tenantId },
      });
      if (linked && linked.status !== TransferStatus.CANCELLED && linked.status !== TransferStatus.RECEIVED) {
        await this.prisma.transfer.update({
          where: { id: linkedId },
          data: { status: TransferStatus.CANCELLED },
        });
      }
    }

    this.audit.log({
      tenantId,
      actor: "system",
      actorType: "API_KEY" as any,
      action: "transfer.cancel",
      resource: "transfer",
      resourceId: transfer.id,
      meta: { linkedTransferId: linkedId },
    });

    return updated;
  }
}
