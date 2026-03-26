import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "@/prisma/prisma.service";
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

    return {
      companyName: tenant.portalCompanyName ?? tenant.name,
      logo: tenant.portalLogo ?? null,
      primaryColor: tenant.portalPrimaryColor ?? "#01b9bf",
      bgImage: tenant.portalBgImage ?? null,
      welcomeText: tenant.portalWelcomeText ?? `Bienvenido a ${tenant.portalCompanyName ?? tenant.name}`,
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
