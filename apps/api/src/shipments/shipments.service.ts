import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventSource, Prisma, TrackingEventType } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { resolvePhaseAfterEvent } from "./tracking-state-machine";
import { AddEventDto } from "./dto/add-event.dto";
import { CreateShipmentDto } from "./dto/create-shipment.dto";
import { UpdateShipmentDto } from "./dto/update-shipment.dto";

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateShipmentDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const volWeight = dto.lengthCm && dto.widthCm && dto.heightCm
          ? (dto.lengthCm * dto.widthCm * dto.heightCm) / 5000 * 2.20462
          : undefined;

        const shipment = await tx.shipment.create({
          data: {
            tenantId,
            trackingNumber: dto.trackingNumber,
            reference: dto.reference,
            customerId: dto.customerId,
            senderName: dto.senderName,
            carrierName: dto.carrierName,
            contentDescription: dto.contentDescription,
            pieces: dto.pieces,
            weightLbs: dto.weightLbs,
            volumetricWeight: volWeight ?? dto.weightLbs,
            lengthCm: dto.lengthCm,
            widthCm: dto.widthCm,
            heightCm: dto.heightCm,
            fobValue: dto.fobValue,
            fobCurrency: dto.fobCurrency,
            collectionType: dto.collectionType,
            destBranchId: dto.destBranchId,
            warehouseLocation: dto.warehouseLocation,
            metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
            currentPhase: "CREATED",
          },
        });

        await tx.trackingEvent.create({
          data: {
            tenantId,
            shipmentId: shipment.id,
            occurredAt: new Date(),
            type: TrackingEventType.CREATED,
            source: EventSource.SYSTEM,
            payload: {},
          },
        });

        return this.findOne(tenantId, shipment.id);
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Tracking number already exists for this tenant");
      }
      throw e;
    }
  }

  async list(
    tenantId: string,
    page = 1,
    limit = 20,
    search?: string,
    phase?: string,
    customerId?: string,
    destBranchId?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ShipmentWhereInput = { tenantId };
    if (phase) where.currentPhase = phase as any;
    if (customerId) where.customerId = customerId;
    if (destBranchId) where.destBranchId = destBranchId;
    if (search) {
      where.OR = [
        { trackingNumber: { contains: search, mode: "insensitive" } },
        { senderName: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { events: true } },
          customer: { select: { casillero: true, firstName: true, lastName: true } },
          destBranch: { select: { code: true, name: true } },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      data: items.map((s) => ({
        id: s.id,
        trackingNumber: s.trackingNumber,
        reference: s.reference,
        currentPhase: s.currentPhase,
        senderName: s.senderName,
        carrierName: s.carrierName,
        contentDescription: s.contentDescription,
        pieces: s.pieces,
        weightLbs: s.weightLbs ? Number(s.weightLbs) : null,
        volumetricWeight: s.volumetricWeight ? Number(s.volumetricWeight) : null,
        fobValue: s.fobValue ? Number(s.fobValue) : null,
        collectionType: s.collectionType,
        warehouseLocation: s.warehouseLocation,
        destBranchCode: s.destBranch?.code ?? null,
        destBranchName: s.destBranch?.name ?? null,
        customerCasillero: s.customer?.casillero ?? null,
        customerName: s.customer ? `${s.customer.firstName} ${s.customer.lastName}` : null,
        metadata: s.metadata,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        eventCount: s._count.events,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(tenantId: string, id: string, dto: UpdateShipmentDto) {
    await this.findOne(tenantId, id);
    const data: Prisma.ShipmentUpdateInput = {};
    if (dto.reference !== undefined) data.reference = dto.reference;
    if (dto.senderName !== undefined) data.senderName = dto.senderName;
    if (dto.carrierName !== undefined) data.carrierName = dto.carrierName;
    if (dto.contentDescription !== undefined) data.contentDescription = dto.contentDescription;
    if (dto.pieces !== undefined) data.pieces = dto.pieces;
    if (dto.weightLbs !== undefined) data.weightLbs = dto.weightLbs;
    if (dto.lengthCm !== undefined) data.lengthCm = dto.lengthCm;
    if (dto.widthCm !== undefined) data.widthCm = dto.widthCm;
    if (dto.heightCm !== undefined) data.heightCm = dto.heightCm;
    if (dto.fobValue !== undefined) data.fobValue = dto.fobValue;
    if (dto.fobCurrency !== undefined) data.fobCurrency = dto.fobCurrency;
    if (dto.collectionType !== undefined) data.collectionType = dto.collectionType;
    if (dto.warehouseLocation !== undefined) data.warehouseLocation = dto.warehouseLocation;
    if (dto.destBranchId !== undefined) data.destBranch = { connect: { id: dto.destBranchId } };
    if (dto.customerId !== undefined) data.customer = { connect: { id: dto.customerId } };

    // Recalculate volumetric weight if dimensions changed
    if (dto.lengthCm !== undefined || dto.widthCm !== undefined || dto.heightCm !== undefined) {
      const current = await this.prisma.shipment.findUnique({ where: { id } });
      const l = dto.lengthCm ?? (current?.lengthCm ? Number(current.lengthCm) : 0);
      const w = dto.widthCm ?? (current?.widthCm ? Number(current.widthCm) : 0);
      const h = dto.heightCm ?? (current?.heightCm ? Number(current.heightCm) : 0);
      if (l > 0 && w > 0 && h > 0) {
        data.volumetricWeight = (l * w * h) / 5000 * 2.20462;
      }
    }

    return this.prisma.shipment.update({ where: { id }, data });
  }

  async findOne(tenantId: string, id: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, tenantId },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");
    return shipment;
  }

  async findByTrackingNumber(tenantId: string, trackingNumber: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { tenantId, trackingNumber },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");
    return shipment;
  }

  async listEvents(tenantId: string, shipmentId: string, page = 1, limit = 50) {
    await this.findOne(tenantId, shipmentId);
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.trackingEvent.findMany({
        where: { tenantId, shipmentId },
        orderBy: { occurredAt: "asc" },
        skip,
        take: limit,
      }),
      this.prisma.trackingEvent.count({ where: { tenantId, shipmentId } }),
    ]);

    return {
      data: events,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async addEvent(
    tenantId: string,
    shipmentId: string,
    dto: AddEventDto,
    idempotencyKey: string | undefined
  ) {
    const shipment = await this.findOne(tenantId, shipmentId);

    if (idempotencyKey) {
      const existing = await this.prisma.trackingEvent.findFirst({
        where: { shipmentId, idempotencyKey },
      });
      if (existing) {
        return { shipment: await this.findOne(tenantId, shipmentId), event: existing, idempotent: true };
      }
    }

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    let nextPhase = shipment.currentPhase;
    if (dto.type !== TrackingEventType.NOTE) {
      const resolved = resolvePhaseAfterEvent(shipment.currentPhase, dto.type);
      if (resolved !== null) {
        nextPhase = resolved;
      }
    }

    try {
      const event = await this.prisma.$transaction(async (tx) => {
        const created = await tx.trackingEvent.create({
          data: {
            tenantId,
            shipmentId,
            occurredAt,
            type: dto.type,
            rawStatus: dto.rawStatus,
            location: dto.location as Prisma.InputJsonValue | undefined,
            source: dto.source,
            correlationId: dto.correlationId,
            payload: (dto.payload ?? {}) as Prisma.InputJsonValue,
            idempotencyKey: idempotencyKey ?? null,
          },
        });

        if (nextPhase !== shipment.currentPhase) {
          await tx.shipment.update({
            where: { id: shipmentId },
            data: { currentPhase: nextPhase },
          });
        }

        return created;
      });

      const updated = await this.findOne(tenantId, shipmentId);
      return { shipment: updated, event, idempotent: false };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        idempotencyKey
      ) {
        const existing = await this.prisma.trackingEvent.findFirst({
          where: { shipmentId, idempotencyKey },
        });
        if (existing) {
          return {
            shipment: await this.findOne(tenantId, shipmentId),
            event: existing,
            idempotent: true,
          };
        }
      }
      throw e;
    }
  }
}
