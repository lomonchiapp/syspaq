import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { ListQueryDto } from "./dto/list-query.dto";

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateDriverDto) {
    return this.prisma.driver.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        licenseNumber: dto.licenseNumber,
        licenseType: dto.licenseType,
        vehicleId: dto.vehicleId,
      },
      include: { vehicle: true },
    });
  }

  async list(tenantId: string, query: ListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.DriverWhereInput = { tenantId };

    if (query.status) {
      where.status = query.status as any;
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.driver.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          vehicle: true,
          _count: { select: { deliveryOrders: true } },
        },
      }),
      this.prisma.driver.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const driver = await this.prisma.driver.findFirst({
      where: { id, tenantId },
      include: {
        vehicle: true,
        deliveryOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        routes: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
    if (!driver) {
      throw new NotFoundException("Driver not found");
    }
    return driver;
  }

  async update(tenantId: string, id: string, dto: UpdateDriverDto) {
    await this.findOne(tenantId, id);
    return this.prisma.driver.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        licenseNumber: dto.licenseNumber,
        licenseType: dto.licenseType,
        vehicleId: dto.vehicleId,
        status: dto.status,
      },
    });
  }

  async getActiveLocations(tenantId: string) {
    const sessions = await this.prisma.driverSession.findMany({
      where: {
        tenantId,
        status: "ACTIVE",
      },
      include: {
        driver: {
          include: { vehicle: true },
        },
      },
    });

    return sessions.map((s) => ({
      driverId: s.driverId,
      driverName: `${s.driver.firstName} ${s.driver.lastName}`,
      lastLocation: s.lastLocation,
      lastLocationAt: s.lastLocationAt,
      vehiclePlate: s.driver.vehicle?.plate ?? null,
    }));
  }
}
