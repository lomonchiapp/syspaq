import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { DriverLoginDto } from "./dto/driver-login.dto";
import { StartSessionDto } from "./dto/start-session.dto";
import { LocationPingDto } from "./dto/location-ping.dto";
import { ScanBarcodeDto } from "./dto/scan-barcode.dto";
import { CompleteMobileDeliveryDto, FailMobileDeliveryDto } from "./dto/complete-delivery.dto";

@Injectable()
export class MobileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /* ── Auth ── */

  async login(dto: DriverLoginDto) {
    const driver = await this.prisma.driver.findFirst({
      where: { tenantId: dto.tenantId, phone: dto.phone, status: "ACTIVE" },
    });
    if (!driver) throw new UnauthorizedException("Conductor no encontrado");
    if (!driver.pinHash) throw new UnauthorizedException("PIN no configurado");

    const valid = await bcrypt.compare(dto.pin, driver.pinHash);
    if (!valid) throw new UnauthorizedException("PIN invalido");

    const secret = this.config.get<string>("jwtSecret");
    const token = jwt.sign(
      { sub: driver.id, tenantId: dto.tenantId, type: "driver" },
      secret!,
      { expiresIn: "12h" },
    );

    return {
      access_token: token,
      token_type: "Bearer",
      expires_in: 43200,
      driver: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        phone: driver.phone,
      },
    };
  }

  /* ── Sessions ── */

  async startSession(tenantId: string, driverId: string, dto: StartSessionDto) {
    const existing = await this.prisma.driverSession.findFirst({
      where: { tenantId, driverId, status: "ACTIVE" },
    });
    if (existing) throw new BadRequestException("Ya hay una sesion activa");

    return this.prisma.driverSession.create({
      data: {
        tenantId,
        driverId,
        startLocation: dto.location ? { lat: dto.location.lat, lng: dto.location.lng } : undefined,
        deviceInfo: dto.deviceInfo ? JSON.parse(JSON.stringify(dto.deviceInfo)) : undefined,
      },
    });
  }

  async endSession(tenantId: string, driverId: string) {
    const session = await this.prisma.driverSession.findFirst({
      where: { tenantId, driverId, status: "ACTIVE" },
    });
    if (!session) throw new NotFoundException("No hay sesion activa");

    return this.prisma.driverSession.update({
      where: { id: session.id },
      data: { status: "ENDED", endedAt: new Date() },
    });
  }

  async locationPing(tenantId: string, driverId: string, dto: LocationPingDto) {
    const session = await this.prisma.driverSession.findFirst({
      where: { tenantId, driverId, status: "ACTIVE" },
    });
    if (!session) throw new NotFoundException("No hay sesion activa");

    if (dto.pings.length === 0) return { recorded: 0 };

    await this.prisma.locationPing.createMany({
      data: dto.pings.map((p) => ({
        sessionId: session.id,
        lat: p.lat,
        lng: p.lng,
        accuracy: p.accuracy,
        speed: p.speed,
        heading: p.heading,
        recordedAt: new Date(p.recordedAt),
      })),
    });

    const latest = dto.pings.reduce((a, b) =>
      new Date(a.recordedAt) > new Date(b.recordedAt) ? a : b,
    );

    await this.prisma.driverSession.update({
      where: { id: session.id },
      data: {
        lastLocation: { lat: latest.lat, lng: latest.lng },
        lastLocationAt: new Date(latest.recordedAt),
      },
    });

    return { recorded: dto.pings.length };
  }

  /* ── Routes ── */

  async getActiveRoute(tenantId: string, driverId: string) {
    const route = await this.prisma.route.findFirst({
      where: { tenantId, driverId, status: "IN_PROGRESS" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        stops: {
          orderBy: { sequence: "asc" },
          include: {
            deliveryOrder: {
              include: {
                shipment: { select: { id: true, trackingNumber: true } },
                customer: { select: { id: true, firstName: true, lastName: true, casillero: true } },
              },
            },
          },
        },
      },
    });

    return route;
  }

  /* ── Scan ── */

  async scan(tenantId: string, dto: ScanBarcodeDto) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { tenantId, trackingNumber: dto.barcode },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, casillero: true } },
      },
    });

    if (!shipment) {
      return { found: false, barcode: dto.barcode };
    }

    const deliveryOrder = await this.prisma.deliveryOrder.findFirst({
      where: { tenantId, shipmentId: shipment.id, status: { in: ["PENDING", "ASSIGNED", "IN_TRANSIT"] } },
    });

    return {
      found: true,
      barcode: dto.barcode,
      shipment: {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        currentPhase: shipment.currentPhase,
        customer: shipment.customer,
      },
      deliveryOrder: deliveryOrder
        ? { id: deliveryOrder.id, number: deliveryOrder.number, status: deliveryOrder.status }
        : null,
    };
  }

  /* ── Deliveries ── */

  async arriveAtDelivery(tenantId: string, driverId: string, deliveryOrderId: string) {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: { id: deliveryOrderId, tenantId, driverId },
    });
    if (!order) throw new NotFoundException("Orden de entrega no encontrada");

    if (order.status === "ASSIGNED") {
      await this.prisma.deliveryOrder.update({
        where: { id: deliveryOrderId },
        data: { status: "IN_TRANSIT" },
      });
    }

    const routeStop = await this.prisma.routeStop.findFirst({
      where: { deliveryOrderId, status: "PENDING" },
    });
    if (routeStop) {
      await this.prisma.routeStop.update({
        where: { id: routeStop.id },
        data: { status: "ARRIVED", actualArrival: new Date() },
      });
    }

    return { status: "arrived" };
  }

  async completeDelivery(tenantId: string, driverId: string, deliveryOrderId: string, dto: CompleteMobileDeliveryDto) {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: { id: deliveryOrderId, tenantId, driverId },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundException("Orden de entrega no encontrada");
    if (!["ASSIGNED", "IN_TRANSIT"].includes(order.status)) {
      throw new BadRequestException("La orden no esta en estado valido para completar");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryOrder.update({
        where: { id: deliveryOrderId },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
          signatureUrl: dto.signatureUrl,
          signatureContact: dto.signatureContact,
          signatureIdType: dto.signatureIdType,
          signatureId: dto.signatureId,
          photoUrl: dto.photoUrl,
          notes: dto.notes,
        },
      });

      await tx.shipment.update({
        where: { id: order.shipmentId },
        data: { currentPhase: "DELIVERED" },
      });

      await tx.trackingEvent.create({
        data: {
          tenantId,
          shipmentId: order.shipmentId,
          type: "DELIVERED",
          location: dto.location ? { lat: dto.location.lat, lng: dto.location.lng } : undefined,
          source: "SCAN",
          occurredAt: new Date(),
        },
      });
    });

    const routeStop = await this.prisma.routeStop.findFirst({
      where: { deliveryOrderId, status: { in: ["PENDING", "ARRIVED"] } },
    });
    if (routeStop) {
      await this.prisma.routeStop.update({
        where: { id: routeStop.id },
        data: { status: "COMPLETED", actualDeparture: new Date() },
      });
      await this.prisma.route.update({
        where: { id: routeStop.routeId },
        data: { completedStops: { increment: 1 } },
      });
    }

    return { status: "delivered" };
  }

  async failDelivery(tenantId: string, driverId: string, deliveryOrderId: string, dto: FailMobileDeliveryDto) {
    const order = await this.prisma.deliveryOrder.findFirst({
      where: { id: deliveryOrderId, tenantId, driverId },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundException("Orden de entrega no encontrada");

    await this.prisma.$transaction(async (tx) => {
      await tx.deliveryOrder.update({
        where: { id: deliveryOrderId },
        data: {
          status: "FAILED",
          failReason: dto.failReason,
          photoUrl: dto.photoUrl,
          notes: dto.notes,
        },
      });

      await tx.trackingEvent.create({
        data: {
          tenantId,
          shipmentId: order.shipmentId,
          type: "EXCEPTION",
          rawStatus: dto.failReason,
          location: dto.location ? { lat: dto.location.lat, lng: dto.location.lng } : undefined,
          source: "SCAN",
          occurredAt: new Date(),
        },
      });

      await tx.shipment.update({
        where: { id: order.shipmentId },
        data: { currentPhase: "EXCEPTION" },
      });
    });

    const routeStop = await this.prisma.routeStop.findFirst({
      where: { deliveryOrderId, status: { in: ["PENDING", "ARRIVED"] } },
    });
    if (routeStop) {
      await this.prisma.routeStop.update({
        where: { id: routeStop.id },
        data: { status: "SKIPPED", notes: dto.failReason },
      });
    }

    return { status: "failed" };
  }

  async getPendingDeliveries(tenantId: string, driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await this.prisma.deliveryOrder.findMany({
      where: {
        tenantId,
        driverId,
        status: { in: ["ASSIGNED", "IN_TRANSIT"] },
      },
      include: {
        shipment: { select: { id: true, trackingNumber: true } },
        customer: { select: { id: true, firstName: true, lastName: true, casillero: true, phone: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return { data: orders };
  }

  async getDailySummary(tenantId: string, driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [completed, failed, pending] = await Promise.all([
      this.prisma.deliveryOrder.count({
        where: { tenantId, driverId, status: "DELIVERED", deliveredAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.deliveryOrder.count({
        where: { tenantId, driverId, status: "FAILED", updatedAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.deliveryOrder.count({
        where: { tenantId, driverId, status: { in: ["ASSIGNED", "IN_TRANSIT"] } },
      }),
    ]);

    return { completed, failed, pending, total: completed + failed + pending };
  }
}
