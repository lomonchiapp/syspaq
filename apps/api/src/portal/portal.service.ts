import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { RegisterCustomerDto } from "@/customers/dto/register-customer.dto";
import { PortalLoginDto } from "./dto/portal-login.dto";

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getConfig(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        portalCompanyName: true,
        portalLogo: true,
        portalPrimaryColor: true,
        portalBgImage: true,
        portalWelcomeText: true,
      },
    });

    if (!tenant) throw new NotFoundException("Tenant not found");

    const branches = await this.prisma.branch.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, type: true, address: true },
    });

    return {
      companyName: tenant.portalCompanyName ?? tenant.name,
      logo: tenant.portalLogo ?? null,
      primaryColor: tenant.portalPrimaryColor ?? "#01b9bf",
      bgImage: tenant.portalBgImage ?? null,
      welcomeText: tenant.portalWelcomeText ?? `Bienvenido a ${tenant.portalCompanyName ?? tenant.name}`,
      branches,
    };
  }

  async login(slug: string, dto: PortalLoginDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const customer = await this.prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        email: dto.email.toLowerCase().trim(),
        isActive: true,
      },
    });

    if (!customer) {
      throw new UnauthorizedException("Correo o contraseña incorrectos");
    }

    const valid = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Correo o contraseña incorrectos");
    }

    const secret = this.config.get<string>("customerJwtSecret");
    const accessToken = jwt.sign(
      {
        sub: customer.id,
        tenantId: customer.tenantId,
        email: customer.email,
        type: "customer",
      },
      secret!,
      { expiresIn: "7d" },
    );

    return {
      access_token: accessToken,
      token_type: "Bearer" as const,
      expires_in: 604800,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        casillero: customer.casillero,
      },
    };
  }

  async getMe(customerId: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        casillero: true,
        createdAt: true,
      },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    return customer;
  }

  async getShipments(customerId: string, tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where: { customerId, tenantId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          trackingNumber: true,
          reference: true,
          currentPhase: true,
          createdAt: true,
          events: {
            orderBy: { occurredAt: "desc" },
            take: 1,
            select: { type: true, rawStatus: true, occurredAt: true },
          },
        },
      }),
      this.prisma.shipment.count({ where: { customerId, tenantId } }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getShipmentTracking(customerId: string, tenantId: string, shipmentId: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, customerId, tenantId },
      include: {
        events: { orderBy: { occurredAt: "desc" } },
      },
    });
    if (!shipment) throw new NotFoundException("Shipment not found");
    return shipment;
  }

  async getInvoices(customerId: string, tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException("Customer not found");

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { customerId, tenantId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          number: true,
          total: true,
          currency: true,
          status: true,
          dueAt: true,
          createdAt: true,
        },
      }),
      this.prisma.invoice.count({ where: { customerId, tenantId } }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async register(slug: string, dto: RegisterCustomerDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    // Validate preferred branch if provided
    if (dto.preferredBranchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.preferredBranchId, tenantId: tenant.id, isActive: true },
      });
      if (!branch) throw new BadRequestException("Branch not found");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      // Generate casillero and create customer in a transaction
      const customer = await this.prisma.$transaction(async (tx) => {
        const t = await tx.tenant.update({
          where: { id: tenant.id },
          data: { casilleroCounter: { increment: 1 } },
        });
        const casillero = `${t.casilleroPrefix}-${String(t.casilleroCounter).padStart(5, "0")}`;

        return tx.customer.create({
          data: {
            tenantId: tenant.id,
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

      // Generate JWT using the same pattern as login()
      const secret = this.config.get<string>("customerJwtSecret");
      const accessToken = jwt.sign(
        {
          sub: customer.id,
          tenantId: customer.tenantId,
          email: customer.email,
          type: "customer",
        },
        secret!,
        { expiresIn: "7d" },
      );

      return {
        access_token: accessToken,
        token_type: "Bearer" as const,
        expires_in: 604800,
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          casillero: customer.casillero,
        },
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException("Email already registered");
      }
      throw e;
    }
  }

  /** Public tracking — no auth, just tracking number */
  async publicTracking(slug: string, trackingNumber: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const shipment = await this.prisma.shipment.findFirst({
      where: { tenantId: tenant.id, trackingNumber },
      select: {
        trackingNumber: true,
        reference: true,
        currentPhase: true,
        createdAt: true,
        events: {
          orderBy: { occurredAt: "desc" },
          select: { type: true, rawStatus: true, occurredAt: true, location: true },
        },
      },
    });

    if (!shipment) throw new NotFoundException("Tracking number not found");
    return shipment;
  }
}
