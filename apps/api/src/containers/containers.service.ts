import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ContainerStatus,
  EventSource,
  Prisma,
  TrackingEventType,
} from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { NotificationsService } from "@/notifications/notifications.service";
import { CreateContainerDto } from "./dto/create-container.dto";
import { UpdateContainerDto } from "./dto/update-container.dto";
import { AddContainerItemDto } from "./dto/add-container-item.dto";

/** Allowed status transitions — linear flow + CANCELLED from any state */
const STATUS_ORDER: ContainerStatus[] = [
  ContainerStatus.OPEN,
  ContainerStatus.CLOSED,
  ContainerStatus.IN_TRANSIT,
  ContainerStatus.IN_PORT,
  ContainerStatus.IN_CUSTOMS,
  ContainerStatus.CLEARED,
  ContainerStatus.DELIVERED,
];

@Injectable()
export class ContainersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /* ─── Create ─────────────────────────────────────────────── */

  async create(tenantId: string, dto: CreateContainerDto) {
    try {
      return await this.prisma.container.create({
        data: {
          tenantId,
          number: dto.number,
          type: dto.type,
          mode: dto.mode,
          origin: dto.origin,
          destination: dto.destination,
          carrier: dto.carrier,
          vesselName: dto.vesselName,
          voyageNumber: dto.voyageNumber,
          blNumber: dto.blNumber,
          sealNumber: dto.sealNumber,
          estimatedDeparture: dto.estimatedDeparture
            ? new Date(dto.estimatedDeparture)
            : undefined,
          estimatedArrival: dto.estimatedArrival
            ? new Date(dto.estimatedArrival)
            : undefined,
          notes: dto.notes,
          voyageId: dto.voyageId,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException(
          "Container number already exists for this tenant",
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
      status?: ContainerStatus;
      mode?: string;
      origin?: string;
      destination?: string;
    } = {},
  ) {
    const where: Prisma.ContainerWhereInput = {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.mode && { mode: filters.mode as any }),
      ...(filters.origin && { origin: filters.origin }),
      ...(filters.destination && { destination: filters.destination }),
    };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.container.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.container.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ─── Find One ───────────────────────────────────────────── */

  async findOne(tenantId: string, id: string) {
    const container = await this.prisma.container.findFirst({
      where: { id, tenantId },
      include: {
        voyage: { select: { id: true, number: true, carrier: true, masterAwb: true, status: true } },
        items: {
          include: {
            shipment: {
              select: {
                id: true,
                trackingNumber: true,
                reference: true,
                currentPhase: true,
                customerId: true,
                senderName: true,
                carrierName: true,
                contentDescription: true,
                weightLbs: true,
                pieces: true,
                warehouseLocation: true,
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
      },
    });
    if (!container) throw new NotFoundException("Container not found");
    return container;
  }

  /* ─── Update ─────────────────────────────────────────────── */

  async update(tenantId: string, id: string, dto: UpdateContainerDto) {
    await this.findOne(tenantId, id);

    return this.prisma.container.update({
      where: { id },
      data: {
        ...(dto.number !== undefined && { number: dto.number }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.mode !== undefined && { mode: dto.mode }),
        ...(dto.origin !== undefined && { origin: dto.origin }),
        ...(dto.destination !== undefined && { destination: dto.destination }),
        ...(dto.carrier !== undefined && { carrier: dto.carrier }),
        ...(dto.vesselName !== undefined && { vesselName: dto.vesselName }),
        ...(dto.voyageNumber !== undefined && { voyageNumber: dto.voyageNumber }),
        ...(dto.blNumber !== undefined && { blNumber: dto.blNumber }),
        ...(dto.sealNumber !== undefined && { sealNumber: dto.sealNumber }),
        ...(dto.estimatedDeparture !== undefined && {
          estimatedDeparture: new Date(dto.estimatedDeparture),
        }),
        ...(dto.estimatedArrival !== undefined && {
          estimatedArrival: new Date(dto.estimatedArrival),
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.voyageId !== undefined && { voyageId: dto.voyageId }),
      },
    });
  }

  /* ─── Add Item ───────────────────────────────────────────── */

  async addItem(tenantId: string, containerId: string, dto: AddContainerItemDto) {
    const container = await this.findOne(tenantId, containerId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const item = await tx.containerItem.create({
          data: {
            containerId: container.id,
            shipmentId: dto.shipmentId,
            weightLbs: dto.weightLbs,
            pieces: dto.pieces ?? 1,
            description: dto.description,
          },
          include: { shipment: { select: { id: true, trackingNumber: true } } },
        });

        // Recalculate totals
        const agg = await tx.containerItem.aggregate({
          where: { containerId: container.id },
          _sum: { pieces: true, weightLbs: true },
        });

        await tx.container.update({
          where: { id: container.id },
          data: {
            totalPieces: agg._sum.pieces ?? 0,
            totalWeightLbs: agg._sum.weightLbs ?? null,
          },
        });

        // Fire CONTAINERIZED tracking event
        await tx.trackingEvent.create({
          data: {
            tenantId,
            shipmentId: dto.shipmentId,
            occurredAt: new Date(),
            type: TrackingEventType.CONTAINERIZED,
            source: EventSource.SYSTEM,
            payload: {
              containerId: container.id,
              containerNumber: container.number,
              destination: container.destination,
            },
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
          "Shipment already exists in this container",
        );
      }
      throw e;
    }
  }

  /* ─── Remove Item ────────────────────────────────────────── */

  async removeItem(tenantId: string, containerId: string, shipmentId: string) {
    const container = await this.findOne(tenantId, containerId);

    const item = await this.prisma.containerItem.findFirst({
      where: { containerId: container.id, shipmentId },
    });
    if (!item) throw new NotFoundException("Item not found in container");

    await this.prisma.$transaction(async (tx) => {
      await tx.containerItem.delete({ where: { id: item.id } });

      const agg = await tx.containerItem.aggregate({
        where: { containerId: container.id },
        _sum: { pieces: true, weightLbs: true },
      });

      await tx.container.update({
        where: { id: container.id },
        data: {
          totalPieces: agg._sum.pieces ?? 0,
          totalWeightLbs: agg._sum.weightLbs ?? null,
        },
      });
    });

    return { message: "Item removed from container" };
  }

  /* ─── Status Transition ──────────────────────────────────── */

  async transitionStatus(
    tenantId: string,
    id: string,
    newStatus: ContainerStatus,
  ) {
    const container = await this.findOne(tenantId, id);
    const currentStatus = container.status;

    // Allow CANCELLED from any state
    if (newStatus !== ContainerStatus.CANCELLED) {
      const currentIdx = STATUS_ORDER.indexOf(currentStatus);
      const newIdx = STATUS_ORDER.indexOf(newStatus);

      if (currentIdx === -1 || newIdx === -1) {
        throw new BadRequestException(
          `Invalid status transition: ${currentStatus} -> ${newStatus}`,
        );
      }
      if (newIdx !== currentIdx + 1) {
        throw new BadRequestException(
          `Cannot transition from ${currentStatus} to ${newStatus}. ` +
            `Next allowed status: ${STATUS_ORDER[currentIdx + 1] ?? "none"}`,
        );
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.ContainerUpdateInput = { status: newStatus };

      if (newStatus === ContainerStatus.IN_TRANSIT) {
        updateData.actualDeparture = new Date();
      }
      if (newStatus === ContainerStatus.IN_PORT) {
        updateData.actualArrival = new Date();
      }

      const updated = await tx.container.update({
        where: { id },
        data: updateData,
      });

      // Fire tracking events on contained shipments
      const items = await tx.containerItem.findMany({
        where: { containerId: id },
        select: { shipmentId: true },
      });

      let eventType: TrackingEventType | null = null;
      if (newStatus === ContainerStatus.IN_TRANSIT) {
        eventType = TrackingEventType.DEPARTED;
      } else if (newStatus === ContainerStatus.IN_PORT) {
        eventType = TrackingEventType.ARRIVED;
      } else if (newStatus === ContainerStatus.CLEARED) {
        eventType = TrackingEventType.CUSTOMS_CLEARED;
      }

      if (eventType && items.length > 0) {
        const now = new Date();
        await tx.trackingEvent.createMany({
          data: items.map((item) => ({
            tenantId,
            shipmentId: item.shipmentId,
            occurredAt: now,
            type: eventType!,
            source: EventSource.SYSTEM,
            payload: {
              containerId: id,
              containerNumber: container.number,
            },
          })),
        });

        // Fire notifications for each shipment (outside transaction)
        const eventName =
          eventType === TrackingEventType.DEPARTED
            ? "shipment.departed"
            : eventType === TrackingEventType.ARRIVED
              ? "shipment.arrived"
              : "shipment.customs_cleared";

        for (const item of items) {
          this.notifications
            .dispatch(tenantId, eventName, {
              shipmentId: item.shipmentId,
              containerId: id,
              containerNumber: container.number,
            })
            .catch(() => {}); // fire-and-forget
        }
      }

      return updated;
    });
  }

  /* ─── Manifest ───────────────────────────────────────────── */

  async getManifest(tenantId: string, id: string) {
    const container = await this.prisma.container.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            shipment: {
              include: {
                customer: {
                  select: {
                    id: true,
                    casillero: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                    idType: true,
                    idNumber: true,
                    address: true,
                  },
                },
              },
            },
          },
          orderBy: { addedAt: "asc" },
        },
        dgaLabels: true,
      },
    });
    if (!container) throw new NotFoundException("Container not found");
    return container;
  }
}
