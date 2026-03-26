import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { ListQueryDto } from "./dto/list-query.dto";

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        tenantId,
        plate: dto.plate,
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        type: dto.type,
        capacityWeightLbs: dto.capacityWeightLbs,
        capacityVolumeCbft: dto.capacityVolumeCbft,
        currentBranchId: dto.currentBranchId,
        fuelType: dto.fuelType,
      },
      include: { currentBranch: true },
    });
  }

  async list(tenantId: string, query: ListQueryDto & { type?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.VehicleWhereInput = { tenantId };

    if (query.status) {
      where.status = query.status as any;
    }
    if (query.type) {
      where.type = query.type as any;
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { currentBranch: true },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: {
        currentBranch: true,
        drivers: true,
      },
    });
    if (!vehicle) {
      throw new NotFoundException("Vehicle not found");
    }
    return vehicle;
  }

  async update(tenantId: string, id: string, dto: UpdateVehicleDto) {
    await this.findOne(tenantId, id);
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        plate: dto.plate,
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        type: dto.type,
        capacityWeightLbs: dto.capacityWeightLbs,
        capacityVolumeCbft: dto.capacityVolumeCbft,
        currentBranchId: dto.currentBranchId,
        fuelType: dto.fuelType,
        status: dto.status,
        mileage: dto.mileage,
      },
    });
  }
}
