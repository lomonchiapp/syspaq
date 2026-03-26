import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "@/prisma/prisma.service";
import { CustomerAuthService } from "./customer-auth.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerAuth: CustomerAuthService
  ) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    try {
      const customer = await this.prisma.$transaction(async (tx) => {
        const casillero =
          dto.casillero ??
          (await this.customerAuth.generateCasillero(tenantId, tx));

        return tx.customer.create({
          data: {
            tenantId,
            email: dto.email.toLowerCase().trim(),
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            idType: dto.idType,
            idNumber: dto.idNumber,
            preferredBranchId: dto.preferredBranchId,
            casillero,
          },
        });
      });

      return this.sanitize(customer);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException(
          "A customer with this email already exists for this tenant"
        );
      }
      throw e;
    }
  }

  async list(tenantId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { casillero: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { preferredBranch: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: items.map((c) => this.sanitize(c)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: { preferredBranch: { select: { id: true, name: true, code: true } } },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    return this.sanitize(customer);
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(tenantId, id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.idType !== undefined && { idType: dto.idType }),
        ...(dto.idNumber !== undefined && { idNumber: dto.idNumber }),
        ...(dto.address !== undefined && {
          address: dto.address as Prisma.InputJsonValue,
        }),
      },
    });

    return this.sanitize(customer);
  }

  async softDelete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return this.sanitize(customer);
  }

  async listShipments(
    tenantId: string,
    customerId: string,
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where: { tenantId, customerId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.shipment.count({ where: { tenantId, customerId } }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private sanitize<T extends { passwordHash?: unknown }>(
    customer: T
  ): Omit<T, "passwordHash"> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = customer;
    return rest as Omit<T, "passwordHash">;
  }
}
