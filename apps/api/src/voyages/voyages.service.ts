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
  VoyageStatus,
} from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { NotificationsService } from "@/notifications/notifications.service";
import { CreateVoyageDto } from "./dto/create-voyage.dto";
import { UpdateVoyageDto } from "./dto/update-voyage.dto";

@Injectable()
export class VoyagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /* ─── Create ─────────────────────────────────────────────── */

  async create(tenantId: string, dto: CreateVoyageDto) {
    try {
      return await this.prisma.voyage.create({
        data: {
          tenantId,
          number: dto.number,
          mode: dto.mode,
          date: dto.date ? new Date(dto.date) : undefined,
          origin: dto.origin,
          destination: dto.destination,
          carrier: dto.carrier,
          vesselName: dto.vesselName,
          masterAwb: dto.masterAwb,
          shipper: dto.shipper,
          consignee: dto.consignee,
          notifyParty: dto.notifyParty,
          agent: dto.agent,
          notes: dto.notes,
          departureDate: dto.departureDate
            ? new Date(dto.departureDate)
            : undefined,
          arrivalDate: dto.arrivalDate
            ? new Date(dto.arrivalDate)
            : undefined,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException(
          "Voyage number already exists for this tenant",
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
      status?: VoyageStatus;
      mode?: string;
      carrier?: string;
    } = {},
  ) {
    const where: Prisma.VoyageWhereInput = {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.mode && { mode: filters.mode as any }),
      ...(filters.carrier && { carrier: filters.carrier }),
    };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.voyage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { _count: { select: { containers: true } } },
      }),
      this.prisma.voyage.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ─── Find One ───────────────────────────────────────────── */

  async findOne(tenantId: string, id: string) {
    const voyage = await this.prisma.voyage.findFirst({
      where: { id, tenantId },
      include: {
        containers: {
          include: {
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!voyage) throw new NotFoundException("Voyage not found");
    return voyage;
  }

  /* ─── Update ─────────────────────────────────────────────── */

  async update(tenantId: string, id: string, dto: UpdateVoyageDto) {
    await this.findOne(tenantId, id);

    return this.prisma.voyage.update({
      where: { id },
      data: {
        ...(dto.number !== undefined && { number: dto.number }),
        ...(dto.mode !== undefined && { mode: dto.mode }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.origin !== undefined && { origin: dto.origin }),
        ...(dto.destination !== undefined && { destination: dto.destination }),
        ...(dto.carrier !== undefined && { carrier: dto.carrier }),
        ...(dto.vesselName !== undefined && { vesselName: dto.vesselName }),
        ...(dto.masterAwb !== undefined && { masterAwb: dto.masterAwb }),
        ...(dto.shipper !== undefined && { shipper: dto.shipper }),
        ...(dto.consignee !== undefined && { consignee: dto.consignee }),
        ...(dto.notifyParty !== undefined && { notifyParty: dto.notifyParty }),
        ...(dto.agent !== undefined && { agent: dto.agent }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.departureDate !== undefined && {
          departureDate: new Date(dto.departureDate),
        }),
        ...(dto.arrivalDate !== undefined && {
          arrivalDate: new Date(dto.arrivalDate),
        }),
      },
    });
  }

  /* ─── Status Transition ──────────────────────────────────── */

  async transitionStatus(
    tenantId: string,
    id: string,
    newStatus: VoyageStatus,
  ) {
    const voyage = await this.findOne(tenantId, id);
    const currentStatus = voyage.status;

    // Allow CANCELLED from any state
    if (newStatus === VoyageStatus.CANCELLED) {
      return this.prisma.voyage.update({
        where: { id },
        data: { status: VoyageStatus.CANCELLED },
      });
    }

    // Only allow IN_PROCESS → COMPLETED
    if (
      currentStatus !== VoyageStatus.IN_PROCESS ||
      newStatus !== VoyageStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. ` +
          `Only IN_PROCESS -> COMPLETED or any -> CANCELLED is allowed.`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.voyage.update({
        where: { id },
        data: { status: VoyageStatus.COMPLETED, completedAt: new Date() },
      });

      // Cascade: transition all OPEN/CLOSED containers to IN_TRANSIT
      const containers = await tx.container.findMany({
        where: {
          voyageId: id,
          tenantId,
          status: { in: [ContainerStatus.OPEN, ContainerStatus.CLOSED] },
        },
        include: {
          items: { select: { shipmentId: true } },
        },
      });

      if (containers.length > 0) {
        const now = new Date();

        await tx.container.updateMany({
          where: {
            id: { in: containers.map((c) => c.id) },
          },
          data: {
            status: ContainerStatus.IN_TRANSIT,
            actualDeparture: now,
          },
        });

        // Fire DEPARTED events on all shipments in those containers
        const shipmentEvents = containers.flatMap((container) =>
          container.items.map((item) => ({
            tenantId,
            shipmentId: item.shipmentId,
            occurredAt: now,
            type: TrackingEventType.DEPARTED,
            source: EventSource.SYSTEM,
            payload: {
              voyageId: id,
              voyageNumber: voyage.number,
              containerId: container.id,
              containerNumber: container.number,
            },
          })),
        );

        if (shipmentEvents.length > 0) {
          await tx.trackingEvent.createMany({ data: shipmentEvents });

          // Fire notifications (outside transaction, fire-and-forget)
          for (const container of containers) {
            for (const item of container.items) {
              this.notifications
                .dispatch(tenantId, "shipment.departed", {
                  shipmentId: item.shipmentId,
                  voyageId: id,
                  voyageNumber: voyage.number,
                  containerId: container.id,
                  containerNumber: container.number,
                })
                .catch(() => {}); // fire-and-forget
            }
          }
        }
      }

      return updated;
    });
  }

  /* ─── Link Container ─────────────────────────────────────── */

  async linkContainer(tenantId: string, voyageId: string, containerId: string) {
    await this.findOne(tenantId, voyageId);

    const container = await this.prisma.container.findFirst({
      where: { id: containerId, tenantId },
    });
    if (!container) throw new NotFoundException("Container not found");

    return this.prisma.container.update({
      where: { id: containerId },
      data: { voyageId },
    });
  }

  /* ─── Unlink Container ───────────────────────────────────── */

  async unlinkContainer(
    tenantId: string,
    voyageId: string,
    containerId: string,
  ) {
    await this.findOne(tenantId, voyageId);

    const container = await this.prisma.container.findFirst({
      where: { id: containerId, tenantId, voyageId },
    });
    if (!container) {
      throw new NotFoundException("Container not found in this voyage");
    }

    await this.prisma.container.update({
      where: { id: containerId },
      data: { voyageId: null },
    });

    return { message: "Container removed from voyage" };
  }
}
