import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateRouteDto } from "./dto/create-route.dto";
import { ListQueryDto } from "./dto/list-query.dto";

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateRouteDto, _actorId: string) {
    // Validate driver exists, is ACTIVE, belongs to tenant
    const driver = await this.prisma.driver.findFirst({
      where: { id: dto.driverId, tenantId },
    });
    if (!driver) {
      throw new NotFoundException("Driver not found");
    }
    if (driver.status !== "ACTIVE") {
      throw new BadRequestException("Driver is not active");
    }

    // Validate vehicle if provided
    if (dto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findFirst({
        where: { id: dto.vehicleId, tenantId },
      });
      if (!vehicle) {
        throw new NotFoundException("Vehicle not found");
      }
      if (vehicle.status !== "AVAILABLE") {
        throw new BadRequestException("Vehicle is not available");
      }
    }

    // Validate all delivery orders
    for (const stop of dto.stops) {
      const order = await this.prisma.deliveryOrder.findFirst({
        where: { id: stop.deliveryOrderId, tenantId },
      });
      if (!order) {
        throw new NotFoundException(
          `Delivery order ${stop.deliveryOrderId} not found`,
        );
      }
      if (order.status !== "PENDING") {
        throw new BadRequestException(
          `Delivery order ${order.number} is not in PENDING status`,
        );
      }
    }

    // Generate route number via transaction
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.route.count({ where: { tenantId } });
      const number = `RUT-${String(count + 1).padStart(5, "0")}`;

      const route = await tx.route.create({
        data: {
          tenantId,
          number,
          driverId: dto.driverId,
          vehicleId: dto.vehicleId,
          branchId: dto.branchId,
          plannedDate: new Date(dto.plannedDate),
          totalStops: dto.stops.length,
          notes: dto.notes,
          stops: {
            create: dto.stops.map((s) => ({
              deliveryOrderId: s.deliveryOrderId,
              sequence: s.sequence,
            })),
          },
        },
        include: {
          stops: { orderBy: { sequence: "asc" } },
          driver: true,
          vehicle: true,
          branch: true,
        },
      });

      // Update delivery orders with route/driver/vehicle references
      for (const stop of dto.stops) {
        await tx.deliveryOrder.update({
          where: { id: stop.deliveryOrderId },
          data: {
            routeId: route.id,
            driverId: dto.driverId,
            vehicleId: dto.vehicleId,
          },
        });
      }

      return route;
    });
  }

  async list(tenantId: string, query: ListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.RouteWhereInput = { tenantId };

    if (query.status) {
      where.status = query.status as any;
    }
    if (query.dateFrom || query.dateTo) {
      where.plannedDate = {};
      if (query.dateFrom) where.plannedDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.plannedDate.lte = new Date(query.dateTo);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        orderBy: { plannedDate: "desc" },
        skip,
        take: limit,
        include: {
          driver: true,
          vehicle: true,
          branch: true,
        },
      }),
      this.prisma.route.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const route = await this.prisma.route.findFirst({
      where: { id, tenantId },
      include: {
        stops: {
          orderBy: { sequence: "asc" },
          include: {
            deliveryOrder: {
              include: { shipment: true },
            },
          },
        },
        driver: true,
        vehicle: true,
        branch: true,
      },
    });
    if (!route) {
      throw new NotFoundException("Route not found");
    }
    return route;
  }

  async start(tenantId: string, id: string) {
    const route = await this.findOne(tenantId, id);

    if (route.status !== "PLANNED") {
      throw new BadRequestException("Route can only be started from PLANNED status");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.route.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
        include: { driver: true, vehicle: true, branch: true },
      });

      // Set vehicle to IN_USE
      if (route.vehicleId) {
        await tx.vehicle.update({
          where: { id: route.vehicleId },
          data: { status: "IN_USE" },
        });
      }

      // Update linked delivery orders to ASSIGNED
      await tx.deliveryOrder.updateMany({
        where: { routeId: id },
        data: { status: "ASSIGNED" },
      });

      return updated;
    });
  }

  async arriveAtStop(tenantId: string, routeId: string, stopId: string) {
    const route = await this.findOne(tenantId, routeId);

    if (route.status !== "IN_PROGRESS") {
      throw new BadRequestException("Route is not in progress");
    }

    const stop = route.stops.find((s) => s.id === stopId);
    if (!stop) {
      throw new NotFoundException("Route stop not found");
    }
    if (stop.status !== "PENDING") {
      throw new BadRequestException("Stop is not in PENDING status");
    }

    return this.prisma.routeStop.update({
      where: { id: stopId },
      data: {
        status: "ARRIVED",
        actualArrival: new Date(),
      },
    });
  }

  async completeStop(tenantId: string, routeId: string, stopId: string) {
    const route = await this.findOne(tenantId, routeId);

    if (route.status !== "IN_PROGRESS") {
      throw new BadRequestException("Route is not in progress");
    }

    const stop = route.stops.find((s) => s.id === stopId);
    if (!stop) {
      throw new NotFoundException("Route stop not found");
    }
    if (stop.status !== "ARRIVED" && stop.status !== "PENDING") {
      throw new BadRequestException("Stop must be ARRIVED or PENDING to complete");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.routeStop.update({
        where: { id: stopId },
        data: {
          status: "COMPLETED",
          actualDeparture: new Date(),
        },
      });

      await tx.route.update({
        where: { id: routeId },
        data: { completedStops: { increment: 1 } },
      });

      return updated;
    });
  }

  async skipStop(tenantId: string, routeId: string, stopId: string, notes?: string) {
    const route = await this.findOne(tenantId, routeId);

    if (route.status !== "IN_PROGRESS") {
      throw new BadRequestException("Route is not in progress");
    }

    const stop = route.stops.find((s) => s.id === stopId);
    if (!stop) {
      throw new NotFoundException("Route stop not found");
    }

    return this.prisma.routeStop.update({
      where: { id: stopId },
      data: {
        status: "SKIPPED",
        notes,
      },
    });
  }

  async complete(tenantId: string, id: string) {
    const route = await this.findOne(tenantId, id);

    if (route.status !== "IN_PROGRESS") {
      throw new BadRequestException("Route can only be completed from IN_PROGRESS status");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.route.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: { driver: true, vehicle: true, branch: true },
      });

      // Set vehicle back to AVAILABLE
      if (route.vehicleId) {
        await tx.vehicle.update({
          where: { id: route.vehicleId },
          data: { status: "AVAILABLE" },
        });
      }

      // Set remaining PENDING stops to SKIPPED
      await tx.routeStop.updateMany({
        where: { routeId: id, status: "PENDING" },
        data: { status: "SKIPPED" },
      });

      return updated;
    });
  }

  async cancel(tenantId: string, id: string) {
    const route = await this.findOne(tenantId, id);

    if (route.status !== "PLANNED") {
      throw new BadRequestException("Only PLANNED routes can be cancelled");
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.route.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { driver: true, vehicle: true, branch: true },
      });

      // Remove routeId from delivery orders
      await tx.deliveryOrder.updateMany({
        where: { routeId: id },
        data: {
          routeId: null,
          driverId: null,
          vehicleId: null,
        },
      });

      return updated;
    });
  }

  async getDashboard(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      availableDrivers,
      availableVehicles,
      activeRoutes,
      plannedRoutes,
      completedToday,
    ] = await Promise.all([
      this.prisma.driver.count({
        where: { tenantId, status: "ACTIVE" },
      }),
      this.prisma.vehicle.count({
        where: { tenantId, status: "AVAILABLE" },
      }),
      this.prisma.route.count({
        where: { tenantId, status: "IN_PROGRESS" },
      }),
      this.prisma.route.count({
        where: { tenantId, status: "PLANNED" },
      }),
      this.prisma.route.count({
        where: {
          tenantId,
          status: "COMPLETED",
          completedAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    return {
      availableDrivers,
      availableVehicles,
      activeRoutes,
      plannedRoutes,
      completedToday,
    };
  }
}
